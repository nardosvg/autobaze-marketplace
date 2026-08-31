import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type { Logger, ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

// ---------------------------------------------------------------------------
// Provider de notificacao (canal email) via API transacional da Brevo.
// A Operify ja usa Brevo no app; aqui reaproveitamos a mesma conta.
//
// Os subscribers montam o HTML (templates em src/lib/emails) e passam em
// `content: { subject, html }`; este provider so entrega.
// ---------------------------------------------------------------------------

type Options = {
  api_key: string
  from_email: string
  from_name?: string
}

type InjectedDependencies = { logger: Logger }

export class BrevoNotificationService extends AbstractNotificationProviderService {
  static identifier = "brevo"

  protected logger_: Logger
  protected options_: Options

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Brevo: api_key e obrigatorio")
    }
    if (!options.from_email) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Brevo: from_email e obrigatorio")
    }
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification?.to) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Brevo: destinatario ausente")
    }
    const content = notification.content
    if (!content?.html || !content?.subject) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Brevo: content.subject e content.html sao obrigatorios")
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": this.options_.api_key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: notification.from?.trim() || this.options_.from_email,
          name: this.options_.from_name || "AutoBaze Marketplace",
        },
        to: [{ email: notification.to }],
        subject: content.subject,
        htmlContent: content.html,
        textContent: content.text || undefined,
        tags: notification.template ? [String(notification.template)] : undefined,
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Brevo ${res.status} ao enviar "${content.subject}" pra ${notification.to}: ${body.slice(0, 300)}`
      )
    }
    const json = (await res.json().catch(() => ({}))) as { messageId?: string }
    return { id: json.messageId }
  }
}
