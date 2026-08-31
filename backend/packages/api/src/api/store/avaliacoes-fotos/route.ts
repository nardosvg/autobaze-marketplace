import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// GET /store/avaliacoes-fotos?product_id=... — fotos das avaliacoes de um
// produto, agrupadas por review (pra faixa "Opinioes com fotos" da PDP).
// ---------------------------------------------------------------------------

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = String(req.query.product_id || "")
  if (!productId) {
    return res.status(400).json({ message: "product_id é obrigatório" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const extras = req.scope.resolve("extras") as any

  let reviewIds: string[] = []
  try {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "reviews.id"],
      filters: { id: productId },
    })
    reviewIds = (data?.[0]?.reviews ?? [])
      .filter(Boolean)
      .map((r: any) => r.id)
  } catch {
    // produto sem reviews
  }

  if (!reviewIds.length) {
    return res.json({ fotos: {} })
  }

  const rows = await extras.listAvaliacaoFotos(
    { review_id: reviewIds },
    { take: 200, order: { created_at: "ASC" } }
  )

  const fotos: Record<string, string[]> = {}
  for (const row of rows) {
    if (!fotos[row.review_id]) fotos[row.review_id] = []
    fotos[row.review_id].push(row.url)
  }

  res.json({ fotos })
}
