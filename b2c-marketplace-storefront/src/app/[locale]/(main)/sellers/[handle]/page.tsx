import { MLProductCard } from "@/components/sections/HomeML/MLProductCard"
import { SellerPageHeader } from "@/components/sections"
import { retrieveCustomer } from "@/lib/data/customer"
import { listProducts } from "@/lib/data/products"
import { getSellerByHandle } from "@/lib/data/seller"
import { SellerProps } from "@/types/seller"

// Inicio da loja (padrao ML): header com nav + grade "Produtos recomendados"
export default async function SellerPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle, locale } = await params

  const seller = (await getSellerByHandle(handle)) as SellerProps
  const user = await retrieveCustomer()

  if (!seller?.id) {
    return null
  }

  // Anuncios mais recentes da loja (modelo ML: 1 anuncio = 1 vendedor)
  const recomendados = await listProducts({
    countryCode: locale,
    queryParams: { limit: 100, order: "created_at" },
  })
    .then(({ response }) =>
      response.products.filter((p) => p.seller?.id === seller.id).slice(0, 15)
    )
    .catch(() => [])

  return (
    <main>
      <SellerPageHeader seller={seller} user={user} tab="inicio" />
      <div className="container">
        <h2 className="heading-md mb-6">Produtos recomendados</h2>
        {recomendados.length === 0 ? (
          <p className="text-md text-secondary">
            Esta loja ainda não tem produtos publicados.
          </p>
        ) : (
          <div className="flex flex-wrap gap-4 max-md:justify-center">
            {recomendados.map((p) => (
              <MLProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
