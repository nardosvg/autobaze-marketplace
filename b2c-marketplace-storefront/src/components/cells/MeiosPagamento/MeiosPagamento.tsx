/* eslint-disable @next/next/no-img-element */

// ---------------------------------------------------------------------------
// Card "Meios de pagamento" da coluna direita (estilo Mercado Livre), com os
// meios aceitos pelo nosso gateway: Pix, cartoes de credito e boleto.
// Logos em /public/pagamentos (SVGs locais, sem CDN).
// ---------------------------------------------------------------------------

const LogoCartao = ({ nome, arquivo }: { nome: string; arquivo: string }) => (
  <span
    className="inline-flex h-9 w-14 items-center justify-center rounded-sm border bg-white p-1"
    title={nome}
  >
    <img src={`/pagamentos/${arquivo}.svg`} alt={nome} className="max-h-full max-w-full" />
  </span>
)

export const MeiosPagamento = () => (
  <div id="pagamentos" className="rounded-md border bg-white p-4 scroll-mt-24" data-testid="payment-methods-card">
    <h3 className="text-base font-semibold text-neutral-900">Meios de pagamento</h3>

    <p className="mt-3 text-sm font-medium text-neutral-900">Pix</p>
    <p className="text-sm text-secondary">Aprovação na hora</p>
    <div className="mt-2 flex items-center gap-1.5">
      <img src="/pagamentos/pix.svg" alt="" className="h-5 w-5" />
      <span className="text-lg font-semibold lowercase tracking-tight text-[#32BCAD]">pix</span>
    </div>

    <p className="mt-4 text-sm font-medium text-neutral-900">Cartões de crédito</p>
    <p className="text-sm text-secondary">Pague em até 12x</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <LogoCartao nome="Visa" arquivo="visa" />
      <LogoCartao nome="Mastercard" arquivo="mastercard" />
      <LogoCartao nome="Elo" arquivo="elo" />
      <LogoCartao nome="American Express" arquivo="amex" />
      <LogoCartao nome="Hipercard" arquivo="hipercard" />
    </div>

    <p className="mt-4 text-sm font-medium text-neutral-900">Boleto bancário</p>
    <div className="mt-2">
      <img src="/pagamentos/boleto.svg" alt="Boleto bancário" className="h-7 w-auto" />
      <p className="mt-0.5 text-xs text-secondary">Boleto</p>
    </div>

    <p className="mt-4 text-xs text-secondary">
      Pagamento processado com segurança. A nota fiscal é emitida pela loja
      vendedora em todo pedido.
    </p>
  </div>
)
