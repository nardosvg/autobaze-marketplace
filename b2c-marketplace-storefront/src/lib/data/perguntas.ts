'use server';

import { fetchQuery } from '../config';
import { getAuthHeaders } from './cookies';

// ---------------------------------------------------------------------------
// Perguntas & respostas de produto (modulo extras do backend AutoBaze).
// ---------------------------------------------------------------------------

export type Pergunta = {
  id: string;
  product_id: string;
  seller_id: string;
  customer_nome: string | null;
  texto: string;
  resposta: string | null;
  status: string;
  created_at: string;
  respondida_em: string | null;
};

export async function getPerguntas(productId: string): Promise<{
  perguntas: Pergunta[];
  minhasPendentes: Pergunta[];
}> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    const res = await fetchQuery('/store/perguntas', {
      method: 'GET',
      headers,
      query: { product_id: productId }
    });
    if (!res.ok) return { perguntas: [], minhasPendentes: [] };
    return {
      perguntas: res.data?.perguntas ?? [],
      minhasPendentes: res.data?.minhas_pendentes ?? []
    };
  } catch {
    return { perguntas: [], minhasPendentes: [] };
  }
}

export async function criarPergunta(input: {
  productId: string;
  sellerId: string;
  texto: string;
}): Promise<{ pergunta?: Pergunta; error?: string }> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    const res = await fetchQuery('/store/perguntas', {
      method: 'POST',
      headers,
      body: {
        product_id: input.productId,
        seller_id: input.sellerId,
        texto: input.texto
      }
    });
    if (!res.ok) {
      return {
        error:
          res.status === 401
            ? 'Faça login pra perguntar'
            : res.error?.message || 'Não foi possível enviar a pergunta'
      };
    }
    return { pergunta: res.data?.pergunta };
  } catch {
    return { error: 'Falha de rede ao enviar a pergunta' };
  }
}
