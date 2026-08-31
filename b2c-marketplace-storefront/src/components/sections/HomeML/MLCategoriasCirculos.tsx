import { listCategories } from "@/lib/data/categories"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// "OUTRAS CATEGORIAS" do ML: circulos com a inicial da categoria (sem
// depender de foto por categoria).
export const MLCategoriasCirculos = async () => {
  let categorias: { id: string; name: string; handle: string }[] = []
  try {
    const res = await listCategories()
    const parents = res?.parentCategories ?? []
    categorias = (parents.length ? parents : res?.categories ?? []).slice(0, 12)
  } catch {
    return null
  }
  if (!categorias.length) return null

  return (
    <section className="container mx-auto w-full px-4 py-8 lg:px-8">
      <h2 className="mb-6 text-center text-lg font-bold uppercase tracking-wide text-neutral-800">
        Categorias
      </h2>
      <div className="flex justify-start gap-6 overflow-x-auto pb-2 lg:justify-center">
        {categorias.map((c) => (
          <LocalizedClientLink
            key={c.id}
            href={`/categories/${c.handle}`}
            className="group flex w-[120px] shrink-0 flex-col items-center gap-3 text-center"
          >
            <span className="flex h-24 w-24 items-center justify-center rounded-full border bg-white text-3xl font-black text-[#0F52FF] shadow-sm transition-all group-hover:border-[#0F52FF] group-hover:shadow-md">
              {c.name.charAt(0)}
            </span>
            <span className="text-xs font-semibold uppercase leading-tight text-neutral-700">
              {c.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
