"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

// ---------------------------------------------------------------------------
// Busca do header, estilo Mercado Livre: caixa branca larga sobre a faixa da
// marca. Num marketplace de autopecas a busca e o caminho numero 1 (o
// comprador chega com o codigo da peca ou o nome do carro) — o template
// Fleek nao tinha busca nenhuma.
//
// Submete pra /categories?query=..., que o listing repassa como `q` pro
// /store/products.
// ---------------------------------------------------------------------------

export const SearchBar = ({ locale }: { locale: string }) => {
  const router = useRouter()
  const [valor, setValor] = useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = valor.trim()
    router.push(
      q
        ? `/${locale}/categories?query=${encodeURIComponent(q)}`
        : `/${locale}/categories`
    )
  }

  return (
    <form
      onSubmit={submit}
      role="search"
      className="flex w-full max-w-[640px] items-center overflow-hidden rounded-sm bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
    >
      <input
        type="search"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar peças, códigos e marcas..."
        aria-label="Buscar peças"
        className="w-full bg-transparent px-4 py-2.5 text-[15px] text-neutral-800 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        aria-label="Buscar"
        className="border-l border-neutral-200 px-3 py-2.5 text-neutral-500 transition-colors hover:text-[#0F52FF]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  )
}
