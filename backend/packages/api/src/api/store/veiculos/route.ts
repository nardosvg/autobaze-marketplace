import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// ---------------------------------------------------------------------------
// Garagem do comprador (modulo extras):
//   GET  /store/veiculos            -> veiculos salvos do proprio comprador
//   POST /store/veiculos            -> salva { ano_modelo_id, label, placa? }
// ---------------------------------------------------------------------------

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const extras = req.scope.resolve("extras") as any
  const veiculos = await extras.listVeiculoClientes(
    { customer_id: customerId },
    { order: { updated_at: "DESC" }, take: 20 }
  )
  res.json({ veiculos })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const body = (req.body ?? {}) as {
    ano_modelo_id?: string
    label?: string
    placa?: string
  }
  const anoModeloId = String(body.ano_modelo_id || "").trim()
  const label = String(body.label || "").trim()
  if (!anoModeloId || !label) {
    return res.status(400).json({ message: "ano_modelo_id e label são obrigatórios" })
  }

  const extras = req.scope.resolve("extras") as any
  const [existente] = await extras.listVeiculoClientes(
    { customer_id: customerId, ano_modelo_id: anoModeloId },
    { take: 1 }
  )
  let veiculo
  if (existente) {
    veiculo = await extras.updateVeiculoClientes({
      id: existente.id,
      label,
      placa: body.placa?.trim() || existente.placa || null,
    })
  } else {
    veiculo = await extras.createVeiculoClientes({
      customer_id: customerId,
      ano_modelo_id: anoModeloId,
      label,
      placa: body.placa?.trim() || null,
    })
  }
  res.status(201).json({ veiculo })
}
