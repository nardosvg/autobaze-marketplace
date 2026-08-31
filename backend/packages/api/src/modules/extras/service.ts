import { MedusaService } from "@medusajs/framework/utils"

import { AvaliacaoFoto } from "./models/avaliacao-foto"
import { Pergunta } from "./models/pergunta"
import { VeiculoCliente } from "./models/veiculo-cliente"
import { WishlistItem } from "./models/wishlist-item"

// Service do modulo: o MedusaService gera o CRUD dos modelos
// (listPerguntas, createPerguntas, listWishlistItems, listVeiculoClientes...).
class ExtrasModuleService extends MedusaService({
  Pergunta,
  AvaliacaoFoto,
  WishlistItem,
  VeiculoCliente,
}) {}

export default ExtrasModuleService
