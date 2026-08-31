import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// ---------------------------------------------------------------------------
// GET /admin/perguntas?seller_id=...&status=... — perguntas recebidas por um
// seller. Rota admin (autenticada pelo proprio Medusa); quem chama e' o app
// AutoBaze com o token de plataforma, resolvendo o seller do tenant.
// ---------------------------------------------------------------------------

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const sellerId = String(req.query.seller_id || "")
  if (!sellerId) {
    return res.status(400).json({ message: "seller_id é obrigatório" })
  }

  const status = req.query.status ? String(req.query.status) : undefined
  const take = Math.min(100, Number(req.query.limit) || 50)
  const skip = Math.max(0, Number(req.query.offset) || 0)

  const extras = req.scope.resolve("extras") as any

  const filtro: Record<string, unknown> = { seller_id: sellerId }
  if (status) filtro.status = status

  const [perguntas, count] = await extras.listAndCountPerguntas(filtro, {
    order: { created_at: "DESC" },
    take,
    skip,
  })

  const pendentes = await extras.listAndCountPerguntas(
    { seller_id: sellerId, status: "pendente" },
    { take: 1 }
  )

  res.json({ perguntas, count, pendentes: pendentes[1] })
}
