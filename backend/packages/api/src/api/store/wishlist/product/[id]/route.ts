import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// DELETE /store/wishlist/product/:id — tira o produto dos favoritos do
// proprio comprador.
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const extras = req.scope.resolve("extras") as any
  const itens = await extras.listWishlistItems(
    { customer_id: customerId, product_id: req.params.id },
    { take: 10 }
  )
  if (itens.length) {
    await extras.deleteWishlistItems(itens.map((i: any) => i.id))
  }
  res.json({ ok: true })
}
