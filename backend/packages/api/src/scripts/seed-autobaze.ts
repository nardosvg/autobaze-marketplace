import fs from "fs";
import path from "path";
import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  ProductStatus,
  type CreateOfferDTO,
  type CreateProductDTO,
} from "@mercurjs/types";
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// POC AutoBaze Marketplace: catalogo real (amostra A. SILVA & GOULART) com 2
// sellers ofertando os mesmos produtos, regiao Brasil/BRL.

type ProdutoAutoBaze = {
  id: string;
  codigo_interno: string | null;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  marca: string | null;
  unidade: string | null;
  estoque_atual: number;
  preco_venda: number;
  preco_marketplace: number | null;
  ncm: string | null;
  imagem_url: string | null;
  aplicacao_texto: string | null;
  peso_kg: number | null;
};

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    store_id: string;
    supported_currencies: { currency_code: string; is_default?: boolean }[];
  }) => {
    const normalized = transform({ input }, ({ input }) => ({
      selector: { id: input.store_id },
      update: {
        supported_currencies: input.supported_currencies.map((currency) => ({
          currency_code: currency.currency_code,
          is_default: currency.is_default ?? false,
        })),
      },
    }));
    const stores = updateStoresStep(normalized);
    return new WorkflowResponse(stores);
  }
);

