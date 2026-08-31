'use server';

import { fetchQuery } from '../config';
import { getAuthHeaders } from './cookies';

// ---------------------------------------------------------------------------
// Fotos de avaliacoes (modulo extras do backend AutoBaze).
// ---------------------------------------------------------------------------

/** Fotos das avaliacoes de um produto, agrupadas por review_id. */
export async function getFotosAvaliacoes(
  productId: string
): Promise<Record<string, string[]>> {
  try {
    const res = await fetchQuery('/store/avaliacoes-fotos', {
      method: 'GET',
      query: { product_id: productId }
    });
    return res.ok ? (res.data?.fotos ?? {}) : {};
  } catch {
    return {};
  }
}

/** Anexa fotos (base64) na avaliacao do proprio comprador. */
export async function enviarFotosAvaliacao(
  reviewId: string,
  fotos: { nome: string; tipo: string; conteudo: string }[]
): Promise<{ urls?: string[]; error?: string }> {
  try {
    const headers = { ...(await getAuthHeaders()) };
    const res = await fetchQuery(`/store/avaliacoes/${reviewId}/fotos`, {
      method: 'POST',
      headers,
      body: { fotos }
    });
    if (!res.ok) {
      return { error: res.error?.message || 'Não foi possível enviar as fotos' };
    }
    return { urls: res.data?.urls ?? [] };
  } catch {
    return { error: 'Falha de rede ao enviar as fotos' };
  }
}
