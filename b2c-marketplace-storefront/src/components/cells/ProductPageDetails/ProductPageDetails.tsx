import {
  AplicacoesVeiculos,
  type AplicacaoVeiculo,
} from "../AplicacoesVeiculos/AplicacoesVeiculos"

// Secao "Aplicacoes" sempre visivel: veiculos compativeis da tabela FIPE do
// catalogo universal (product.metadata.aplicacoes), no mesmo padrao visual
// do app AutoBaze (busca + grupos por marca + tabela Modelo/Ano/Motor).
// Sem a lista estruturada, cai no texto de aplicacao do proprio produto.
export const ProductPageDetails = ({
  details,
  aplicacoes,
  aplicacoesTotal,
}: {
  details: string
  aplicacoes?: AplicacaoVeiculo[]
  aplicacoesTotal?: number
}) => {
  const temLista =
    Array.isArray(aplicacoes) &&
    aplicacoes.length > 0 &&
    typeof aplicacoes[0] === "object" &&
    aplicacoes[0] !== null &&
    "ma" in aplicacoes[0]
  if (!temLista && !details) return null

  return (
    <section className="mt-6 border-t pt-5" data-testid="product-details-section">
      <h4 className="label-lg mb-3 uppercase">Aplicações</h4>
      {temLista ? (
        <AplicacoesVeiculos aplicacoes={aplicacoes!} total={aplicacoesTotal} />
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