export default async function seedAutoBaze({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["br"];

  const dataPath = path.join(__dirname, "data", "asilva-produtos.json");
  const catalogo: ProdutoAutoBaze[] = JSON.parse(
    fs.readFileSync(dataPath, "utf-8")
  );
  // api.operify.com.br e direto-VPS; api.autobaze.com.br passa pelo Cloudflare
  const fixUrl = (url: string) =>
    url.replace("api.operify.com.br", "api.autobaze.com.br");

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        { currency_code: "brl", is_default: true },
        { currency_code: "usd" },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "AutoBaze Marketplace",
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  logger.info("Seeding region data...");
  const regionModuleService = container.resolve(Modules.REGION);
  const existingRegions = await regionModuleService.listRegions(
    {},
    { relations: ["countries"] }
  );

  let region = existingRegions.find((r) =>
    r.countries?.some((c) => c.iso_2 === "br")
  );
  if (!region) {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Brasil",
            currency_code: "brl",
            countries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  }
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions();
  const existingCountryCodes = new Set(
    existingTaxRegions.map((tr) => tr.country_code)
  );
  if (!existingCountryCodes.has("br")) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "br", provider_id: "tp_system" }],
    });
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey;
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token"],
    filters: { type: "publishable" },
  });
  publishableApiKey = apiKeys?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }],
      },
    });
    publishableApiKey = publishableApiKeyResult;
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel[0].id],
      },
    });
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("already"))) {
      throw error;
    }
  }
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product categories...");
  const productModule = container.resolve(Modules.PRODUCT);

  const CATEGORIAS = [
    "Motor e Distribuicao",
    "Suspensao e Direcao",
    "Freios",
    "Arrefecimento",
    "Filtros",
    "Eletrica",
    "Diversos",
  ];

  const existingCats = await productModule.listProductCategories({
    name: CATEGORIAS,
  });
  const catByName = new Map(existingCats.map((c) => [c.name, c]));
  const missing = CATEGORIAS.filter((name) => !catByName.has(name));
  if (missing.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missing.map((name) => ({
          name,
          is_active: true,
          rank: CATEGORIAS.indexOf(name),
        })),
      },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }

  const categoriaDoProduto = (nome: string): string => {
    const n = nome.toLowerCase();
    if (/correia|distribui|tension|polia|coxim do motor|junta|pistao|virabrequim|comando/.test(n))
      return "Motor e Distribuicao";
    if (/coxim|rolamento|amortecedor|bandeja|pivo|terminal|barra|homocinetic|suspens/.test(n))
      return "Suspensao e Direcao";
    if (/pastilha|disco de freio|freio|tambor|cilindro mestre|flexivel/.test(n))
      return "Freios";
    if (/radiador|bomba d|valvula termost|arrefec|ventoinha|reservatorio/.test(n))
      return "Arrefecimento";
    if (/filtro/.test(n)) return "Filtros";
    if (/vela|bobina|alternador|motor de partida|sensor|chicote|farol|lampada/.test(n))
      return "Eletrica";
    return "Diversos";
  };

  logger.info("Seeding global product attributes...");
  const CONDICAO_VALUES = ["Novo", "Usado", "Recondicionado"];
  const ATTRIBUTE_DEFS = [
    { name: "Condicao", handle: "condicao", values: CONDICAO_VALUES },
  ];

  type SeededAttribute = {
    id: string;
    handle: string;
    values: { id: string; name: string }[];
  };

  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: {
        handle: ATTRIBUTE_DEFS.map((a) => a.handle),
        product_id: null,
      },
    });
    return new Map((data as SeededAttribute[]).map((a) => [a.handle, a]));
  };

  let attrByHandle = await loadAttributes();
  const missingAttrs = ATTRIBUTE_DEFS.filter((a) => !attrByHandle.has(a.handle));
  if (missingAttrs.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: missingAttrs.map((attr, index) => ({
          name: attr.name,
          handle: attr.handle,
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          is_filterable: true,
          rank: index,
          values: attr.values.map((name, rank) => ({ name, rank })),
        })),
      },
    });
    attrByHandle = await loadAttributes();
  }
  const condicaoAttr = attrByHandle.get("condicao")!;
  const valueId = (attr: SeededAttribute, name: string) =>
    attr.values.find((v) => v.name === name)?.id;
  logger.info("Finished seeding global product attributes.");

  const SELLER_PASSWORD = "supersecret";
  const SELLER_CONFIGS = [
    {
      name: "A. Silva Autopecas",
      email: "asilva@demo.autobaze.com.br",
      first_name: "Antonio",
      last_name: "Silva",
      city: "Curitiba",
      country_code: "BR",
      address_1: "Rua das Autopecas 100",
    },
    {
      name: "Selmo Autopecas",
      email: "selmo@demo.autobaze.com.br",
      first_name: "Selmo",
      last_name: "Silva",
      city: "Sao Paulo",
      country_code: "BR",
      address_1: "Av. dos Mecanicos 2000",
    },
  ];
  const PRIMARY_SELLER_EMAIL = SELLER_CONFIGS[0].email;

  const sellerLogo = (name: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: PRIMARY_SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info("Sellers ja existem, pulando seed de sellers/produtos/ofertas.");
    logger.info("Finished seeding.");
    return;
  }

  const authModuleService = container.resolve(Modules.AUTH);

  let sharedShippingProfileId: string;
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { name: "Marketplace Shipping" },
  });
  if (existingProfiles[0]) {
    sharedShippingProfileId = existingProfiles[0].id as string;
  } else {
    const {
      result: [createdProfile],
    } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
    });
    sharedShippingProfileId = createdProfile.id;
  }

  type SeededSeller = {
    id: string;
    name: string;
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  };
  const sellers: SeededSeller[] = [];

  for (const [index, sellerConfig] of SELLER_CONFIGS.entries()) {
    logger.info(`Seeding seller "${sellerConfig.name}"...`);

    let authIdentityId: string;
    const registerResponse = await authModuleService.register("emailpass", {
      body: { email: sellerConfig.email, password: SELLER_PASSWORD },
    });
    if (registerResponse.success && registerResponse.authIdentity) {
      authIdentityId = registerResponse.authIdentity.id;
    } else {
      const [providerIdentity] = await authModuleService.listProviderIdentities({
        entity_id: sellerConfig.email,
        provider: "emailpass",
      });
      authIdentityId = providerIdentity.auth_identity_id!;
    }

    const { result: seller } = await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: sellerConfig.email,
        first_name: sellerConfig.first_name,
        last_name: sellerConfig.last_name,
        seller: {
          name: sellerConfig.name,
          email: sellerConfig.email,
          currency_code: "brl",
          description: `${sellerConfig.name} - autopecas com estoque real e nota fiscal.`,
          logo: sellerLogo(sellerConfig.name),
        },
      },
    });

    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    });

    const { data: members } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: sellerConfig.email },
    });
    const memberId = members[0].id;

    const { result: stockLocations } = await createSellerStockLocationsWorkflow(
      container
    ).run({
      input: {
        seller_id: seller.id,
        locations: [
          {
            name: `${sellerConfig.name} Estoque`,
            address: {
              city: sellerConfig.city,
              country_code: sellerConfig.country_code,
              address_1: sellerConfig.address_1,
            },
          },
        ],
      },
    });
    const stockLocation = stockLocations[0];

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    });

    if (index === 0) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: { default_location_id: stockLocation.id },
        },
      });
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: `${sellerConfig.name} entrega`,
          type: "shipping",
        },
      },
    });

    const {
      data: [locationWithSet],
    } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
      filters: { id: stockLocation.id },
    });
    const fulfillmentSetId = locationWithSet?.fulfillment_sets?.[0]?.id;
    if (!fulfillmentSetId) {
      throw new Error(
        `Fulfillment set nao criado para o seller "${sellerConfig.name}"`
      );
    }

    const { result: serviceZones } = await createServiceZonesWorkflow(
      container
    ).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: `${sellerConfig.name} Brasil`,
            geo_zones: countries.map((country_code) => ({
              country_code,
              type: "country" as const,
            })),
          },
        ],
      },
    });
    const serviceZoneId = serviceZones[0].id;

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Envio Padrao",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: sharedShippingProfileId,
            type: {
              label: "Padrao",
              description: "Postado em ate 3 dias uteis.",
              code: "standard",
            },
            prices: [
              { currency_code: "brl", amount: 19.9 },
              { region_id: region.id, amount: 19.9 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Envio Expresso",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: sharedShippingProfileId,
            type: {
              label: "Expresso",
              description: "Postado em 24 horas.",
              code: "express",
            },
            prices: [
              { currency_code: "brl", amount: 39.9 },
              { region_id: region.id, amount: 39.9 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    });

    sellers.push({
      id: seller.id,
      name: sellerConfig.name,
      memberId,
      stockLocationId: stockLocation.id,
      shippingProfileId: sharedShippingProfileId,
    });
    logger.info(`Finished seeding seller "${sellerConfig.name}".`);
  }

  const primarySeller = sellers[0];
  logger.info(`Finished seeding ${sellers.length} sellers.`);

  logger.info("Seeding product data (catalogo A. SILVA)...");

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const usedHandles = new Set<string>();
  const uniqueHandle = (title: string) => {
    const base = slugify(title) || "produto";
    let handle = base;
    let n = 2;
    while (usedHandles.has(handle)) {
      handle = `${base}-${n++}`;
    }
    usedHandles.add(handle);
    return handle;
  };

  const usedSkus = new Set<string>();
  const uniqueSku = (item: ProdutoAutoBaze, handle: string) => {
    const base =
      (item.codigo_interno || item.codigo_barras || handle)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-") || "SKU";
    let sku = base;
    let n = 2;
    while (usedSkus.has(sku)) {
      sku = `${base}-${n++}`;
    }
    usedSkus.add(sku);
    return sku;
  };

  const condicao = "Novo";
  const skuByHandle = new Map<string, string>();

  const products: CreateProductDTO[] = catalogo.map((item) => {
    const handle = uniqueHandle(item.nome);
    const sku = uniqueSku(item, handle);
    skuByHandle.set(handle, sku);
    const imageUrl = item.imagem_url ? fixUrl(item.imagem_url) : null;
    const descricao =
      [item.descricao, item.aplicacao_texto].filter(Boolean).join("\n\n") ||
      item.nome;

    return {
      title: item.nome,
      category_ids: [catByName.get(categoriaDoProduto(item.nome))!.id],
      description: descricao,
      handle,
      weight: item.peso_kg ? Math.round(item.peso_kg * 1000) : 500,
      status: ProductStatus.PUBLISHED,
      thumbnail: imageUrl ?? undefined,
      images: imageUrl ? [{ url: imageUrl }] : [],
      attributes: [
        {
          id: condicaoAttr.id,
          value_ids: [valueId(condicaoAttr, condicao)].filter(
            (id): id is string => Boolean(id)
          ),
        },
      ],
      variants: [
        {
          title: item.unidade || "Unidade",
          sku,
          options: { Condicao: condicao },
        },
      ],
    };
  });

  await createProductsWorkflow(container).run({
    input: {
      created_by: primarySeller.memberId,
      products,
    },
  });
  logger.info(`Finished seeding ${products.length} products.`);

  logger.info("Criando ofertas dos 2 sellers (mesma peca, precos diferentes)...");

  // PRNG deterministico (mulberry32) pra re-seed reproduzivel
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const produtoByHandle = new Map(
    catalogo.map((item, i) => [products[i].handle as string, item])
  );

  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: {
      handle: products
        .map((product) => product.handle)
        .filter((handle): handle is string => Boolean(handle)),
    },
  });

  const offers: CreateOfferDTO[] = [];

  for (const product of seededProducts) {
    const item = produtoByHandle.get(product.handle)!;
    const precoBase = Number(item.preco_marketplace ?? item.preco_venda) || 50;
    const estoque = Math.max(5, Math.round(Number(item.estoque_atual) || 0));

    for (const [sellerIndex, seller] of sellers.entries()) {
      for (const variant of product.variants as {
        id: string;
        sku: string | null;
      }[]) {
        // seller 1 = preco real; seller 2 = jitter de -10% a +15%
        const preco =
          sellerIndex === 0
            ? precoBase
            : Math.max(1, Math.round(precoBase * (0.9 + rand() * 0.25) * 100) / 100);
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
                {
                  location_id: seller.stockLocationId,
                  stocked_quantity: estoque + sellerIndex * 3,
                },
              ],
            },
          ],
          prices: [{ amount: preco, currency_code: "brl" }],
        });
      }
    }
  }

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info(
    `Finished creating ${offers.length} offers across ${sellers.length} sellers.`
  );

  logger.info("Finished seeding.");
}
