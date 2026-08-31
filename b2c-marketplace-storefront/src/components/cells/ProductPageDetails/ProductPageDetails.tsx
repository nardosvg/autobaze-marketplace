// Secao "Aplicacoes" sempre visivel (padrao ML): lista dos veiculos
// compativeis vinda da tabela FIPE do catalogo universal
// (product.metadata.aplicacoes, gravada pelo sync/seed). Sem a lista
// estruturada, cai no texto de aplicacao do proprio produto.
export const ProductPageDetails = ({
  details,
  aplicacoes,
  aplicacoesTotal,
}: {
  details: string
  aplicacoes?: string[]
  aplicacoesTotal?: number
}) => {
  const temLista = Array.isArray(aplicacoes) && aplicacoes.length > 0
  if (!temLista && !details) return null

  const restante = temLista
    ? Math.max(0, (aplicacoesTotal ?? aplicacoes!.length) - aplicacoes!.length)
    : 0

  return (
    <section className="mt-6 border-t pt-5" data-testid="product-details-section">
      <h4 className="label-lg mb-3 uppercase">Aplicações</h4>
      {temLista ? (
        <>
          <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {aplicacoes!.map((a) => (
              <li key={a} className="text-md text-primary">
                {a}
              </li>
            ))}
          </ul>
          {restante > 0 && (
            <p className="mt-2 text-sm text-secondary">
              e mais {restante} {restante === 1 ? "aplicação" : "aplicações"}.
            </p>
          )}
        </>
      ) : (
        <div
          className="product-details"
          dangerouslySetInnerHTML={{
            __html: details,
          }}
          data-testid="product-details-content"
        />
      )}
    </section>
  )
}
