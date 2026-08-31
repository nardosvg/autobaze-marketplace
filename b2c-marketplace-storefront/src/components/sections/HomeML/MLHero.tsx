"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// ---------------------------------------------------------------------------
// Hero estilo Mercado Livre: faixa na cor da marca (azul AutoBaze no lugar do
// amarelo ML) com carrossel de banners e dots. Banners em CSS puro — quando
// existirem campanhas reais com arte, e' so trocar o conteudo dos slides.
// ---------------------------------------------------------------------------

const SLIDES = [
  {
    id: "pecas",
    titulo: "A PEÇA CERTA PRO SEU CARRO",
    subtitulo: "Lojas de autopeças de todo o Brasil competindo pela sua compra",
    selo: "NOTA FISCAL EM TODO PEDIDO",
    cta: { label: "Ver ofertas", href: "/categories", externo: false },
  },
  {
    id: "lojas",
    titulo: "COMPRE DE QUEM ENTENDE DE PEÇA",
    subtitulo: "Autopeças e oficinas reais, com estoque de verdade",
    selo: "LOJAS VERIFICADAS",
    cta: { label: "Conhecer as lojas", href: "/categories", externo: false },
  },
  {
    id: "vender",
    titulo: "SUA AUTOPEÇA VENDENDO ONLINE",
    subtitulo: "Publique seu estoque no marketplace direto do AutoBaze",
    selo: "PRA LOJISTAS",
    cta: {
      label: "Vender no marketplace",
      href: "https://app.autobaze.com.br/canais-online/marketplace",
      externo: true,
    },
  },
]

const INTERVALO_MS = 6000

export const MLHero = () => {
  const [indice, setIndice] = useState(0)

  const avancar = useCallback(
    () => setIndice((i) => (i + 1) % SLIDES.length),
    []
  )

  useEffect(() => {
    const id = setInterval(avancar, INTERVALO_MS)
    return () => clearInterval(id)
  }, [avancar])

  const slide = SLIDES[indice]

  return (
    <section className="w-full bg-[#0F52FF]">
      <div className="container relative mx-auto flex min-h-[320px] flex-col justify-center overflow-hidden px-4 pb-10 pt-6 lg:px-8">
        {/* grafismo da faixa (seta diagonal, eco do ML) */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-1/2 h-[420px] w-[55%] -translate-y-1/2 skew-x-[-18deg] bg-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-18%] top-1/2 h-[420px] w-[35%] -translate-y-1/2 skew-x-[-18deg] bg-white/5"
        />

        <div key={slide.id} className="relative max-w-[640px] rounded-2xl bg-[#0b0f1d] px-8 py-10 text-white shadow-lg lg:px-12">
          <p className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#0b0f1d]">
            {slide.selo}
          </p>
          <h1 className="text-3xl font-extrabold uppercase leading-tight lg:text-4xl">
            {slide.titulo}
          </h1>
          <p className="mt-3 text-white/75 lg:text-lg">{slide.subtitulo}</p>
          <div className="mt-6">
            {slide.cta.externo ? (
              <Link
                href={slide.cta.href}
                className="inline-flex rounded-full bg-[#0F52FF] px-7 py-2.5 font-bold text-white transition-colors hover:bg-[#0a40d6]"
              >
                {slide.cta.label}
              </Link>
            ) : (
              <LocalizedClientLink
                href={slide.cta.href}
                className="inline-flex rounded-full bg-[#0F52FF] px-7 py-2.5 font-bold text-white transition-colors hover:bg-[#0a40d6]"
              >
                {slide.cta.label}
              </LocalizedClientLink>
            )}
          </div>
        </div>

        {/* dots */}
        <div className="relative mt-6 flex gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIndice(i)}
              className={
                i === indice
                  ? "h-2 w-6 rounded-full bg-white"
                  : "h-2 w-2 rounded-full bg-white/40 hover:bg-white/70"
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
