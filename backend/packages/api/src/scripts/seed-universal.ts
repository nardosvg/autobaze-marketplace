import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  AttributeType,
  ProductStatus,
  type CreateOfferDTO,
  type CreateProductDTO,
} from "@mercurjs/types";
import { createOffersWorkflow, createProductsWorkflow } from "@mercurjs/core/workflows";
import { createProductCategoriesWorkflow } from "@medusajs/medusa/core-flows";
import { Client } from "pg";

// ---------------------------------------------------------------------------
// Seed DEV a partir do CATALOGO UNIVERSAL AutoBaze (substitui a base A. Silva
// do POC): categorias reais (departamento curado + categoria fina do master)
// e ~90 produtos canonicos com foto, aplicacao e preco real dos tenants.
//
// Requer o tunnel do Postgres do app (porta 5433) e a env APP_DB_URL, ex.:
//   APP_DB_URL=postgresql://user:senha@localhost:5433/postgres \
//     npx medusa exec ./src/scripts/seed-universal.ts
//
// Idempotente: roda de novo sem duplicar (handle por master_id). Os produtos
// antigos do POC (nao vindos do universal) sao despublicados, nao apagados.
// ---------------------------------------------------------------------------

const DEPARTAMENTOS = [
  "Motor e Distribuição",
  "Suspensão e Direção",
  "Freios",
  "Transmissão e Embreagem",
  "Arrefecimento",
  "Filtros",
  "Elétrica e Ignição",
  "Óleos e Fluidos",
  "Acessórios e Carroceria",
  "Diversos",
];

