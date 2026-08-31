"use client"

import { useState } from "react"

// ---------------------------------------------------------------------------
// Avatar da loja com fallback: tenta a imagem (img puro, sem otimizador —
// aceita qualquer host e SVG, ex.: dicebear) e, se falhar ou nao existir,
// mostra a inicial num circulo azul da marca.
// ---------------------------------------------------------------------------

export const AvatarLoja = ({
  src,
  nome,
  tamanho = 40,
  className = "",
}: {
  src?: string | null
  nome: string
  tamanho?: number
  className?: string
}) => {
  const [quebrou, setQuebrou] = useState(false)

  if (!src || quebrou) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-[#0F52FF] font-bold text-white ${className}`}
        style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.4 }}
        aria-hidden
      >
        {nome?.charAt(0).toUpperCase() || "?"}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={decodeURIComponent(src)}
      alt=""
      width={tamanho}
      height={tamanho}
      className={`shrink-0 rounded-full border bg-white object-cover ${className}`}
      style={{ width: tamanho, height: tamanho }}
      onError={() => setQuebrou(true)}
    />
  )
}
