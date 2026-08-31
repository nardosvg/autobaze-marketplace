// ---------------------------------------------------------------------------
// Card "Meios de pagamento" da coluna direita (estilo Mercado Livre).
// Mostra so' o que o checkout aceita de verdade hoje (cartao de credito);
// quando Pix/boleto entrarem no checkout, adiciona aqui.
// ---------------------------------------------------------------------------

const Bandeira = ({ nome }: { nome: string }) => (
  <span className="inline-flex h-8 items-center rounded-sm border bg-white px-2.5 text-xs font-bold uppercase tracking-wide text-neutral-700">
    {nome}
  </span>
)

export const MeiosPagamento = () => (
  <div className="rounded-md border bg-white p-4" data-testid="payment-methods-card">
    <h3 className="text-base font-semibold text-neutral-900">Meios de pagamento</h3>

    <p className="mt-3 text-sm font-medium text-neutral-900">Cartões de crédito</p>
    <p className="text-sm text-secondary">Pague em até 12x</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <Bandeira nome="Visa" />
      <Bandeira nome="Master" />
      <Bandeira nome="Elo" />
      <Bandeira nome="Amex" />
    </div>

    <p className="mt-4 text-xs text-secondary">
      Pagamento processado com segurança. A nota fiscal é emitida pela loja
      vendedora em todo pedido.
    </p>
  </div>
)
