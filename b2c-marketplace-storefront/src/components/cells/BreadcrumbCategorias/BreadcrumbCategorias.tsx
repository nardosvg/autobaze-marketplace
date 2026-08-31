import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import type { CategoriaProduto } from "@/lib/data/product-extras"

// Breadcrumb da pagina de produto (estilo Mercado Livre): Voltar | categorias.
export const BreadcrumbCategorias = ({
  categorias,
  titulo,
}: {
  categorias: CategoriaProduto[]
  titulo?: string
}) => (
  <nav
    aria-label="Trilha de navegação"
    className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-secondary"
    data-testid="product-breadcrumb"
  >
    <LocalizedClientLink href="/" className="text-[#0F52FF] hover:underline">
      Voltar
    </LocalizedClientLink>
    {categorias.map((cat) => (
      <span key={cat.id} className="flex items-center gap-1.5">
        <span aria-hidden className="text-neutral-300">
          |
        </span>
        <LocalizedClientLink
          href={`/categories/${cat.handle}`}
          className="text-[#0F52FF] hover:underline"
        >
          {cat.name}
        </LocalizedClientLink>
      </span>
    ))}
    {titulo && (
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="text-neutral-300">
          ›
        </span>
        <span className="truncate max-w-[280px]">{titulo}</span>
      </span>
    )}
  </nav>
)
