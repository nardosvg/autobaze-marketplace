import { MedusaService } from "@medusajs/framework/utils"

import { AvaliacaoFoto } from "./models/avaliacao-foto"
import { Pergunta } from "./models/pergunta"
import { WishlistItem } from "./models/wishlist-item"

// Service do modulo: o MedusaService gera o CRUD dos modelos
// (listPerguntas, createPerguntas, listWishlistItems...).
class ExtrasModuleService extends MedusaService({
  Pergunta,
  AvaliacaoFoto,
  WishlistItem,
}) {}

export default ExtrasModuleService
