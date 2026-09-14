"use client"

import { useState } from "react"

import { iniciarLoginGoogle } from "@/lib/data/google"
import { toast } from "@/lib/helpers/toast"

// Botao "Continuar com o Google" (login e criacao de conta do comprador).
export const BotaoGoogleLogin = ({ rotulo = "Continuar com o Google" }: { rotulo?: string }) => {
  const [carregando, setCarregando] = useState(false)

  const entrar = async () => {
    setCarregando(true)
    const res = await iniciarLoginGoogle()
    if (res.url) {
      window.location.href = res.url
      return
    }
    setCarregando(false)
    toast.error({ title: res.error || "Login com Google não está disponível" })
  }

  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs uppercase text-secondary">
        <span className="h-px flex-1 bg-neutral-200" />
        ou
        <span className="h-px flex-1 bg-neutral-200" />
      </div>
      <button
        type="button"
        onClick={entrar}
        disabled={carregando}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-sm border bg-white text-sm font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-60"
        data-testid="google-login-button"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
          <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.7-6c-2.1 1.4-4.7 2.3-7.5 2.3-6.3 0-11.6-3.8-13.5-9.1l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {carregando ? "Redirecionando..." : rotulo}
      </button>
    </>
  )
}
