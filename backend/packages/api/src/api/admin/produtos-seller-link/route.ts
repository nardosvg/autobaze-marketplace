import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// POST /admin/produtos-seller-link { product_id, seller_id }
// Cria o vinculo produto->seller (tabela product_seller). O create de
// produto pela admin API nao linka o vendedor, e sem o vinculo o anuncio
// nao aparece na pagina da loja nem carrega product.sellers no store.
// Usado pelo sync do app AutoBaze ao publicar um anuncio.
// ---------------------------------------------------------------------------

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as { product_id?: string; seller_id?: string }
  const productId = String(body.product_id || "").trim()
  const sellerId = String(body.seller_id || "").trim()
  if (!productId || !sellerId) {
    return res.status(400).json({ message: "product_id e seller_id são obrigatórios" })
  }

  const link = req.scope.resolve(ContainerRegistrationKeys.LINK) as any
  await link.create({
    [Modules.PRODUCT]: { product_id: productId },
    seller: { seller_id: sellerId },
  })

  res.status(201).json({ ok: true })
}
