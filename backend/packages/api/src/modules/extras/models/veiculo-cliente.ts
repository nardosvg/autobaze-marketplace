import { model } from "@medusajs/framework/utils"

// Garagem do comprador: veiculos salvos na conta pro verificador de
// compatibilidade nao pedir os dados toda vez.
export const VeiculoCliente = model.define("veiculo_cliente", {
  id: model.id({ prefix: "vcl" }).primaryKey(),
  customer_id: model.text().searchable(),
  // id da linha de anos_modelo (FIPE) no Postgres do app
  ano_modelo_id: model.text(),
  label: model.text(),
  placa: model.text().nullable(),
})
