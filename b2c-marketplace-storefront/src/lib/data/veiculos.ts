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
      descricao: string;
    }
  | { error: string };

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

  const marcaNome: string = data.MARCA ?? data.marca ?? '';
  const modeloNome: string = data.MODELO ?? data.modelo ?? '';
  const ano = Number(data.extra?.ano_modelo || data.anoModelo || data.ano) || null;
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

    return { marca, modelo, ano, descricao: descricao || placa };
  } catch {
    return { marca: null, modelo: null, ano, descricao: descricao || placa };
  }
}
