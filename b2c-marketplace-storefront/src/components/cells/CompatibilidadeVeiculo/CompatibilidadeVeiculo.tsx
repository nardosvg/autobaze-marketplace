"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/atoms"
import {
  consultarPlacaVeiculo,
  getMarcasVeiculo,
  getModelosVeiculo,
  getVersoesModelo,
  verificarCompatibilidade,
  type OpcaoVeiculo,
  type VersaoVeiculo,
} from "@/lib/data/veiculos"
import {
  getVeiculosSalvos,
  removerVeiculoConta,
  salvarVeiculoConta,
  type VeiculoSalvoConta,
} from "@/lib/data/veiculos-conta"
import { toast } from "@/lib/helpers/toast"

// ---------------------------------------------------------------------------
// "Verifique se e' compativel com seu veiculo" (estilo Mercado Livre):
// placa OU selects encadeados Marca > Modelo > Ano > Versao (tabela FIPE do
// catalogo universal), veredito exato por ano_modelo e veiculo salvo no
// navegador pras proximas paginas.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "ab_veiculo"

type VeiculoSalvo = { vid: string; label: string }

const IconeCarro = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
    <path
      d="M5 13 6.5 8.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13m-14 0h14m-14 0a2 2 0 0 0-2 2v3h2m14-5a2 2 0 0 1 2 2v3h-2m-14 0v1.5M19 18v1.5M19 18H5m2.5-2.5h.01m9 0h.01"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const selectCls =
  "h-11 w-full rounded-sm border bg-white px-3 text-sm text-neutral-800 focus:border-[#0F52FF] focus:outline-none disabled:border-dashed disabled:text-neutral-400"

