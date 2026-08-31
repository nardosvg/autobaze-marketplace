import { Module } from "@medusajs/framework/utils"

import ExtrasModuleService from "./service"

// Modulo "extras" do marketplace AutoBaze: perguntas & respostas de produto
// e fotos de avaliacoes — features que o Mercur 2.3.1 nao tem.
export const EXTRAS_MODULE = "extras"

export default Module(EXTRAS_MODULE, {
  service: ExtrasModuleService,
})
