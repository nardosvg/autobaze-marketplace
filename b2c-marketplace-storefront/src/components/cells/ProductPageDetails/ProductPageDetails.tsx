// Secao sempre visivel (sem accordion/card): o comprador nao precisa clicar
// pra ver detalhes — padrao Mercado Livre.
export const ProductPageDetails = ({ details }: { details: string }) => {
  if (!details) return null

  return (
    <section className="mt-6 border-t pt-5" data-testid="product-details-section">
      <h4 className="label-lg mb-3 uppercase">Detalhes do produto</h4>
      <div
        className="product-details"
        dangerouslySetInnerHTML={{
          __html: details,
        }}
        data-testid="product-details-content"
      />
    </section>
  )
}
