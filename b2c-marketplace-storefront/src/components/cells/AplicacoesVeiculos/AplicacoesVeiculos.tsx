"use client"

import { useMemo, useState } from "react"

// ---------------------------------------------------------------------------
// Veiculos compativeis (tabela FIPE do catalogo universal) no MESMO padrao do
// app AutoBaze (veiculos-compativeis.tsx): busca, grupos por marca
// colapsaveis com contagem e tabela Modelo | Ano | Motor.
// ---------------------------------------------------------------------------

export type AplicacaoVeiculo = {
  /** marca */ ma: string
  /** modelo */ mo: string
  /** motor */ mt?: string | null
  /** ano inicial */ ai?: number | null
  /** ano final */ af?: number | null
}

const formatarAnos = (ai?: number | null, af?: number | null) => {
  if (!ai && !af) return "—"
  if (ai && af) return ai === af ? `${ai}` : `${ai} – ${af}`
  if (ai) return `${ai}+`
  return `até ${af}`
}

const Chevron = ({ aberto }: { aberto: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    className={`shrink-0 text-neutral-400 transition-transform duration-200 ${aberto ? "rotate-180" : ""}`}
  >
    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const AplicacoesVeiculos = ({
  aplicacoes,
  total,
}: {
  aplicacoes: AplicacaoVeiculo[]
  total?: number
}) => {
  const [busca, setBusca] = useState("")
  const [abertas, setAbertas] = useState<Set<string>>(new Set())

  const porMarca = useMemo(() => {
    const map: Record<string, AplicacaoVeiculo[]> = {}
    for (const a of aplicacoes) {
      const marca = a.ma || "Outros"
      if (!map[marca]) map[marca] = []
      map[marca].push(a)
    }
    return map
  }, [aplicacoes])

  const filtradas = useMemo(() => {
    if (!busca.trim()) return porMarca
    const termo = busca.toLowerCase()
    const result: Record<string, AplicacaoVeiculo[]> = {}
    for (const marca of Object.keys(porMarca)) {
      const apps = porMarca[marca].filter(
        (a) =>
          a.ma.toLowerCase().includes(termo) ||
          a.mo.toLowerCase().includes(termo) ||
          (a.mt ?? "").toLowerCase().includes(termo)
      )
      if (apps.length) result[marca] = apps
    }
    return result
  }, [busca, porMarca])

  const marcas = Object.keys(filtradas).sort()
  const totalFiltradas = marcas.reduce((s, m) => s + filtradas[m].length, 0)
  const todasAbertas = marcas.length > 0 && marcas.every((m) => abertas.has(m))
  const restante = Math.max(0, (total ?? aplicacoes.length) - aplicacoes.length)

  const toggle = (marca: string) =>
    setAbertas((prev) => {
      const next = new Set(prev)
      if (next.has(marca)) next.delete(marca)
      else next.add(marca)
      return next
    })

  if (!aplicacoes.length) return null

  return (
    <div className="space-y-3">
      {/* Busca + expandir/recolher */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar marca, modelo ou motor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-9 w-full rounded-sm border pl-9 pr-3 text-sm focus:border-[#0F52FF] focus:outline-none"
            data-testid="applications-search"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setAbertas(todasAbertas ? new Set() : new Set(marcas))
          }
          className="shrink-0 text-xs font-medium text-[#0F52FF] hover:underline"
        >
          {todasAbertas ? "Recolher" : "Expandir"} todas
        </button>
      </div>

      {/* Contador */}
      <p className="text-xs text-secondary">
        {totalFiltradas} veículo{totalFiltradas !== 1 ? "s" : ""} compatíve
        {totalFiltradas !== 1 ? "is" : "l"}
        {busca && ` (filtrado de ${aplicacoes.length})`}
      </p>

      {/* Grupos por marca */}
      <div className="max-h-[420px] space-y-1 overflow-y-auto rounded-md border bg-white">
        {marcas.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">
            Nenhum veículo encontrado para &quot;{busca}&quot;
          </div>
        ) : (
          marcas.map((marca) => {
            const apps = filtradas[marca]
            const aberta = abertas.has(marca)
            return (
              <div key={marca}>
                <button
                  type="button"
                  onClick={() => toggle(marca)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50"
                >
                  <Chevron aberto={aberta} />
                  <span className="text-sm font-semibold text-neutral-800">{marca}</span>
                  <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                    {apps.length}
                  </span>
                </button>
                {aberta && (
                  <div className="border-t bg-neutral-50/60">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      <span>Modelo</span>
                      <span>Ano</span>
                      <span>Motor</span>
                    </div>
                    {[...apps]
                      .sort((a, b) => a.mo.localeCompare(b.mo))
                      .map((a, i) => (
                        <div
                          key={`${a.mo}-${a.mt}-${i}`}
                          className="grid grid-cols-[1fr_auto_auto] gap-x-4 border-t px-4 py-2 text-sm"
                        >
                          <span className="text-neutral-700">{a.mo}</span>
                          <span className="tabular-nums text-neutral-500">
                            {formatarAnos(a.ai, a.af)}
                          </span>
                          <span className="text-neutral-500">{a.mt || "—"}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {restante > 0 && (
        <p className="text-sm text-secondary">
          e mais {restante} {restante === 1 ? "aplicação" : "aplicações"}.
        </p>
      )}
    </div>
  )
}
