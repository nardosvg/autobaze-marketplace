'use server';

import { Pool } from 'pg';

// ---------------------------------------------------------------------------
// Veiculos (tabela FIPE do catalogo universal AutoBaze) pro verificador de
// compatibilidade da PDP. Le direto do Postgres do app (APP_DATABASE_URL —
// tunnel 5433 no dev, rede interna na VPS). Somente leitura.
// Placa: mesmo provedor do app (wdapi2 / APIPLACAS_TOKEN).
// ---------------------------------------------------------------------------

let pool: Pool | null = null;
function db(): Pool {
  if (!pool) {
    const url = process.env.APP_DATABASE_URL;
    if (!url) throw new Error('APP_DATABASE_URL não configurada');
    pool = new Pool({ connectionString: url, max: 3 });
  }
  return pool;
}

export type OpcaoVeiculo = { id: string; nome: string };
export type VersaoVeiculo = {
  id: string;
  ano_inicial: number | null;
  ano_final: number | null;
  motor: string | null;
  versao: string | null;
  combustivel: string | null;
};

export async function getMarcasVeiculo(): Promise<OpcaoVeiculo[]> {
  try {
    const { rows } = await db().query(
      `SELECT m.id, m.nome FROM marcas m
       WHERE EXISTS (SELECT 1 FROM modelos mo WHERE mo.marca_id = m.id)
       ORDER BY m.nome`
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getModelosVeiculo(marcaId: string): Promise<OpcaoVeiculo[]> {
  try {
    const { rows } = await db().query(
      `SELECT id, nome FROM modelos WHERE marca_id = $1 ORDER BY nome`,
      [marcaId]
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getVersoesModelo(modeloId: string): Promise<VersaoVeiculo[]> {
  try {
    const { rows } = await db().query(
      `SELECT id, ano_inicial, ano_final, motor, versao, combustivel
       FROM anos_modelo WHERE modelo_id = $1
       ORDER BY ano_inicial NULLS LAST, versao NULLS FIRST`,
      [modeloId]
    );
    return rows;
  } catch {
    return [];
  }
}

/** Veredito exato: o produto (master) tem aplicacao pra esse ano-modelo FIPE? */
export async function verificarCompatibilidade(
  masterId: string,
  anoModeloId: string
): Promise<{ compativel: boolean } | { error: string }> {
  if (!masterId || !anoModeloId) return { error: 'Dados incompletos' };
  try {
    const { rows } = await db().query(
      `SELECT EXISTS (
         SELECT 1 FROM catalogo_produto_aplicacao
         WHERE master_id = $1 AND ano_modelo_id = $2
       ) AS ok`,
      [masterId, anoModeloId]
    );
    return { compativel: Boolean(rows[0]?.ok) };
  } catch {
    return { error: 'Não foi possível verificar agora' };
  }
}

// ---------------------------------------------------------------------------
// Placa -> pre-preenche os selects (marca/modelo/ano) casando com a FIPE.
// ---------------------------------------------------------------------------

export type ResultadoPlaca =
  | {
      marca: OpcaoVeiculo | null;
      modelo: OpcaoVeiculo | null;
      ano: number | null;
      /** Versao (anos_modelo) resolvida com confianca -> da pra verificar direto */
      versaoId: string | null;
      /** Label completo do veiculo quando a versao foi resolvida */
      label: string | null;
      descricao: string;
    }
  | { error: string };

// Escolhe a versao (linha de anos_modelo) que melhor casa com o texto que a
// API de placas devolve (ex.: "GOL 1.0 Mi Plus 16v") + combustivel.
function resolverVersao(
  versoes: VersaoVeiculo[],
  ano: number | null,
  textoModelo: string,
  combustivel: string | null
): VersaoVeiculo | null {
  const doAno = ano
    ? versoes.filter((v) => {
        const ai = v.ano_inicial ?? v.ano_final;
        const af = v.ano_final ?? v.ano_inicial;
        return ai != null && af != null && ano >= ai && ano <= af;
      })
    : versoes;
  if (!doAno.length) return null;
  if (doAno.length === 1) return doAno[0];

  const texto = normalizar(textoModelo);
  const comb = normalizar(combustivel ?? '');
  const motorAlvo = texto.match(/\d[. ]\d/)?.[0]?.replace(' ', '.') ?? null;
  const valvulasAlvo = texto.match(/(\d{1,2})v\b/)?.[0] ?? null;

  let melhor: VersaoVeiculo | null = null;
  let melhorScore = -1;
  for (const v of doAno) {
    const alvo = normalizar([v.motor, v.versao].filter(Boolean).join(' '));
    let score = 0;
    if (motorAlvo && alvo.includes(motorAlvo)) score += 3;
    if (valvulasAlvo && alvo.includes(valvulasAlvo)) score += 2;
    if (comb && normalizar(v.combustivel ?? '').startsWith(comb.split(' ')[0] ?? '')) score += 1;
    // tokens da versao presentes no texto da placa (plus, comfortline...)
    for (const t of alvo.split(' ')) {
      if (t.length >= 4 && texto.includes(t)) score += 1;
    }
    if (score > melhorScore) {
      melhorScore = score;
      melhor = v;
    }
  }
  return melhorScore > 0 ? melhor : null;
}

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export async function consultarPlacaVeiculo(placaRaw: string): Promise<ResultadoPlaca> {
  const placa = (placaRaw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placa)) {
    return { error: 'Placa inválida (formato ABC1234 ou ABC1D23)' };
  }

  // 1. Cache global de placas do AutoBaze (placas_cache) — toda consulta ja
  //    feita por qualquer produto da plataforma evita bater na API paga.
  let marcaNome = '';
  let modeloNome = '';
  let ano: number | null = null;
  let combustivel: string | null = null;
  let veioDoCache = false;

  try {
    const { rows } = await db().query(
      `SELECT marca, modelo, ano, combustivel FROM placas_cache WHERE placa = $1`,
      [placa]
    );
    if (rows[0]?.marca) {
      marcaNome = rows[0].marca ?? '';
      modeloNome = rows[0].modelo ?? '';
      ano = Number(rows[0].ano) || null;
      combustivel = rows[0].combustivel ?? null;
      veioDoCache = true;
    }
  } catch {
    // cache indisponivel — segue pra API
  }

  if (!veioDoCache) {
    const token = process.env.APIPLACAS_TOKEN;
    if (!token) return { error: 'Consulta por placa não está configurada' };

    let data: any;
    try {
      const res = await fetch(
        `https://wdapi2.com.br/consulta/${encodeURIComponent(placa)}/${encodeURIComponent(token)}`,
        { cache: 'no-store' }
      );
      if (res.status === 406 || res.status === 404) {
        return { error: 'Nenhum veículo encontrado pra essa placa' };
      }
      if (!res.ok) return { error: 'Consulta de placa indisponível agora' };
      data = await res.json();
    } catch {
      return { error: 'Consulta de placa indisponível agora' };
    }

    marcaNome = data.MARCA ?? data.marca ?? '';
    modeloNome = data.MODELO ?? data.modelo ?? '';
    ano = Number(data.extra?.ano_modelo || data.anoModelo || data.ano) || null;
    combustivel = data.extra?.combustivel ?? null;

    // Grava no cache global (mesma tabela que o app usa)
    try {
      await db().query(
        `INSERT INTO placas_cache (placa, marca, modelo, ano, cor, combustivel, tipo_veiculo, fonte, atualizado_em)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'marketplace', now())
         ON CONFLICT (placa) DO UPDATE SET
           marca = EXCLUDED.marca, modelo = EXCLUDED.modelo, ano = EXCLUDED.ano,
           combustivel = EXCLUDED.combustivel, atualizado_em = now()`,
        [
          placa,
          marcaNome || null,
          modeloNome || null,
          ano,
          data.cor ?? null,
          combustivel,
          data.extra?.tipo_veiculo ?? null,
        ]
      );
    } catch {
      // cache e' conveniencia — falha nao bloqueia
    }
  }

  const descricao = [marcaNome, modeloNome, ano].filter(Boolean).join(' ');

  try {
    // Marca: match por prefixo/inclusao no nome normalizado
    const { rows: marcas } = await db().query(
      `SELECT id, nome FROM marcas ORDER BY nome`
    );
    const alvoMarca = normalizar(marcaNome).split(' ')[0] ?? '';
    const marca =
      marcas.find((m: any) => normalizar(m.nome) === normalizar(marcaNome)) ??
      marcas.find(
        (m: any) =>
          alvoMarca &&
          (normalizar(m.nome).includes(alvoMarca) || alvoMarca.includes(normalizar(m.nome)))
      ) ??
      null;

    let modelo: OpcaoVeiculo | null = null;
    if (marca) {
      const { rows: modelos } = await db().query(
        `SELECT id, nome FROM modelos WHERE marca_id = $1`,
        [marca.id]
      );
      const alvo = normalizar(modeloNome);
      // melhor match: modelo cujo nome (normalizado) aparece no texto da placa,
      // preferindo o nome mais longo (Gol G5 > Gol)
      const candidatos = modelos
        .filter((m: any) => {
          const n = normalizar(m.nome);
          return n && (alvo.includes(n) || n.includes(alvo.split(' ')[0]));
        })
        .sort((a: any, b: any) => normalizar(b.nome).length - normalizar(a.nome).length);
      modelo = candidatos[0] ?? null;
    }

    // Versao: com modelo + ano, tenta cravar a linha exata de anos_modelo
    // pra verificar compatibilidade direto, sem o comprador escolher nada.
    let versaoId: string | null = null;
    let label: string | null = null;
    if (modelo) {
      const { rows: versoes } = await db().query(
        `SELECT id, ano_inicial, ano_final, motor, versao, combustivel
         FROM anos_modelo WHERE modelo_id = $1`,
        [modelo.id]
      );
      const v = resolverVersao(versoes, ano, modeloNome, combustivel);
      if (v) {
        versaoId = v.id;
        label = [marca?.nome, modelo.nome, ano, v.motor, v.versao]
          .filter(Boolean)
          .join(' ');
      }
    }

    return { marca, modelo, ano, versaoId, label, descricao: descricao || placa };
  } catch {
    return {
      marca: null,
      modelo: null,
      ano,
      versaoId: null,
      label: null,
      descricao: descricao || placa,
    };
  }
}
