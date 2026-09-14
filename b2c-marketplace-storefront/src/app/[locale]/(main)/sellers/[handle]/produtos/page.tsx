import { Suspense } from "react"

import { ProductListing, SellerPageHeader } from "@/components/sections"
import { ProductListingSkeleton } from "@/components/organisms/ProductListingSkeleton/ProductListingSkeleton"
import { retrieveCustomer } from "@/lib/data/customer"
import { getSellerByHandle } from "@/lib/data/seller"
import { SellerProps } from "@/types/seller"

// Todos os produtos da loja, com filtros; ?categoria=<id> filtra pela
// categoria clicada na nav do header.
export default async function SellerProdutosPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string; locale: string }>
  searchParams: Promise<{ categoria?: string }>
}) {
  const { handle } = await params
  const { categoria } = await searchParams

  const seller = (await getSellerByHandle(handle)) as SellerProps
  const user = await retrieveCustomer()

  if (!seller?.id) {
    return null
  }

  return (
    <main>
      <SellerPageHeader seller={seller} user={user} tab="produtos" />
      <div className="container !pt-4">
        <Suspense fallback={<ProductListingSkeleton />}>
          <ProductListing
            showSidebar
            seller_id={seller.id}
            category_id={categoria}
          />
        </Suspense>
      </div>
    </main>
  )
}
