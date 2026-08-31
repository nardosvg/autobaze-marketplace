import Link from "next/link"

// ---------------------------------------------------------------------------
// Aviso nas telas de conta do storefront: a conta aqui e' de COMPRADOR.
// Quem quer vender cria a conta de vendedor no AutoBaze (o seller do
// marketplace e' o tenant do sistema), nunca por aqui.
// ---------------------------------------------------------------------------

const CADASTRO_VENDEDOR_URL = "https://app.autobaze.com.br/cadastro"

export const AvisoContaComprador = ({ contexto }: { contexto: "cadastro" | "login" }) => (
  <div
    className="mx-auto mb-4 flex w-full max-w-[900px] flex-col gap-3 rounded-sm border border-[#0F52FF]/30 bg-[#0F52FF]/5 p-5 sm:flex-row sm:items-center sm:justify-between"
    data-testid="aviso-conta-comprador"
  >
    <div>
      <p className="font-semibold text-neutral-900">
        {contexto === "cadastro"
          ? "Esta conta é pra comprar no marketplace."
          : "Este login é da sua conta de comprador."}
      </p>
      <p className="text-sm text-neutral-600">
        É dono de autopeça ou oficina e quer <strong>vender</strong> aqui? A conta de vendedor
        é criada no AutoBaze, o sistema de gestão que alimenta o marketplace.
      </p>
    </div>
    <Link
      href={CADASTRO_VENDEDOR_URL}
      className="inline-flex shrink-0 items-center justify-center rounded-sm border border-[#0F52FF] px-5 py-2.5 text-sm font-bold uppercase text-[#0F52FF] transition-colors hover:bg-[#0F52FF] hover:text-white"
    >
      Quero vender
    </Link>
  </div>
)
