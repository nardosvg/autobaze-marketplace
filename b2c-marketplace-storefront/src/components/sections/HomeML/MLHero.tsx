"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HERO_BANNERS } from "@/config/hero-banners"

// ---------------------------------------------------------------------------
// Hero estilo Mercado Livre: faixa na cor da marca com carrossel de banners
// de IMAGEM (setas + dots + autoplay). As artes vem de src/config/hero-banners.
// ---------------------------------------------------------------------------

const INTERVALO_MS = 6000

export const MLHero = () => {
  const total = HERO_BANNERS.length
  const [indice, setIndice] = useState(0)

  const ir = useCallback(
    (delta: number) => setIndice((i) => (i + delta + total) % total),
    [total]
  )

  useEffect(() => {
    if (total < 2) return
    const id = setInterval(() => ir(1), INTERVALO_MS)
    return () => clearInterval(id)
  }, [ir, total])

  if (!total) return null

  return (
    <section className="w-full bg-[#0F52FF]">
      {/* Full-bleed: a imagem E' a faixa, de borda a borda, sem container. */}
      <div className="relative w-full">
        <div className="relative h-[220px] w-full overflow-hidden md:h-[340px] lg:h-[440px]">
          {/* Trilho: todos os slides lado a lado, translate no eixo X */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${indice * 100}%)` }}
          >
            {HERO_BANNERS.map((b) => {
              const conteudo = (
                <div className="relative h-[220px] w-full md:h-[340px] lg:h-[440px]">
                  <Image
                    src={b.src}
                    alt={b.alt}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                    // SVG nao passa pelo otimizador (dangerouslyAllowSVG desligado);
                    // arte final em jpg/png segue otimizada normalmente.
                    unoptimized={b.src.endsWith(".svg")}
                  />
                </div>
              )
              return (
                <div key={b.src} className="w-full shrink-0">
                  {b.externo ? (
                    <Link href={b.href} aria-label={b.alt}>
                      {conteudo}
                    </Link>
                  ) : (
                    <LocalizedClientLink href={b.href} aria-label={b.alt}>
                      {conteudo}
                    </LocalizedClientLink>
                  )}
                </div>
              )
            })}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                aria-label="Banner anterior"
                onClick={() => ir(-1)}
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow hover:bg-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Próximo banner"
                onClick={() => ir(1)}
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow hover:bg-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </>
          )}
        </div>

        {total > 1 && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {HERO_BANNERS.map((b, i) => (
              <button
                key={b.src}
                type="button"
                aria-label={`Ir pro banner ${i + 1}`}
                onClick={() => setIndice(i)}
                className={
                  i === indice
                    ? "h-2 w-6 rounded-full bg-white"
                    : "h-2 w-2 rounded-full bg-white/40 hover:bg-white/70"
                }
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
