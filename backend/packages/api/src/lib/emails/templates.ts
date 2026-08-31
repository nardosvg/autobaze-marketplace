import { botao, escapeHtml, layoutEmail, STOREFRONT_URL } from "./layout"

// ---------------------------------------------------------------------------
// Templates dos e-mails de conta do marketplace (pt-BR, marca AutoBaze).
// Cada funcao devolve { subject, html, text } pronto pro provider.
// ---------------------------------------------------------------------------

const LOCALE = process.env.STOREFRONT_DEFAULT_LOCALE || "br"

export function emailBoasVindas(input: { nome?: string | null; email: string }) {
  const nome = input.nome?.trim() || ""
  const saudacao = nome ? `Olá, ${escapeHtml(nome)}!` : "Olá!"
  const url = `${STOREFRONT_URL}/${LOCALE}`
  const html = layoutEmail({
    preheader: "Sua conta no AutoBaze Marketplace está pronta.",
    titulo: "Sua conta está pronta",
    corpoHtml: `
      <p style="margin:0 0 12px;">${saudacao}</p>
      <p style="margin:0 0 12px;">Sua conta de comprador no <strong>AutoBaze Marketplace</strong> foi criada com o e-mail <strong>${escapeHtml(input.email)}</strong>.</p>
      <p style="margin:0 0 12px;">Aqui você compra peças de autopeças e oficinas de todo o Brasil, com estoque real e nota fiscal em todo pedido. Quando vários vendedores têm a mesma peça, eles competem pelo seu pedido na mesma página.</p>
      ${botao("Ver ofertas", url)}
      <p style="margin:0;font-size:14px;color:#6b7280;">Se você não criou esta conta, pode ignorar este e-mail.</p>`,
  })
  const text = `${saudacao}\n\nSua conta de comprador no AutoBaze Marketplace foi criada com o e-mail ${input.email}.\n\nVer ofertas: ${url}\n\nSe você não criou esta conta, ignore este e-mail.`
  return { subject: "Bem-vindo ao AutoBaze Marketplace", html, text }
}

export function emailRedefinirSenha(input: { email: string; token: string }) {
  const url = `${STOREFRONT_URL}/${LOCALE}/reset-password?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.email)}`
  const html = layoutEmail({
    preheader: "Link pra redefinir a senha da sua conta no AutoBaze Marketplace.",
    titulo: "Redefinir sua senha",
    corpoHtml: `
      <p style="margin:0 0 12px;">Recebemos um pedido pra redefinir a senha da conta <strong>${escapeHtml(input.email)}</strong> no AutoBaze Marketplace.</p>
      <p style="margin:0 0 12px;">Clique no botão abaixo pra escolher uma nova senha. O link vale por tempo limitado.</p>
      ${botao("Redefinir senha", url)}
      <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">Se o botão não funcionar, copie e cole este endereço no navegador:<br><a href="${url}" style="color:#0F52FF;word-break:break-all;">${url}</a></p>
      <p style="margin:0;font-size:14px;color:#6b7280;">Se você não pediu a redefinição, ignore este e-mail: sua senha continua a mesma.</p>`,
  })
  const text = `Recebemos um pedido pra redefinir a senha da conta ${input.email}.\n\nRedefinir senha: ${url}\n\nSe você não pediu, ignore este e-mail.`
  return { subject: "Redefinir sua senha no AutoBaze Marketplace", html, text }
}
