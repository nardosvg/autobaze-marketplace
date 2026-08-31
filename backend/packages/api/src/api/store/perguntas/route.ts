import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// Perguntas & respostas de produto (estilo Mercado Livre).
//   GET  /store/perguntas?product_id=...   -> respondidas (publico) + as
//        pendentes do proprio comprador quando autenticado
//   POST /store/perguntas                   -> cria pergunta (comprador
//        autenticado; middleware garante o auth)
// ---------------------------------------------------------------------------

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = String(req.query.product_id || "")
  if (!productId) {
    return res.status(400).json({ message: "product_id é obrigatório" })
  }

  const extras = req.scope.resolve("extras") as any

  const respondidas = await extras.listPerguntas(
    { product_id: productId, status: "respondida" },
    { order: { respondida_em: "DESC" }, take: 100 }
  )

  // Perguntas pendentes do proprio comprador (pra ele ver que ja perguntou)
  const actorId = (req as AuthenticatedMedusaRequest).auth_context?.actor_id
  let minhasPendentes: any[] = []
  if (actorId) {
    minhasPendentes = await extras.listPerguntas(
      { product_id: productId, status: "pendente", customer_id: actorId },
      { order: { created_at: "DESC" }, take: 20 }
    )
  }

  res.json({
    perguntas: respondidas,
    minhas_pendentes: minhasPendentes,
    count: respondidas.length,
  })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const body = (req.body ?? {}) as {
    product_id?: string
    seller_id?: string
    texto?: string
  }

  const productId = String(body.product_id || "").trim()
  const sellerId = String(body.seller_id || "").trim()
  const texto = String(body.texto || "").trim()

  if (!productId || !sellerId) {
    return res
      .status(400)
      .json({ message: "product_id e seller_id são obrigatórios" })
  }
  if (texto.length < 5 || texto.length > 250) {
    return res
      .status(400)
      .json({ message: "A pergunta precisa ter entre 5 e 250 caracteres" })
  }

  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Faça login pra perguntar" })
  }

  // Nome do comprador denormalizado (a listagem publica nao expoe o customer)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  let nome: string | null = null
  try {
    const { data } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "last_name"],
      filters: { id: customerId },
    })
    const c = data?.[0]
    nome = [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim() || null
  } catch {
    // segue sem nome
  }

  const extras = req.scope.resolve("extras") as any
  const pergunta = await extras.createPerguntas({
    product_id: productId,
    seller_id: sellerId,
    customer_id: customerId,
    customer_nome: nome,
    texto,
    status: "pendente",
  })

  res.status(201).json({ pergunta })
}
