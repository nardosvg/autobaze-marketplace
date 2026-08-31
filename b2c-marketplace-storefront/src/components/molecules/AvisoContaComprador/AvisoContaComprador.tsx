import Link from "next/link"

// ---------------------------------------------------------------------------
// Aviso nas telas de conta: a conta do storefront e' de COMPRADOR. Vendedor
// cria a conta no AutoBaze (app.autobaze.com.br/cadastro). Mesma largura do
// formulario (max-w-xl), compacto, abaixo do form.
// ---------------------------------------------------------------------------

const CADASTRO_VENDEDOR_URL = "https://app.autobaze.com.br/cadastro"

export const AvisoContaComprador = ({ contexto }: { contexto: "cadastro" | "login" }) => (
  <div
    className="mx-auto mt-4 mb-8 w-full max-w-xl rounded-sm border border-[#0F52FF]/25 bg-[#0F52FF]/5 px-5 py-4 text-sm"
    data-testid="aviso-conta-comprador"
  >
    <p className="text-neutral-700">
      <strong className="text-neutral-900">
        {contexto === "cadastro" ? "Esta conta é pra comprar." : "Este login é da conta de comprador."}
      </strong>{" "}
      Tem autopeça ou oficina e quer <strong>vender</strong> no marketplace?{" "}
      <Link href={CADASTRO_VENDEDOR_URL} className="font-semibold text-[#0F52FF] underline">
        Crie sua conta de vendedor no AutoBaze
      </Link>
      .
    </p>
  </div>
)
