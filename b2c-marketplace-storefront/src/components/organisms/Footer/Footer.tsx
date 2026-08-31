import Link from "next/link"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { listCategories } from "@/lib/data/categories"

// ---------------------------------------------------------------------------
// Footer estilo Mercado Livre: mega-lista de categorias em colunas + barra
// institucional. Categorias vem da API; links institucionais apontam pro
// AutoBaze (termos/privacidade em operify.com.br/legal, suporte no WhatsApp).
// ---------------------------------------------------------------------------

const INSTITUCIONAL = [
  { label: "Vender no marketplace", href: "https://app.autobaze.com.br/canais-online/marketplace" },
  { label: "Termos e condições", href: "https://operify.com.br/legal/termos" },
  { label: "Privacidade", href: "https://operify.com.br/legal/privacidade" },
  { label: "Contato", href: "https://wa.me/5541987444662" },
]

export const Footer = async () => {
  let categorias: { id: string; name: string; handle: string }[] = []
  try {
    const res = await listCategories()
    const parents = res?.parentCategories ?? []
    categorias = parents.length ? parents : res?.categories ?? []
  } catch {
    // footer sem categorias ainda e footer
  }

  return (
    <footer className="mt-12 border-t bg-white text-neutral-700" data-testid="footer">
      {categorias.length > 0 && (
        <div className="container mx-auto px-4 py-10 lg:px-8">
          <h2 className="mb-6 text-2xl font-medium text-neutral-900">Peças e acessórios</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-md border p-6 sm:grid-cols-3 lg:grid-cols-5">
            {categorias.map((c) => (
              <LocalizedClientLink
                key={c.id}
                href={`/categories/${c.handle}`}
                className="text-sm text-neutral-600 hover:text-[#0F52FF]"
              >
                {c.name}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      )}

      <div className="border-t">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-6 text-xs text-neutral-600 lg:px-8">
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Institucional">
            {INSTITUCIONAL.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-[#0F52FF]">
                {l.label}
              </Link>
            ))}
          </nav>
          <p>© {new Date().getFullYear()} AutoBaze Marketplace. Todos os direitos reservados.</p>
          <p className="text-neutral-400">
            Lojas independentes vendem e entregam os produtos. Toda compra acompanha nota fiscal
            emitida pela loja vendedora.
          </p>
        </div>
      </div>
    </footer>
  )
}
