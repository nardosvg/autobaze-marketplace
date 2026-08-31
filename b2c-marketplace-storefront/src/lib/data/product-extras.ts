"use server"

import { fetchQuery } from "../config"

// ---------------------------------------------------------------------------
// Dados extras da pagina de produto (estilo Mercado Livre): categorias pro
// breadcrumb/relacionados e avaliacoes do produto. O /store/products ja expoe
// as relacoes via fields, so' nao vem no listProducts padrao pra nao pesar as
// listagens.
// ---------------------------------------------------------------------------

export type AvaliacaoProduto = {
  id: string
  rating: number
  customer_note: string | null
  created_at: string
  customer?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  } | null
}

export type CategoriaProduto = {
  id: string
  name: string
  handle: string
}

export type ProdutoExtras = {
  categorias: CategoriaProduto[]
  avaliacoes: AvaliacaoProduto[]
  media: number
  total: number
}

export async function getProdutoExtras(productId: string): Promise<ProdutoExtras> {
  const vazio: ProdutoExtras = { categorias: [], avaliacoes: [], media: 0, total: 0 }
  if (!productId) return vazio

  try {
    const res = await fetchQuery(`/store/products/${productId}`, {
      method: "GET",
      query: {
        fields: "id,*categories,*reviews,*reviews.customer",
      },
    })

    if (!res.ok || !res.data?.product) return vazio

    const produto = res.data.product

    const categorias: CategoriaProduto[] = (produto.categories ?? [])
      .filter((c: any) => c && c.is_active !== false && !c.is_internal)
      .map((c: any) => ({ id: c.id, name: c.name, handle: c.handle }))

    const avaliacoes: AvaliacaoProduto[] = (produto.reviews ?? [])
      .filter((r: any) => r && r.status === "published" && r.rating >= 1)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

    const total = avaliacoes.length
    const media = total
      ? avaliacoes.reduce((soma, r) => soma + r.rating, 0) / total
      : 0

    return { categorias, avaliacoes, media, total }
  } catch {
    return vazio
  }
}
