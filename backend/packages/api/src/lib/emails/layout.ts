// ---------------------------------------------------------------------------
// Layout base dos e-mails transacionais do AutoBaze Marketplace.
// HTML de e-mail e' 2005: tabelas, estilo inline, sem flex/grid. Testado o
// suficiente pra Gmail, Outlook e Apple Mail.
// ---------------------------------------------------------------------------

// Logo hospedado no Storage publico (mesmo do app). api.autobaze passa pelo
// Cloudflare; api.operify e' direto na VPS e cai no throttle.
export const LOGO_URL =
  process.env.EMAIL_LOGO_URL ||
  "https://api.autobaze.com.br/storage/v1/object/public/brand/autobaze-email-logo.png"

export const STOREFRONT_URL = (
  process.env.STOREFRONT_URL ||
  process.env.STOREFRONT_REVALIDATE_URL ||
  "https://marketplace.autobaze.com.br"
).replace(/\/$/, "")

const AZUL = "#0F52FF"
const ESCURO = "#0b0f1d"

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function botao(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
      <tr>
        <td style="border-radius:999px;background:${AZUL};">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`
}

export function layoutEmail(opts: {
  preheader: string
  titulo: string
  corpoHtml: string
  rodapeExtra?: string
}): string {
  const ano = new Date().getFullYear()
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.titulo)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
  <span style="display:none;font-size:1px;color:#f3f4f6;max-height:0;overflow:hidden;">${escapeHtml(opts.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
          <!-- cabecalho na cor da marca -->
          <tr>
            <td style="background:${AZUL};border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="AutoBaze" width="160" style="display:inline-block;max-width:160px;height:auto;border:0;">
            </td>
          </tr>
          <!-- corpo -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;font-family:Arial,Helvetica,sans-serif;color:#111827;font-size:16px;line-height:1.55;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:${ESCURO};">${escapeHtml(opts.titulo)}</h1>
              ${opts.corpoHtml}
            </td>
          </tr>
          <!-- rodape -->
          <tr>
            <td style="background:#ffffff;border-radius:0 0 16px 16px;border-top:1px solid #e5e7eb;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;">
              ${opts.rodapeExtra ? `<p style="margin:0 0 8px;">${opts.rodapeExtra}</p>` : ""}
              <p style="margin:0 0 6px;">AutoBaze Marketplace · <a href="${STOREFRONT_URL}" style="color:${AZUL};text-decoration:none;">marketplace.autobaze.com.br</a></p>
              <p style="margin:0;">As lojas do marketplace são independentes e emitem a nota fiscal de cada compra. © ${ano} AutoBaze.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
