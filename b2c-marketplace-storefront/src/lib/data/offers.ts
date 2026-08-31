'use server';

import { sdk } from '../config';

// ---------------------------------------------------------------------------
// Ofertas de um produto (modelo Amazon: N sellers competindo na mesma pagina).
// Usado pelo buybox da pagina de produto: a oferta vencedora e a mais barata
// COM estoque; as demais viram "outras ofertas".
// ---------------------------------------------------------------------------

export interface ProductOffer {
  id: string;
  variant_id: string;
  sku: string | null;
  seller: { id: string; name: string; handle: string } | null;
  /** Preco em BRL (menor price da oferta na moeda). */
  amount: number | null;
  currency_code: string | null;
  /** Estoque disponivel somado dos location levels. */
  estoque: number;
}

interface RawInventoryLink {
  inventory_item?: {
    location_levels?: { stocked_quantity?: number; reserved_quantity?: number }[];
  } | null;
}

interface RawOffer {
  id: string;
  variant_id: string;
  sku: string | null;
  seller?: { id: string; name: string; handle: string } | null;
  prices?: { amount: number; currency_code: string; min_quantity?: number | null }[];
  // A API devolve um ARRAY de links (1 por inventory item); versoes antigas
  // devolviam objeto unico — tratamos os dois.
  inventory_item_link?: RawInventoryLink[] | RawInventoryLink | null;
}

export async function getProductOffers(productId: string): Promise<ProductOffer[]> {
  try {
    const { offers } = await sdk.client.fetch<{ offers: RawOffer[] }>(
      `/store/offers`,
      {
        query: { product_id: productId, limit: 50 },
        cache: 'no-cache'
      }
    );

    return (offers ?? []).map(offer => {
      const price =
        offer.prices?.find(p => p.currency_code === 'brl' && !p.min_quantity) ??
        offer.prices?.[0] ??
        null;
      const links: RawInventoryLink[] = Array.isArray(offer.inventory_item_link)
        ? offer.inventory_item_link
        : offer.inventory_item_link
        ? [offer.inventory_item_link]
        : [];
      const estoque = links.reduce(
        (acc, link) =>
          acc +
          (link?.inventory_item?.location_levels ?? []).reduce(
            (a, l) => a + Math.max(0, (l.stocked_quantity ?? 0) - (l.reserved_quantity ?? 0)),
            0
          ),
        0
      );
      return {
        id: offer.id,
        variant_id: offer.variant_id,
        sku: offer.sku,
        seller: offer.seller ?? null,
        amount: price ? Number(price.amount) : null,
        currency_code: price?.currency_code ?? null,
        estoque
      };
    });
  } catch (e) {
    console.error('[offers] falha ao listar ofertas do produto', productId, e);
    return [];
  }
}

/**
 * Ranking do buybox: com estoque primeiro, depois menor preco.
 * Retorna [vencedora, ...outras].
 */
export async function rankOffers(offers: ProductOffer[], variantId?: string) {
  const daVariante = variantId
    ? offers.filter(o => o.variant_id === variantId)
    : offers;
  return [...daVariante].sort((a, b) => {
    const estoqueA = a.estoque > 0 ? 0 : 1;
    const estoqueB = b.estoque > 0 ? 0 : 1;
    if (estoqueA !== estoqueB) return estoqueA - estoqueB;
    return (a.amount ?? Number.MAX_SAFE_INTEGER) - (b.amount ?? Number.MAX_SAFE_INTEGER);
  });
}
