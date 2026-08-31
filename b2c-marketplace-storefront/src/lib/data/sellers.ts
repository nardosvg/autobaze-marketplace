"use server"

import { sdk } from "../config"

export interface SellerResumo {
  id: string
  name: string
  handle: string
  logo: string | null
}

// Seller completo pra pagina de produto (capa + card da loja): banner, logo,
// produtos e reviews da loja. Busca por handle porque a rota por id nao
// existe no 2.3.1.
export async function getSellerFull(handle: string): Promise<any | null> {
  try {
    const { sellers } = await sdk.client.fetch<{ sellers: any[] }>(
      "/store/sellers",
      {
        query: {
          handle,
          limit: 1,
          fields:
            "id,name,handle,description,logo,banner,created_at,*products,*reviews",
        },
        cache: "no-cache",
      }
    )
    return sellers?.[0] ?? null
  } catch {
    return null
  }
}

// Lojas abertas do marketplace (a rota /store/sellers ja filtra as que
// estao em modo ferias/fechadas). Usado na faixa "Lojas oficiais" da home.
export async function listSellers(limit = 16): Promise<SellerResumo[]> {
  try {
    const { sellers } = await sdk.client.fetch<{ sellers: SellerResumo[] }>(
      "/store/sellers",
      {
        query: { limit, fields: "id,name,handle,logo" },
        cache: "no-cache",
      }
    )
    return sellers ?? []
  } catch {
    return []
  }
}
