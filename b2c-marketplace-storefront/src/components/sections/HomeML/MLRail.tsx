"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Trilho horizontal com setas (estilo carrossel do Mercado Livre). Server
// components passam os cards como children; aqui so' cuida do scroll.
// Setas somem quando nao ha mais pra onde rolar naquele lado.
// ---------------------------------------------------------------------------

export const MLRail = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [podeEsq, setPodeEsq] = useState(false)
  const [podeDir, setPodeDir] = useState(false)

  const atualizar = useCallback(() => {
    const el = ref.current
    if (!el) return
    setPodeEsq(el.scrollLeft > 4)
    setPodeDir(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    atualizar()
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", atualizar, { passive: true })
    window.addEventListener("resize", atualizar)
    return () => {
      el.removeEventListener("scroll", atualizar)
      window.removeEventListener("resize", atualizar)
    }
  }, [atualizar])

  const rolar = (direcao: 1 | -1) => {
    const el = ref.current
    if (!el) return
    // rola quase uma tela de cards por clique
    el.scrollBy({ left: direcao * el.clientWidth * 0.85, behavior: "smooth" })
  }

  const seta =
    "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md transition hover:text-[#0F52FF] hover:shadow-lg"

  return (
    <div className="relative">
      {podeEsq && (
        <button type="button" aria-label="Anterior" onClick={() => rolar(-1)} className={`${seta} -left-3`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {podeDir && (
        <button type="button" aria-label="Próximo" onClick={() => rolar(1)} className={`${seta} -right-3`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  )
}
