import { ProductDetails, ProductGallery } from "@/components/organisms"
import {
  AvaliacoesProduto,
  BreadcrumbCategorias,
  CapaVendedor,
  CardLoja,
  CompraBox,
  MeiosPagamento,
} from "@/components/cells"
import { MLRail } from "@/components/sections/HomeML/MLRail"
import { MLProductCard } from "@/components/sections/HomeML/MLProductCard"
import { listProducts } from "@/lib/data/products"
import { getProdutoExtras } from "@/lib/data/product-extras"
import { getProductOffers, rankOffers } from "@/lib/data/offers"
import { getSellerFull } from "@/lib/data/sellers"
import { getPerguntas } from "@/lib/data/perguntas"
import { getFotosAvaliacoes } from "@/lib/data/avaliacoes-fotos"
import { retrieveCustomer } from "@/lib/data/customer"
import { getUserWishlists } from "@/lib/data/wishlist"
import type { Wishlist } from "@/types/wishlist"
import { CompatibilidadeVeiculo, PerguntasProduto } from "@/components/cells"
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

  // Vendedor principal da pagina: o dono do produto quando existe; num
  // produto master (modelo de ofertas) e' o vencedor do buybox.
  let sellerPrincipal: any = prod.seller ?? null
  if (!sellerPrincipal) {
    const ofertas = await getProductOffers(prod.id)
    const vencedora = (await rankOffers(ofertas))[0]
    if (vencedora?.seller?.handle) {
      sellerPrincipal = await getSellerFull(vencedora.seller.handle)
    }
  }

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

  // Perguntas & respostas + fotos das avaliacoes + sessao do comprador
  const [qa, fotosAvaliacoes, user] = await Promise.all([
    getPerguntas(prod.id),
    getFotosAvaliacoes(prod.id),
    retrieveCustomer().catch(() => null),
  ])
  const logado = !!user
  let wishlist: Wishlist = { products: [] }
  if (logado) {
    wishlist = await getUserWishlists({ countryCode: locale }).catch(() => ({
      products: [],
    }))
  }

  const maisDaLoja = (prod.seller?.products ?? [])
    .filter((p: any) => p && p.id !== prod.id)
    .slice(0, 12) as HttpTypes.StoreProduct[]

  return (
    <>
      {/* Capa full-bleed, colada no navbar */}
      <CapaVendedor seller={sellerPrincipal} />
      <div className="container !pt-4">
      <BreadcrumbCategorias categorias={extras.categorias} titulo={prod.title ?? undefined} />

      {/* Verificador de compatibilidade (FIPE), estilo ML — acima do anuncio */}
      <div className="mb-6">
        <CompatibilidadeVeiculo
          masterId={((prod.metadata as any)?.catalogo_master_id as string) ?? null}
          logado={logado}
        />
      </div>

      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8"
        data-testid="product-details-page"
      >
        <div className="lg:col-span-5" data-testid="product-gallery-container">
          <ProductGallery images={prod?.images || []} />
        </div>
        <div className="lg:col-span-4" data-testid="product-details-container">
          <ProductDetails
            product={prod}
            locale={locale}
            avaliacoes={{ media: extras.media, total: extras.total }}
            sellerPrincipal={sellerPrincipal}
          />
        </div>
        {/* Coluna direita: compra sempre visivel + loja + pagamento */}
        <aside className="space-y-4 md:col-span-2 lg:col-span-3">
          <CompraBox product={prod} locale={locale} logado={logado} wishlist={wishlist} />
          <CardLoja seller={sellerPrincipal} />
          <MeiosPagamento />
        </aside>
      </div>

      <div className="mt-12 space-y-12">
        <PerguntasProduto
          productId={prod.id}
          sellerId={sellerPrincipal?.id ?? null}
          logado={logado}
          perguntas={qa.perguntas}
          minhasPendentes={qa.minhasPendentes}
        />
        <AvaliacoesProduto
          avaliacoes={extras.avaliacoes}
          media={extras.media}
          total={extras.total}
          fotos={fotosAvaliacoes}
        />
        <RailSection
          heading="Quem viu este produto também viu"
          products={relacionados}
        />
        <RailSection heading="Mais desta loja" products={maisDaLoja} />
      </div>
      </div>
    </>
  )
}
