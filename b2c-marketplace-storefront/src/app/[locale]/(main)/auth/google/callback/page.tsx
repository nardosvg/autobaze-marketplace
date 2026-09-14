"use client"

import { Suspense, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { concluirLoginGoogle } from "@/lib/data/google"
import { toast } from "@/lib/helpers/toast"

// Callback do OAuth do Google: troca o code por sessao e segue pra conta.
function CallbackGoogle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const executado = useRef(false)

  useEffect(() => {
    if (executado.current) return
    executado.current = true

    const params = Object.fromEntries(searchParams.entries())
    concluirLoginGoogle(params).then((res) => {
      if (res.success) {
        toast.success({ title: "Login com Google concluído!" })
        router.replace("/user")
        router.refresh()
      } else {
        toast.error({ title: res.error || "Não foi possível entrar com o Google" })
        router.replace("/login")
      }
    })
  }, [router, searchParams])

  return (
    <main className="container flex min-h-[40vh] items-center justify-center">
      <p className="text-md text-secondary" data-testid="google-callback-loading">
        Conectando com o Google...
      </p>
    </main>
  )
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackGoogle />
    </Suspense>
  )
}
