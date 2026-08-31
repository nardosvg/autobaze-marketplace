"use client"

import { useState } from "react"

import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { criarPergunta, type Pergunta } from "@/lib/data/perguntas"
import { toast } from "@/lib/helpers/toast"

// ---------------------------------------------------------------------------
// "Perguntas e respostas" da pagina de produto (estilo Mercado Livre):
// campo de pergunta + lista de perguntas respondidas. O vendedor responde
// pelo painel AutoBaze.
// ---------------------------------------------------------------------------

const formatarData = (iso: string) => {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return "Hoje"
  if (dias === 1) return "Há 1 dia"
  if (dias < 30) return `Há ${dias} dias`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return meses === 1 ? "Há 1 mês" : `Há ${meses} meses`
  const anos = Math.floor(meses / 12)
  return anos === 1 ? "Há 1 ano" : `Há ${anos} anos`
}

export const PerguntasProduto = ({
  productId,
  sellerId,
  logado,
  perguntas: iniciais,
  minhasPendentes: pendentesIniciais,
}: {
  productId: string
  sellerId: string | null
  logado: boolean
  perguntas: Pergunta[]
  minhasPendentes: Pergunta[]
}) => {
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [pendentes, setPendentes] = useState<Pergunta[]>(pendentesIniciais)

  const perguntar = async () => {
    const limpo = texto.trim()
    if (limpo.length < 5) {
      toast.error({ title: "Escreva sua pergunta (mínimo 5 caracteres)" })
      return
    }
    if (!sellerId) return

    setEnviando(true)
    const res = await criarPergunta({ productId, sellerId, texto: limpo })
    setEnviando(false)

    if (res.error || !res.pergunta) {
      toast.error({ title: res.error || "Não foi possível enviar a pergunta" })
      return
    }
    setPendentes((atual) => [res.pergunta!, ...atual])
    setTexto("")
    toast.success({
      title: "Pergunta enviada!",
      description: "O vendedor recebe sua pergunta e a resposta aparece aqui.",
    })
  }

  return (
    <section className="border-t pt-10" id="perguntas" data-testid="product-questions-section">
      <h2 className="heading-md mb-6">Perguntas e respostas</h2>

      {/* Campo de pergunta */}
      {sellerId && (
        <div className="max-w-3xl">
          {logado ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={texto}
                maxLength={250}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void perguntar()
                }}
                placeholder="Digite sua pergunta..."
                className="h-12 flex-1 rounded-sm border px-4 text-md focus:border-[#0F52FF] focus:outline-none"
                data-testid="question-input"
              />
              <Button
                onClick={perguntar}
                disabled={enviando}
                loading={enviando}
                className="h-12 shrink-0 justify-center px-8"
                data-testid="question-submit"
              >
                Perguntar
              </Button>
            </div>
          ) : (
            <p className="text-md text-secondary">
              <LocalizedClientLink href="/login" className="font-medium text-[#0F52FF] hover:underline">
                Entre na sua conta
              </LocalizedClientLink>{" "}
              pra perguntar ao vendedor.
            </p>
          )}
        </div>
      )}

      {/* Minhas perguntas aguardando resposta */}
      {pendentes.length > 0 && (
        <div className="mt-6 max-w-3xl space-y-3">
          {pendentes.map((p) => (
            <div key={p.id} className="rounded-sm border border-dashed p-3">
              <p className="text-md text-primary">{p.texto}</p>
              <p className="mt-1 text-sm text-secondary">
                Aguardando resposta do vendedor · {formatarData(p.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Ultimas perguntas respondidas */}
      <div className="mt-8 max-w-3xl">
        {iniciais.length === 0 ? (
          <p className="text-md text-secondary">
            Ninguém perguntou sobre este produto ainda.
            {sellerId ? " Sua pergunta pode ajudar outros compradores." : ""}
          </p>
        ) : (
          <>
            <h3 className="mb-4 text-base font-semibold text-neutral-900">Últimas perguntas</h3>
            <div className="space-y-5">
              {iniciais.map((p) => (
                <div key={p.id} data-testid={`question-${p.id}`}>
                  <p className="text-md text-primary">{p.texto}</p>
                  {p.resposta && (
                    <div className="mt-1.5 flex gap-2 pl-4 text-secondary">
                      <span aria-hidden className="select-none">└</span>
                      <p className="text-md">
                        {p.resposta}{" "}
                        <span className="whitespace-nowrap text-sm">
                          · {formatarData(p.respondida_em || p.created_at)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
