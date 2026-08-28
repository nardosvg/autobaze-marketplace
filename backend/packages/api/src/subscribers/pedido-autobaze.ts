// Notifica o AutoBaze quando um pedido e criado no marketplace.
//
// O Mercur divide o carrinho em um pedido por seller (order.placed dispara
// por pedido filho). Payload minimo (order_id + seller_id): o AutoBaze
// busca os dados canonicos de volta pela Vendor API, entao nada sensivel
// viaja no webhook e o handler e naturalmente idempotente.

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export default async function pedidoAutoBazeHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const url = process.env.AUTOBAZE_WEBHOOK_URL;
  const secret = process.env.AUTOBAZE_WEBHOOK_SECRET;
  if (!url || !secret) {
    logger.warn(
      "[pedido-autobaze] AUTOBAZE_WEBHOOK_URL/SECRET nao configurados, pedido nao notificado"
    );
    return;
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "seller.id"],
    filters: { id: event.data.id },
  });
  const sellerId = (order as { seller?: { id: string } } | undefined)?.seller?.id;
  if (!sellerId) {
    logger.warn(`[pedido-autobaze] pedido ${event.data.id} sem seller, ignorado`);
    return;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-marketplace-secret": secret,
      },
      body: JSON.stringify({ order_id: event.data.id, seller_id: sellerId }),
    });
    if (!res.ok) {
      logger.error(
        `[pedido-autobaze] webhook ${res.status} pro pedido ${event.data.id}`
      );
    } else {
      logger.info(`[pedido-autobaze] pedido ${event.data.id} notificado`);
    }
  } catch (e) {
    // Event bus local nao tem retry: falha fica no log e o pedido pode ser
    // reprocessado chamando o webhook manualmente (handler idempotente).
    logger.error(`[pedido-autobaze] falha ao notificar ${event.data.id}: ${e}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