// Mesmo mapeamento do sync do app (categoria real -> departamento curado)
function departamentoDaCategoria(categoria: string): string {
  const n = categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  if (/filtro/.test(n)) return "Filtros";
  if (/oleo|fluido|aditivo|lubrific|graxa/.test(n)) return "Óleos e Fluidos";
  if (/freio|pastilha|disco|tambor|sapata|cuica|abs/.test(n)) return "Freios";
  if (/embreagem|cambio|transmiss|diferencial|semi ?eixo|homocinetic|trizeta/.test(n))
    return "Transmissão e Embreagem";
  if (/arrefec|radiador|bomba d|termostat|ventoinha|intercooler|expansao/.test(n))
    return "Arrefecimento";
  if (/vela|bobina|sonda|sensor|alternador|partida|eletric|ignic|lampada|farol|lanterna|chicote|bateria|rele|fusivel/.test(n))
    return "Elétrica e Ignição";
  if (/amortecedor|suspens|bandeja|pivo|bieleta|terminal|coxim|batente|bucha|barra estab|cubo de roda|rolamento|direcao|caixa de direcao|mobkit|kit amortecedor|molas?|axial/.test(n))
    return "Suspensão e Direção";
  if (/motor|junta|cabecote|pistao|virabrequim|comando|correia|tensor|tension|polia|distribui|bronzina|anel|carter|coletor|turbina|turbo|valvula|retentor|jogos|bomba de oleo|bomba de combustivel/.test(n))
    return "Motor e Distribuição";
  if (/parachoque|retrovisor|macaneta|grade|palheta|carroceria|acabamento|friso|capo|paralama|vidro/.test(n))
    return "Acessórios e Carroceria";
  return "Diversos";
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type MasterRow = {
  id: string;
  nome: string;
  foto_url: string;
  aplicacao_texto: string | null;
  categoria_nome: string;
  marca_nome: string | null;
  codigo_fabricante: string | null;
  ean: string | null;
  preco: number;
  estoque: number;
};

const POR_DEPARTAMENTO = 10;

export default async function seedUniversal({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const productModule = container.resolve(Modules.PRODUCT);

  const appDbUrl = process.env.APP_DB_URL;
  if (!appDbUrl) {
    throw new Error(
      "APP_DB_URL não definida (tunnel do Postgres do app na 5433). Abortando."
    );
  }

  // -------------------------------------------------------------------------
  // 1. Amostra do catalogo universal (via tunnel): masters com foto, categoria
  //    e preco real de tenant, diversificados por departamento.
  // -------------------------------------------------------------------------
  logger.info("[universal] Consultando o catálogo universal do AutoBaze...");
  const app = new Client({ connectionString: appDbUrl });
  await app.connect();
  const { rows: candidatos } = await app.query<MasterRow>(`
    SELECT m.id, m.nome, m.foto_url, m.aplicacao_texto,
           c.nome AS categoria_nome, mc.nome AS marca_nome,
           m.codigo_fabricante, m.ean,
           round(avg(p.preco_venda)::numeric, 2)::float8 AS preco,
           greatest(1, sum(greatest(p.estoque_atual, 0)))::int AS estoque
    FROM catalogo_produtos_master m
    JOIN catalogo_categoria c ON c.id = m.categoria_id
    LEFT JOIN catalogo_marcas mc ON mc.id = m.marca_id
    JOIN produtos p ON p.catalogo_master_id = m.id AND p.ativo AND p.preco_venda > 0
    WHERE m.foto_url IS NOT NULL AND m.foto_url <> ''
      AND m.nome IS NOT NULL AND length(m.nome) > 8
    GROUP BY m.id, m.nome, m.foto_url, m.aplicacao_texto, c.nome, mc.nome,
             m.codigo_fabricante, m.ean
    ORDER BY count(p.id) DESC, m.id
    LIMIT 800
  `);
  await app.end();
  logger.info(`[universal] ${candidatos.length} masters vendáveis candidatos.`);

  // Round-robin por departamento pra diversificar a home
  const porDep = new Map<string, MasterRow[]>();
  for (const row of candidatos) {
    const dep = departamentoDaCategoria(row.categoria_nome);
    if (!porDep.has(dep)) porDep.set(dep, []);
    porDep.get(dep)!.push(row);
  }
  const escolhidos: (MasterRow & { departamento: string })[] = [];
  for (const dep of DEPARTAMENTOS) {
    for (const row of (porDep.get(dep) ?? []).slice(0, POR_DEPARTAMENTO)) {
      escolhidos.push({ ...row, departamento: dep });
    }
  }
  logger.info(`[universal] ${escolhidos.length} produtos escolhidos.`);

  // -------------------------------------------------------------------------
  // 2. Categorias: departamentos na raiz + categoria fina como filha
  // -------------------------------------------------------------------------
  const todasCats = await productModule.listProductCategories(
    {},
    { take: 2000, select: ["id", "name", "parent_category_id", "is_active"] }
  );
  const catPorChave = new Map(
    todasCats.map((c) => [`${c.parent_category_id ?? ""}|${c.name}`, c])
  );

  const ensureCat = async (nome: string, parentId?: string, rank = 0) => {
    const chave = `${parentId ?? ""}|${nome}`;
    const existente = catPorChave.get(chave);
    if (existente) return existente.id;
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: nome,
            is_active: true,
            rank,
            ...(parentId ? { parent_category_id: parentId } : {}),
          },
        ],
      },
    });
    catPorChave.set(chave, result[0] as any);
    return result[0].id;
  };

  const depIds = new Map<string, string>();
  for (const [i, dep] of DEPARTAMENTOS.entries()) {
    depIds.set(dep, await ensureCat(dep, undefined, i));
  }
  logger.info("[universal] Departamentos garantidos.");

  // Desativa as categorias ASCII do POC antigo (nav limpa)
  const antigas = todasCats.filter(
    (c) =>
      !c.parent_category_id &&
      c.is_active &&
      ["Motor e Distribuicao", "Suspensao e Direcao", "Eletrica"].includes(c.name)
  );
  if (antigas.length) {
    for (const c of antigas) {
      await productModule.updateProductCategories(c.id, { is_active: false } as any);
    }
    logger.info(`[universal] ${antigas.length} categorias antigas desativadas.`);
  }

  // -------------------------------------------------------------------------
  // 3. Sellers locais (do seed do POC) pra criar as ofertas
  // -------------------------------------------------------------------------
  const { data: sellersData } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "email"],
    filters: { email: ["asilva@demo.autobaze.com.br", "selmo@demo.autobaze.com.br"] },
  });
  if (!sellersData.length) {
    throw new Error("Sellers do POC não encontrados — rode o seed-autobaze antes.");
  }
  const sellers = [] as {
    id: string;
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  }[];
  const { data: perfis } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
    filters: { name: "Marketplace Shipping" },
  });
  const shippingProfileId = perfis[0]?.id;
  if (!shippingProfileId) throw new Error("Shipping profile Marketplace não encontrado");

  for (const s of sellersData) {
    const { data: members } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: s.email },
    });
    const { data: locs } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
      filters: { name: `${s.name} Estoque` },
    });
    if (!members[0] || !locs[0]) {
      throw new Error(`Member/estoque do seller ${s.name} não encontrado`);
    }
    sellers.push({
      id: s.id,
      memberId: members[0].id,
      stockLocationId: locs[0].id,
      shippingProfileId,
    });
  }

  // Atributo global Condicao (mesmo do POC)
  const { data: attrs } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "handle", "values.id", "values.name"],
    filters: { handle: ["condicao"], product_id: null },
  });
  const condicaoAttr = attrs[0];
  if (!condicaoAttr) throw new Error("Atributo Condicao não encontrado — rode o seed-autobaze antes.");
  const novoValueId = (condicaoAttr.values as { id: string; name: string }[]).find(
    (v) => v.name === "Novo"
  )?.id;

  // -------------------------------------------------------------------------
  // 4. Produtos canonicos (pula os ja criados) + subcategorias finas
  // -------------------------------------------------------------------------
  const handles = escolhidos.map((m) => `${slugify(m.nome)}-${m.id.slice(0, 8)}`);
  const { data: jaExistem } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: handles },
  });
  const handleExistente = new Set(jaExistem.map((p: any) => p.handle));

  const novos = escolhidos.filter(
    (m, i) => !handleExistente.has(handles[i])
  );
  logger.info(`[universal] ${novos.length} produtos novos pra criar (${handleExistente.size} já existiam).`);

  const products: CreateProductDTO[] = [];
  for (const m of novos) {
    const depId = depIds.get(m.departamento)!;
    const categoryIds = [depId];
    if (m.categoria_nome && m.categoria_nome !== m.departamento) {
      categoryIds.push(await ensureCat(m.categoria_nome, depId));
    }
    const handle = `${slugify(m.nome)}-${m.id.slice(0, 8)}`;
    const sku =
      (m.codigo_fabricante || m.ean || handle)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-") + `-${m.id.slice(0, 4)}`;
    products.push({
      title: m.nome,
      handle,
      status: ProductStatus.PUBLISHED,
      description: m.aplicacao_texto || m.nome,
      category_ids: categoryIds,
      metadata: {
        catalogo_master_id: m.id,
        ...(m.marca_nome ? { marca: m.marca_nome } : {}),
      },
      weight: 500,
      thumbnail: m.foto_url,
      images: [{ url: m.foto_url }],
      attributes: novoValueId
        ? [{ id: condicaoAttr.id, value_ids: [novoValueId] }]
        : [],
      variants: [{ title: "Unidade", sku: `MST-${sku}`, options: { Condicao: "Novo" } }],
    });
  }

  if (products.length) {
    await createProductsWorkflow(container).run({
      input: { created_by: sellers[0].memberId, products },
    });
    logger.info(`[universal] ${products.length} produtos criados.`);
  }

  // -------------------------------------------------------------------------
  // 5. Ofertas: A. Silva com preco real; Selmo em ~metade com variacao leve
  // -------------------------------------------------------------------------
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const { data: produtosMercur } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: { handle: handles },
  });
  const masterPorHandle = new Map(
    escolhidos.map((m, i) => [handles[i], m])
  );

  // Ofertas ja existentes (idempotencia)
  const { data: ofertasExistentes } = await query.graph({
    entity: "offer",
    fields: ["id", "variant_id", "seller_id"],
  });
  const temOferta = new Set(
    (ofertasExistentes as { variant_id: string; seller_id?: string }[]).map(
      (o: any) => `${o.seller_id ?? ""}|${o.variant_id}`
    )
  );

  const offers: CreateOfferDTO[] = [];
  for (const p of produtosMercur) {
    const m = masterPorHandle.get((p as any).handle);
    if (!m) continue;
    const variant = (p as any).variants?.[0];
    if (!variant) continue;
    const precoBase = Math.max(1, Number(m.preco) || 50);
    const estoque = Math.min(500, Math.max(3, Number(m.estoque) || 3));

    for (const [i, seller] of sellers.entries()) {
      if (i > 0 && rand() > 0.5) continue; // Selmo so em ~metade (buybox demo)
      if (temOferta.has(`${seller.id}|${variant.id}`)) continue;
      const preco =
        i === 0
          ? precoBase
          : Math.max(1, Math.round(precoBase * (0.92 + rand() * 0.2) * 100) / 100);
      const sku = `OFFER-${seller.id.slice(-4)}-${variant.sku}`;
      offers.push({
        seller_id: seller.id,
        created_by: seller.memberId,
        sku,
        variant_id: variant.id,
        shipping_profile_id: seller.shippingProfileId,
        inventory_items: [
          {
            sku,
            stock_levels: [
              { location_id: seller.stockLocationId, stocked_quantity: estoque },
            ],
          },
        ],
        prices: [{ amount: preco, currency_code: "brl" }],
      });
    }
  }
  if (offers.length) {
    await createOffersWorkflow(container).run({ input: { offers } });
    logger.info(`[universal] ${offers.length} ofertas criadas.`);
  }

  // -------------------------------------------------------------------------
  // 6. Despublica os produtos do POC antigo (sem metadata do universal)
  // -------------------------------------------------------------------------
  const { data: todosProdutos } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status", "metadata"],
  });
  const antigos = (todosProdutos as any[]).filter(
    (p) => p.status === "published" && !p.metadata?.catalogo_master_id
  );
  if (antigos.length) {
    for (const p of antigos) {
      await productModule.updateProducts(p.id, { status: ProductStatus.DRAFT } as any);
    }
    logger.info(`[universal] ${antigos.length} produtos do POC antigo despublicados.`);
  }

  logger.info("[universal] Seed do catálogo universal concluído.");
}
