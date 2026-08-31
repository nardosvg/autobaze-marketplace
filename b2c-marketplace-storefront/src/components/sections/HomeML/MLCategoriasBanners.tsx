import { listCategories } from "@/lib/data/categories"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

// Grade de banners por categoria (o "PNEUS / OLEOS E FILTROS / CONFIRA >"
// do ML). Fundo escuro com faixa diagonal azul, em CSS.
export const MLCategoriasBanners = async () => {
  let categorias: { id: string; name: string; handle: string }[] = []
  try {
    const res = await listCategories()
    const parents = res?.parentCategories ?? []
    categorias = (parents.length ? parents : res?.categories ?? []).slice(0, 6)
  } catch {
    return null
  }
  if (!categorias.length) return null

  return (
    <section className="container mx-auto w-full px-4 py-4 lg:px-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categorias.map((c, i) => (
          <LocalizedClientLink
            key={c.id}
            href={`/categories/${c.handle}`}
            className="group relative flex h-[150px] items-center overflow-hidden rounded-lg bg-[#0b0f1d] px-7 text-white shadow-sm transition-shadow hover:shadow-lg"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute right-[-30px] top-[-40px] h-[260px] w-[120px] rotate-[22deg] bg-[#0F52FF]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute right-[70px] top-[-40px] h-[260px] w-[28px] rotate-[22deg] bg-[#0F52FF]/60"
            />
            <span
              aria-hidden
              className="absolute right-6 bottom-2 text-7xl font-black text-white/10"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="relative rounded-md bg-white/95 px-4 py-3 text-[#0b0f1d]">
              <p className="text-xl font-extrabold uppercase leading-none">{c.name}</p>
              <p className="mt-1 text-sm font-medium text-neutral-600 group-hover:text-[#0F52FF]">
                Confira &gt;
              </p>
            </div>
          </LocalizedClientLink>
        ))}
      </div>
    </section>
  )
}
