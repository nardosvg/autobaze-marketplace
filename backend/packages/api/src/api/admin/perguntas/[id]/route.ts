import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// ---------------------------------------------------------------------------
// POST /admin/perguntas/:id — responde (ou oculta) uma pergunta.
// Body: { resposta?: string, seller_id?: string, ocultar?: boolean }
// seller_id, quando enviado, e' conferido contra a pergunta (o app manda o
// seller do tenant pra garantir que ninguem responde pergunta dos outros).
// ---------------------------------------------------------------------------

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const id = req.params.id
  const body = (req.body ?? {}) as {
    resposta?: string
    seller_id?: string
    ocultar?: boolean
  }

  const extras = req.scope.resolve("extras") as any

  const [pergunta] = await extras.listPerguntas({ id }, { take: 1 })
  if (!pergunta) {
    return res.status(404).json({ message: "Pergunta não encontrada" })
  }
  if (body.seller_id && pergunta.seller_id !== body.seller_id) {
    return res.status(403).json({ message: "Pergunta de outro vendedor" })
  }

  if (body.ocultar) {
    const atualizada = await extras.updatePerguntas({ id, status: "oculta" })
    return res.json({ pergunta: atualizada })
  }

  const resposta = String(body.resposta || "").trim()
  if (resposta.length < 2 || resposta.length > 1000) {
    return res
      .status(400)
      .json({ message: "A resposta precisa ter entre 2 e 1000 caracteres" })
  }

  const atualizada = await extras.updatePerguntas({
    id,
    resposta,
    status: "respondida",
    respondida_em: new Date(),
  })

  res.json({ pergunta: atualizada })
}
