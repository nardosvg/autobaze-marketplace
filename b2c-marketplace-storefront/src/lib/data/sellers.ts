"use server"

import { sdk } from "../config"

export interface SellerResumo {
  id: string
  name: string
  handle: string
  logo: string | null
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
