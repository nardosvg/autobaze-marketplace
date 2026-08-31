import type { AvaliacaoProduto } from "@/lib/data/product-extras"

// ---------------------------------------------------------------------------
// "Opinioes do produto" no estilo Mercado Livre: resumo com media grande,
// estrelas e barras por nota a esquerda; lista de opinioes a direita.
// Server component puro; recebe as avaliacoes ja filtradas (published).
// ---------------------------------------------------------------------------

const AZUL = "#0F52FF"

export const EstrelasNota = ({
  nota,
  tamanho = 18,
}: {
  nota: number
  tamanho?: number
}) => (
  <span
    className="relative inline-block align-middle leading-none"
    role="img"
    aria-label={`${nota.toFixed(1)} de 5 estrelas`}
  >
    <span style={{ fontSize: tamanho }} className="tracking-tight text-neutral-300">
      ★★★★★
    </span>
    <span
      className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
      style={{ width: `${Math.max(0, Math.min(5, nota)) * 20}%` }}
    >
      <span style={{ fontSize: tamanho, color: AZUL }} className="tracking-tight">
        ★★★★★
      </span>
    </span>
  </span>
)

const formatarData = (iso: string) => {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return "Hoje"
  if (dias === 1) return "Há 1 dia"
  if (dias < 30) return `Há ${dias} dias`
  const meses = Math.floor(dias / 30)
  if (meses === 1) return "Há 1 mês"
  if (meses < 12) return `Há ${meses} meses`
  const anos = Math.floor(meses / 12)
  return anos === 1 ? "Há 1 ano" : `Há ${anos} anos`
}

const nomeCliente = (a: AvaliacaoProduto) => {
  const nome = [a.customer?.first_name, a.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim()
  return nome || "Cliente do marketplace"
}

export const AvaliacoesProduto = ({
  avaliacoes,
  media,
  total,
  fotos = {},
}: {
  avaliacoes: AvaliacaoProduto[]
  media: number
  total: number
  /** Fotos por review_id (modulo extras). */
  fotos?: Record<string, string[]>
}) => {
  const porNota = [5, 4, 3, 2, 1].map((n) => ({
    nota: n,
    qtd: avaliacoes.filter((a) => a.rating === n).length,
  }))

  // Faixa "Opinioes com fotos": junta as fotos de todas as avaliacoes
  const faixaFotos = avaliacoes
    .flatMap((a) => (fotos[a.id] ?? []).map((url) => ({ url, rating: a.rating })))
    .slice(0, 8)

  return (
    <section className="border-t pt-10" id="avaliacoes" data-testid="product-reviews-section">
      <h2 className="heading-md mb-8">Opiniões do produto</h2>

      {total === 0 ? (
        <p className="text-md text-secondary max-w-xl">
          Este produto ainda não tem avaliações. Compre e seja o primeiro a
          avaliar: sua opinião aparece aqui depois da entrega.
        </p>
      ) : (
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Resumo: media + barras */}
          <div className="w-full max-w-xs shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[56px] font-medium leading-none" style={{ color: AZUL }}>
                {media.toFixed(1).replace(".", ",")}
              </span>
              <div>
                <EstrelasNota nota={media} tamanho={20} />
                <p className="mt-1 text-sm text-secondary">
                  {total === 1 ? "1 avaliação" : `${total} avaliações`}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {porNota.map(({ nota, qtd }) => (
                <div key={nota} className="flex items-center gap-3 text-sm text-secondary">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-neutral-500"
                      style={{ width: total ? `${(qtd / total) * 100}%` : 0 }}
                    />
                  </div>
                  <span className="w-8 shrink-0 tabular-nums">
                    {nota} <span className="text-neutral-400">★</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de opinioes */}
          <div className="min-w-0 flex-1">
            {faixaFotos.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 text-base font-semibold text-neutral-900">
                  Opiniões com fotos
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {faixaFotos.map((f, i) => (
                    <span key={`${f.url}-${i}`} className="relative shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt="Foto enviada por um comprador"
                        className="h-24 w-24 rounded-sm border object-cover"
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 left-1 rounded-sm bg-black/70 px-1 text-xs font-semibold text-white">
                        {f.rating} ★
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="divide-y">
            {avaliacoes.map((a) => (
              <article key={a.id} className="py-5 first:pt-0" data-testid={`product-review-${a.id}`}>
                <div className="flex items-center justify-between gap-4">
                  <EstrelasNota nota={a.rating} tamanho={15} />
                  <span className="shrink-0 text-sm text-secondary">
                    {formatarData(a.created_at)}
                  </span>
                </div>
                {(fotos[a.id] ?? []).length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {(fotos[a.id] ?? []).map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt="Foto da avaliação"
                        className="h-20 w-20 rounded-sm border object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {a.customer_note && (
                  <p className="mt-2 text-md text-primary">{a.customer_note}</p>
                )}
                <p className="mt-2 text-sm text-secondary">{nomeCliente(a)}</p>
              </article>
            ))}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
