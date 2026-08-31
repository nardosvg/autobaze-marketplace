import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { emailRedefinirSenha } from "../lib/emails/templates"

// Comprador pediu "esqueci a senha" -> e-mail com link de redefinicao.
// O Medusa emite auth.password_reset com { entity_id (email), actor_type,
// token }. Admin/member (vendedor) tem fluxo proprio nos paineis: aqui so
// tratamos o comprador.
export default async function contaRedefinirSenha({
  event,
  container,
}: SubscriberArgs<{ entity_id: string; actor_type: string; token: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const notification = container.resolve(Modules.NOTIFICATION)
  const { entity_id: email, actor_type, token } = event.data

  if (actor_type !== "customer" || !email || !token) return

  try {
    await notification.createNotifications({
      to: email,
      channel: "email",
      template: "conta-redefinir-senha",
      content: emailRedefinirSenha({ email, token }),
    })
  } catch (e) {
    logger.error(`[email] redefinir senha falhou pra ${email}: ${e}`)
  }
}

export const config: SubscriberConfig = { event: "auth.password_reset" }
