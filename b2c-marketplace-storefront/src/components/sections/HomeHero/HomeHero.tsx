import Link from "next/link"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// ---------------------------------------------------------------------------
// Hero da home do AutoBaze Marketplace.
//
// CSS puro em vez de foto: o template Fleek dependia de uma imagem de moda
// que nao temos equivalente em autopecas, e um painel grafico carrega
// instantaneo e nunca fica com cara de banco de imagem. O fundo escuro com
// brilho azul segue a marca (azul #0F52FF).
// ---------------------------------------------------------------------------

const DESTAQUES = [
  "Lojas reais, com estoque de verdade",
  "Nota fiscal em toda compra",
  "Peças novas com garantia",
]

export const HomeHero = ({ vendorUrl }: { vendorUrl: string }) => {
  return (
    <section className="w-full container mt-5">
      <div className="relative overflow-hidden rounded-sm border bg-[#0b0f1d] px-6 py-14 lg:px-14 lg:py-20 text-white">
        {/* brilho azul da marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(15,82,255,0.9) 0%, rgba(15,82,255,0) 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full opacity-25 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(15,82,255,0.8) 0%, rgba(15,82,255,0) 70%)",
          }}
        />

        <div className="relative max-w-[680px]">
          <p className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-widest text-white/80">
            Marketplace de autopeças
          </p>
          <h1 className="text-4xl font-bold uppercase leading-tight md:text-5xl">
            A peça certa pro seu carro, de quem entende de peça
          </h1>
          <p className="mt-5 max-w-[560px] text-lg text-white/75">
            Compre de autopeças e oficinas de todo o Brasil. Preços de quem
            compete pela sua compra, estoque real e nota fiscal em todo pedido.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LocalizedClientLink
              href="/categories"
              className="inline-flex items-center justify-center rounded-sm bg-action px-8 py-3 font-bold uppercase text-white transition-colors hover:bg-action-hover"
            >
              Ver peças
            </LocalizedClientLink>
            <Link
              href={vendorUrl}
              className="inline-flex items-center justify-center rounded-sm border border-white/30 px-8 py-3 font-bold uppercase text-white transition-colors hover:bg-white/10"
            >
              Vender no marketplace
            </Link>
          </div>

          <ul className="mt-10 flex flex-col gap-2 text-sm text-white/70 sm:flex-row sm:gap-6">
            {DESTAQUES.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#0F52FF]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
