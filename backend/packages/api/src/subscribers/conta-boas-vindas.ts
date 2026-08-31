import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { emailBoasVindas } from "../lib/emails/templates"

// Comprador criou conta no storefront -> e-mail de boas-vindas.
export default async function contaBoasVindas({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const notification = container.resolve(Modules.NOTIFICATION)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name", "last_name", "has_account"],
    filters: { id: event.data.id },
  })
  if (!customer?.email) return
  // Cliente guest (checkout sem conta) nao recebe boas-vindas
  if (customer.has_account === false) return

  try {
    await notification.createNotifications({
      to: customer.email,
      channel: "email",
      template: "conta-boas-vindas",
      content: emailBoasVindas({ nome: customer.first_name, email: customer.email }),
    })
  } catch (e) {
    logger.error(`[email] boas-vindas falhou pra ${customer.email}: ${e}`)
  }
}

export const config: SubscriberConfig = { event: "customer.created" }
