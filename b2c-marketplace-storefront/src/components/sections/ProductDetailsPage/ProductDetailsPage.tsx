import { ProductDetails, ProductGallery } from "@/components/organisms"
import {
  AvaliacoesProduto,
  BreadcrumbCategorias,
} from "@/components/cells"
import { MLRail } from "@/components/sections/HomeML/MLRail"
import { MLProductCard } from "@/components/sections/HomeML/MLProductCard"
import { listProducts } from "@/lib/data/products"
import { getProdutoExtras } from "@/lib/data/product-extras"
import NotFound from "@/app/not-found"
import { HttpTypes } from "@medusajs/types"

// ---------------------------------------------------------------------------
// Pagina de produto estilo Mercado Livre: breadcrumb de categorias, galeria +
// buybox, opinioes do produto e trilhos de relacionados.
// ---------------------------------------------------------------------------

const RailSection = ({
  heading,
  products,
}: {
  heading: string
  products: HttpTypes.StoreProduct[]
}) => {
  if (!products.length) return null
  return (
    <section className="border-t pt-10">
      <h2 className="heading-md mb-6">{heading}</h2>
      <MLRail>
        {products.map((p) => (
          <MLProductCard key={p.id} product={p} />
        ))}
      </MLRail>
    </section>
  )
}

export const ProductDetailsPage = async ({
  handle,
  locale,
}: {
  handle: string
  locale: string
}) => {
  const prod = await listProducts({
    countryCode: locale,
    queryParams: { handle: [handle], limit: 1 },
    forceCache: true,
  }).then(({ response }) => response.products[0])

  if (!prod) return null

  if (prod.seller?.store_status === "SUSPENDED") {
    return NotFound()
  }

  const extras = await getProdutoExtras(prod.id)

  // Relacionados: mesma categoria, sem o proprio produto
  const categoriaId = extras.categorias[0]?.id
  const relacionados = categoriaId
    ? await listProducts({
        countryCode: locale,
        category_id: categoriaId,
        queryParams: { limit: 13 },
      })
        .then(({ response }) =>
          response.products.filter((p) => p.id !== prod.id).slice(0, 12)
        )
        .catch(() => [])
    : []

  const maisDaLoja = (prod.seller?.products ?? [])
    .filter((p: any) => p && p.id !== prod.id)
    .slice(0, 12) as HttpTypes.StoreProduct[]

  return (
    <>
      <BreadcrumbCategorias categorias={extras.categorias} titulo={prod.title ?? undefined} />
      <div className="flex flex-col md:flex-row lg:gap-12" data-testid="product-details-page">
        <div className="md:w-1/2 md:px-2" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="md:w-1/2 md:px-2" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            avaliacoes={{ media: extras.media, total: extras.total }}
          />
        </div>
      </div>

      <div className="mt-12 space-y-12">
        <AvaliacoesProduto
          avaliacoes={extras.avaliacoes}
          media={extras.media}
          total={extras.total}
        />
        <RailSection
          heading="Quem viu este produto também viu"
          products={relacionados}
        />
        <RailSection heading="Mais desta loja" products={maisDaLoja} />
      </div>
    </>
  )
}
