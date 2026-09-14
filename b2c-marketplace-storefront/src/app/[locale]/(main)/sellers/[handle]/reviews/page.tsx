import { Suspense } from "react"

import { SellerReviewTab } from "@/components/cells"
import { SellerPageHeader } from "@/components/sections"
import { retrieveCustomer } from "@/lib/data/customer"
import { getSellerByHandle } from "@/lib/data/seller"
import { SellerProps } from "@/types/seller"

// Avaliacoes da loja
export default async function SellerReviewsPage({
  params,
}: {
  params: Promise<{ handle: string; locale: string }>
}) {
  const { handle } = await params

  const seller = (await getSellerByHandle(handle)) as SellerProps
  const user = await retrieveCustomer()

  if (!seller?.id) {
    return null
  }

  return (
    <main>
      <SellerPageHeader seller={seller} user={user} tab="avaliacoes" />
      <div className="container !pt-4">
        <Suspense fallback={<div data-testid="seller-reviews-loading">Carregando...</div>}>
          <SellerReviewTab seller_handle={seller.handle} />
        </Suspense>
      </div>
    </main>
  )
}
