import { listCategories } from "@/lib/data/categories"
import { Carousel } from "@/components/cells"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// ---------------------------------------------------------------------------
// Categorias da home — vem da API (as categorias reais de autopecas criadas
// no bootstrap), nao mais da lista hardcoded de moda do template. As nossas
// categorias sao raizes, entao a fonte e parentCategories. Tile grafico no
// lugar de foto: nao dependemos de asset por categoria.
// ---------------------------------------------------------------------------

export const HomeCategories = async ({ heading }: { heading: string }) => {
  let categories: { id: string; name: string; handle: string }[] = []
  try {
    const res = await listCategories()
    const parents = res?.parentCategories ?? []
    const filhos = res?.categories ?? []
    categories = (parents.length ? parents : filhos).slice(0, 12)
  } catch {
    // sem categorias a secao simplesmente nao renderiza
  }

  if (!categories.length) return null

  return (
    <section className="bg-primary py-8 w-full">
      <div className="mb-6">
        <h2 className="heading-lg text-primary uppercase">{heading}</h2>
      </div>
      <Carousel
        items={categories.map((category) => (
          <LocalizedClientLink
            key={category.id}
            href={`/categories/${category.handle}`}
            className="group relative flex w-[233px] aspect-square flex-col justify-end overflow-hidden rounded-sm border bg-component p-5 transition-all hover:border-action"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-[#0F52FF]/10 blur-2xl transition-all group-hover:bg-[#0F52FF]/20"
            />
            <span
              aria-hidden
              className="absolute top-5 left-5 text-6xl font-bold text-[#0F52FF]/15 group-hover:text-[#0F52FF]/25 transition-colors"
            >
              {category.name.charAt(0)}
            </span>
            <h3 className="label-lg text-primary leading-snug">{category.name}</h3>
            <span className="label-sm text-secondary mt-1 group-hover:text-action transition-colors">
              Ver peças →
            </span>
          </LocalizedClientLink>
        ))}
      />
    </section>
  )
}
