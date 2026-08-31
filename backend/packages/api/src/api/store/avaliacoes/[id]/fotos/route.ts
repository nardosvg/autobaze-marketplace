import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// POST /store/avaliacoes/:id/fotos — o comprador anexa fotos na PROPRIA
// avaliacao. Body: { fotos: [{ nome, tipo, conteudo(base64) }] } (max 4).
// Middleware garante customer autenticado + body maior pro upload.
// ---------------------------------------------------------------------------

const MAX_FOTOS = 4
const MAX_BYTES = 5 * 1024 * 1024 // 5MB por foto (antes do base64)
const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"])

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const reviewId = req.params.id
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    return res.status(401).json({ message: "Faça login pra enviar fotos" })
  }

  const body = (req.body ?? {}) as {
    fotos?: { nome?: string; tipo?: string; conteudo?: string }[]
  }
  const fotos = Array.isArray(body.fotos) ? body.fotos.slice(0, MAX_FOTOS) : []
  if (!fotos.length) {
    return res.status(400).json({ message: "Envie ao menos uma foto" })
  }

  // A avaliacao precisa ser do proprio comprador
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "review",
    fields: ["id", "customer.id"],
    filters: { id: reviewId },
  })
  const review = data?.[0]
  if (!review) {
    return res.status(404).json({ message: "Avaliação não encontrada" })
  }
  if ((review as any).customer?.id !== customerId) {
    return res.status(403).json({ message: "Esta avaliação não é sua" })
  }

  const fileService = req.scope.resolve(Modules.FILE) as any
  const extras = req.scope.resolve("extras") as any

  const criadas: string[] = []
  for (const foto of fotos) {
    const tipo = String(foto.tipo || "")
    const conteudo = String(foto.conteudo || "").replace(/^data:[^,]+,/, "")
    if (!TIPOS.has(tipo) || !conteudo) continue
    if (Buffer.byteLength(conteudo, "base64") > MAX_BYTES) continue

    const ext = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg"
    const nome = `avaliacao-${reviewId}-${criadas.length + 1}.${ext}`

    const [arquivo] = await fileService.createFiles([
      { filename: nome, mimeType: tipo, content: conteudo },
    ])
    if (arquivo?.url) {
      await extras.createAvaliacaoFotos({
        review_id: reviewId,
        customer_id: customerId,
        url: arquivo.url,
      })
      criadas.push(arquivo.url)
    }
  }

  if (!criadas.length) {
    return res
      .status(400)
      .json({ message: "Nenhuma foto válida (JPEG/PNG/WebP até 5MB)" })
  }

  res.status(201).json({ urls: criadas })
}
