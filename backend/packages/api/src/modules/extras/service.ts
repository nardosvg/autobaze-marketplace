import { MedusaService } from "@medusajs/framework/utils"

import { AvaliacaoFoto } from "./models/avaliacao-foto"
import { Pergunta } from "./models/pergunta"

// Service do modulo: o MedusaService gera o CRUD dos dois modelos
// (listPerguntas, createPerguntas, updatePerguntas, listAvaliacaoFotos...).
class ExtrasModuleService extends MedusaService({
  Pergunta,
  AvaliacaoFoto,
}) {}

export default ExtrasModuleService
