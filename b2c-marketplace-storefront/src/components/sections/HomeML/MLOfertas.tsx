import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@/lib/data/products"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

import { MLProductCard } from "./MLProductCard"

// "AS MELHORES OFERTAS" — trilho horizontal de cards estilo ML com os
// produtos mais recentes do marketplace.
export const MLOfertas = async ({ locale }: { locale: string }) => {
  let products: HttpTypes.StoreProduct[] = []

  try {
    // Mesmo caminho do carrossel original da home (que funcionava): o
    // listProductsWithSort refaz a ordenacao por preco em memoria e devolvia
    // lista vazia pro nosso catalogo.
    const { response } = await listProducts({
      countryCode: locale,
      queryParams: { limit: 12, order: "created_at" },
    })
    products = response.products as HttpTypes.StoreProduct[]
  } catch (e) {
    console.error("[MLOfertas] falha ao listar produtos:", e)
    return null
  }

  if (!products?.length) {
    console.warn("[MLOfertas] lista vazia pra locale", locale)
    return null
  }

  return (
    <section className="container mx-auto w-full px-4 py-8 lg:px-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold uppercase tracking-wide text-neutral-800">
          As melhores ofertas
        </h2>
        <LocalizedClientLink
          href="/categories"
          className="text-sm font-medium text-[#0F52FF] hover:underline"
        >
          Ver mais
        </LocalizedClientLink>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {products.map((p) => (
          <MLProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
