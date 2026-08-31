import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// DELETE /store/veiculos/:id — remove um veiculo da garagem do proprio
// comprador.
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Faça login" })

  const extras = req.scope.resolve("extras") as any
  const [veiculo] = await extras.listVeiculoClientes(
    { id: req.params.id, customer_id: customerId },
    { take: 1 }
  )
  if (veiculo) {
    await extras.deleteVeiculoClientes([veiculo.id])
  }
  res.json({ ok: true })
}
