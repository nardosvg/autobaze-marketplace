import { model } from "@medusajs/framework/utils"

// Foto anexada pelo comprador numa avaliacao (review) do marketplace.
// O arquivo em si vive no file module do Medusa; aqui guardamos so' a URL.
export const AvaliacaoFoto = model.define("avaliacao_foto", {
  id: model.id({ prefix: "avfoto" }).primaryKey(),
  review_id: model.text().searchable(),
  customer_id: model.text().nullable(),
  url: model.text(),
})
