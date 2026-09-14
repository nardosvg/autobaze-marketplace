"use client"

import { toast } from "@/lib/helpers/toast"

// "Compartilhar" da pagina da loja (padrao ML): share nativo no mobile,
// copia o link no desktop.
export const BotaoCompartilharLoja = ({ nome }: { nome: string }) => {
  const compartilhar = async () => {
    const url = window.location.origin + window.location.pathname
    try {
      if (navigator.share) {
        await navigator.share({ title: `${nome} no AutoBaze Marketplace`, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success({ title: "Link da loja copiado!" })
    } catch {
      // usuario cancelou o share — nada a fazer
    }
  }

  return (
    <button
      type="button"
      onClick={compartilhar}
      className="flex items-center gap-1.5 text-sm font-medium text-[#0F52FF] hover:underline"
      data-testid="share-seller-button"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M15 8a3 3 0 1 0-2.83-4H12a3 3 0 0 0 .17 1.02L8.9 7.1a3 3 0 1 0 0 5.8l3.27 2.08A3 3 0 1 0 15 13c-.6 0-1.16.18-1.63.48l-3.4-2.16a3 3 0 0 0 0-1.64l3.4-2.16c.47.3 1.03.48 1.63.48Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      Compartilhar
    </button>
  )
}
