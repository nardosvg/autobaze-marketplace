import { model } from "@medusajs/framework/utils"

// Pergunta de comprador num produto do marketplace (estilo Mercado Livre).
// O vendedor responde pelo painel AutoBaze; so' perguntas respondidas
// aparecem publicamente na pagina do produto.
export const Pergunta = model.define("pergunta_produto", {
  id: model.id({ prefix: "perg" }).primaryKey(),
  product_id: model.text().searchable(),
  seller_id: model.text().searchable(),
  customer_id: model.text().nullable(),
  customer_nome: model.text().nullable(),
  texto: model.text(),
  resposta: model.text().nullable(),
  // pendente | respondida | oculta
  status: model.text().default("pendente"),
  respondida_em: model.dateTime().nullable(),
})
