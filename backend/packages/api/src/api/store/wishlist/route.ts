import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// Favoritos do comprador — contrato que o storefront b2c espera:
//   GET  /store/wishlist?region_id=...  -> { products: [...] } com preco
//   POST /store/wishlist { reference: 'product', reference_id }
// (o core 2.3.1 nao tem wishlist; vive no modulo extras)
// ---------------------------------------------------------------------------

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const extras = req.scope.resolve("extras") as any
  const itens = await extras.listWishlistItems({ customer_id: customerId }, { take: 200 })
  const productIds = [...new Set(itens.map((i: any) => i.product_id))]
  if (!productIds.length) return res.json({ products: [] })

  const regionId = req.query.region_id ? String(req.query.region_id) : undefined
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "status",
        "variants.*",
        "variants.calculated_price.*",
      ],
      filters: { id: productIds as string[] },
      context: regionId
        ? {
            variants: {
              calculated_price: QueryContext({
                region_id: regionId,
                currency_code: "brl",
              }),
            },
          }
        : undefined,
    })
    res.json({ products: products.filter((p: any) => p.status === "published") })
  } catch {
    // Sem contexto de preco valido ainda devolve os produtos basicos
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "thumbnail"],
      filters: { id: productIds as string[] },
    })
    res.json({ products })
  }
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const body = (req.body ?? {}) as { reference?: string; reference_id?: string }
  const productId = String(body.reference_id || "").trim()
  if (body.reference !== "product" || !productId) {
    return res.status(400).json({ message: "reference 'product' e reference_id são obrigatórios" })
  }

  const extras = req.scope.resolve("extras") as any
  const [existente] = await extras.listWishlistItems(
    { customer_id: customerId, product_id: productId },
    { take: 1 }
  )
  if (!existente) {
    await extras.createWishlistItems({ customer_id: customerId, product_id: productId })
  }
  res.status(201).json({ ok: true })
}