export const CompatibilidadeVeiculo = ({
  masterId,
  logado = false,
}: {
  masterId?: string | null
  logado?: boolean
}) => {
  const [marcas, setMarcas] = useState<OpcaoVeiculo[]>([])
  const [modelos, setModelos] = useState<OpcaoVeiculo[]>([])
  const [versoes, setVersoes] = useState<VersaoVeiculo[]>([])

  const [marcaId, setMarcaId] = useState("")
  const [modeloId, setModeloId] = useState("")
  const [ano, setAno] = useState("")
  const [versaoId, setVersaoId] = useState("")

  const [placa, setPlaca] = useState("")
  const [buscandoPlaca, setBuscandoPlaca] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [garagem, setGaragem] = useState<VeiculoSalvoConta[]>([])
  const [resultado, setResultado] = useState<{
    compativel: boolean
    label: string
  } | null>(null)

  // Marcas na primeira renderizacao + veiculo salvo (conta > navegador) ->
  // veredito automatico
  useEffect(() => {
    getMarcasVeiculo().then(setMarcas).catch(() => {})
    if (!masterId) return

    const veredito = (vid: string, label: string) =>
      verificarCompatibilidade(masterId, vid).then((r) => {
        if ("compativel" in r) setResultado({ compativel: r.compativel, label })
      })

    if (logado) {
      getVeiculosSalvos()
        .then((vs) => {
          setGaragem(vs)
          if (vs[0]) void veredito(vs[0].ano_modelo_id, vs[0].label)
        })
        .catch(() => {})
      return
    }
    try {
      const salvo = localStorage.getItem(STORAGE_KEY)
      if (!salvo) return
      const v = JSON.parse(salvo) as VeiculoSalvo
      if (v?.vid) void veredito(v.vid, v.label)
    } catch {
      // storage indisponivel — segue com o form
    }
  }, [masterId, logado])

  const escolherMarca = useCallback((id: string) => {
    setMarcaId(id)
    setModeloId("")
    setAno("")
    setVersaoId("")
    setModelos([])
    setVersoes([])
    if (id) getModelosVeiculo(id).then(setModelos).catch(() => {})
  }, [])

  const escolherModelo = useCallback((id: string) => {
    setModeloId(id)
    setAno("")
    setVersaoId("")
    setVersoes([])
    if (id) getVersoesModelo(id).then(setVersoes).catch(() => {})
  }, [])

  const anos = useMemo(() => {
    const set = new Set<number>()
    for (const v of versoes) {
      const ai = v.ano_inicial ?? v.ano_final
      const af = v.ano_final ?? v.ano_inicial
      if (!ai || !af) continue
      for (let a = ai; a <= af; a++) set.add(a)
    }
    return [...set].sort((a, b) => b - a)
  }, [versoes])

  const versoesDoAno = useMemo(() => {
    const alvo = Number(ano)
    if (!alvo) return []
    return versoes.filter((v) => {
      const ai = v.ano_inicial ?? v.ano_final
      const af = v.ano_final ?? v.ano_inicial
      return ai != null && af != null && alvo >= ai && alvo <= af
    })
  }, [versoes, ano])

  // Uma versao so' no ano escolhido -> seleciona sozinho
  useEffect(() => {
    if (versoesDoAno.length === 1) setVersaoId(versoesDoAno[0].id)
  }, [versoesDoAno])

  const labelVeiculo = useMemo(() => {
    const marca = marcas.find((m) => m.id === marcaId)?.nome ?? ""
    const modelo = modelos.find((m) => m.id === modeloId)?.nome ?? ""
    const v = versoes.find((x) => x.id === versaoId)
    return [marca, modelo, ano, v?.motor, v?.versao].filter(Boolean).join(" ")
  }, [marcas, modelos, versoes, marcaId, modeloId, ano, versaoId])

  const verificar = async (vid: string, label: string, placaDoVeiculo?: string) => {
    if (!masterId || !vid) return
    setVerificando(true)
    const r = await verificarCompatibilidade(masterId, vid)
    setVerificando(false)
    if ("error" in r) {
      toast.error({ title: r.error })
      return
    }
    setResultado({ compativel: r.compativel, label })
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ vid, label } satisfies VeiculoSalvo))
    } catch {
      // sem storage, sem persistencia — ok
    }
    // Logado: veiculo vai pra garagem da conta (nao precisa digitar de novo)
    if (logado) {
      void salvarVeiculoConta({ ano_modelo_id: vid, label, placa: placaDoVeiculo ?? null }).then(
        () => getVeiculosSalvos().then(setGaragem).catch(() => {})
      )
    }
  }

  const buscarPlaca = async () => {
    setBuscandoPlaca(true)
    const r = await consultarPlacaVeiculo(placa)
    setBuscandoPlaca(false)
    if ("error" in r) {
      toast.error({ title: r.error })
      return
    }
    // Versao cravada -> verifica direto, sem passos extras
    if (r.versaoId && r.label) {
      await verificar(r.versaoId, r.label, placa)
      return
    }
    // Sem confianca na versao: pre-preenche e o comprador so confirma
    toast.success({
      title: `Veículo da placa: ${r.descricao}`,
      description: "Confirme a versão pra verificar.",
    })
    if (r.marca) {
      escolherMarca(r.marca.id)
      const modelosDaMarca = await getModelosVeiculo(r.marca.id)
      setModelos(modelosDaMarca)
      if (r.modelo) {
        setModeloId(r.modelo.id)
        const vs = await getVersoesModelo(r.modelo.id)
        setVersoes(vs)
        if (r.ano) setAno(String(r.ano))
      }
    }
  }

  const alterarVeiculo = () => {
    setResultado(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ok
    }
  }

  if (!masterId) return null

  // -------------------------------------------------------------------------
  // Veredito (verde/vermelho, estilo ML)
  // -------------------------------------------------------------------------
  if (resultado) {
    const ok = resultado.compativel
    return (
      <section
        className={`overflow-hidden rounded-md border ${ok ? "border-green-600" : "border-red-500"}`}
        data-testid="vehicle-compatibility-result"
      >
        <div
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white ${ok ? "bg-green-600" : "bg-red-500"}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 text-xs">
            {ok ? "✓" : "!"}
          </span>
          {ok ? "Compatível com seu veículo" : "Não é compatível com seu veículo"}
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-neutral-600">
            <IconeCarro className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">{resultado.label}</p>
            <button
              type="button"
              onClick={alterarVeiculo}
              className="text-sm font-medium text-[#0F52FF] hover:underline"
            >
              Alterar veículo
            </button>
          </div>
        </div>
      </section>
    )
  }

  // -------------------------------------------------------------------------
  // Form: placa OU selects encadeados
  // -------------------------------------------------------------------------
  return (
    <section className="rounded-md border bg-white p-4" data-testid="vehicle-compatibility">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-neutral-700">
          <IconeCarro className="h-6 w-6" />
        </span>
        <div>
          <h3 className="text-base font-semibold text-neutral-900">
            Verifique se é compatível com seu veículo
          </h3>
          <p className="text-sm text-secondary">
            Digite a placa ou selecione os dados. Se não souber, procure no
            Certificado de Registro de Veículo.
          </p>
        </div>
      </div>

      {/* Garagem: veiculos salvos na conta */}
      {logado && garagem.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-neutral-600">Seus veículos:</span>
          {garagem.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1.5 rounded-full border bg-neutral-50 py-1 pl-3 pr-1.5 text-sm"
            >
              <button
                type="button"
                onClick={() => verificar(v.ano_modelo_id, v.label, v.placa ?? undefined)}
                className="text-neutral-800 hover:text-[#0F52FF]"
              >
                {v.label}
              </button>
              <button
                type="button"
                aria-label={`Remover ${v.label}`}
                onClick={() => {
                  void removerVeiculoConta(v.id)
                  setGaragem((g) => g.filter((x) => x.id !== v.id))
                }}
                className="flex h-5 w-5 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end">
        {/* Placa */}
        <div className="lg:w-44">
          <label className="mb-1 block text-xs font-medium text-neutral-600">Placa</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={placa}
              maxLength={7}
              onChange={(e) => setPlaca(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") void buscarPlaca()
              }}
              placeholder="ABC1D23"
              className="h-11 w-full rounded-sm border px-3 text-sm uppercase tracking-widest focus:border-[#0F52FF] focus:outline-none"
              data-testid="plate-input"
            />
            <Button
              variant="tonal"
              onClick={buscarPlaca}
              disabled={buscandoPlaca || placa.length < 7}
              loading={buscandoPlaca}
              className="h-11 shrink-0 px-3"
            >
              Buscar
            </Button>
          </div>
        </div>

        <span className="hidden pb-3 text-xs text-secondary lg:block">ou</span>

        {/* Selects encadeados */}
        <div className="grid flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Marca</label>
            <select className={selectCls} value={marcaId} onChange={(e) => escolherMarca(e.target.value)}>
              <option value="">Selecionar</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Modelo</label>
            <select
              className={selectCls}
              value={modeloId}
              disabled={!marcaId}
              onChange={(e) => escolherModelo(e.target.value)}
            >
              <option value="">Selecionar</option>
              {modelos.map((m) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Ano</label>
            <select
              className={selectCls}
              value={ano}
              disabled={!modeloId}
              onChange={(e) => {
                setAno(e.target.value)
                setVersaoId("")
              }}
            >
              <option value="">Selecionar</option>
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Versão</label>
            <select
              className={selectCls}
              value={versaoId}
              disabled={!ano}
              onChange={(e) => setVersaoId(e.target.value)}
            >
              <option value="">Selecionar</option>
              {versoesDoAno.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.motor, v.versao, v.combustivel].filter(Boolean).join(" ") || "Única"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={() => verificar(versaoId, labelVeiculo)}
          disabled={!versaoId || verificando}
          loading={verificando}
          className="h-11 shrink-0 justify-center px-6"
          data-testid="check-compatibility-button"
        >
          Verificar compatibilidade
        </Button>
      </div>
    </section>
  )
}
