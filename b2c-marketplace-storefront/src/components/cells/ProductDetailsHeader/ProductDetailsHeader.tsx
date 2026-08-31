"use client"

import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { Chat } from "@/components/organisms/Chat/Chat"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce(
    (
      acc: Record<string, string>,
      varopt: HttpTypes.StoreProductOptionValue
    ) => {
      acc[varopt.option?.title.toLowerCase() || ""] = varopt.value

      return acc
    },
    {}
  )
}

export const ProductDetailsHeader = ({
  product,
  locale,
  user,
  wishlist,
  avaliacoes,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist
  avaliacoes?: { media: number; total: number }
}) => {
  const { allSearchParams } = useGetAllSearchParams()

  const { cheapestVariant, cheapestPrice } = getProductPrice({
    product,
  })

  // Check if product has any valid prices in current region
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  // set default variant
  const selectedVariant = hasAnyPrice
    ? {
        ...optionsAsKeymap(cheapestVariant.options ?? null),
        ...allSearchParams,
      }
    : allSearchParams

  // get selected variant id
  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

  // get variant price
  const { variantPrice } = getProductPrice({
    product,
    variantId,
  })

  return (
    <div data-testid="product-details-header">
      <div className="flex justify-between">
        <div>
          <h2 className="label-md text-secondary">
            {/* {product?.brand || "Sem marca"} */}
          </h2>
          <h1 className="heading-lg text-primary" data-testid="product-title">{product.title}</h1>
          {avaliacoes && avaliacoes.total > 0 && (
            <a
              href="#avaliacoes"
              className="mt-1 flex items-center gap-2 text-sm text-secondary hover:underline"
              data-testid="product-rating-summary"
            >
              <span className="font-medium text-primary">
                {avaliacoes.media.toFixed(1).replace(".", ",")}
              </span>
              <span className="relative inline-block leading-none" aria-hidden>
                <span className="text-[15px] tracking-tight text-neutral-300">★★★★★</span>
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden whitespace-nowrap"
                  style={{ width: `${Math.max(0, Math.min(5, avaliacoes.media)) * 20}%` }}
                >
                  <span className="text-[15px] tracking-tight text-[#0F52FF]">★★★★★</span>
                </span>
              </span>
              <span>({avaliacoes.total})</span>
            </a>
          )}
          <div className="mt-2 flex gap-2 items-center" data-testid="product-price-container">
            {hasAnyPrice && variantPrice ? (
              <>
                <span className="heading-md text-primary" data-testid="product-price-current">
                  {variantPrice.calculated_price}
                </span>
                {variantPrice.calculated_price_number !==
                  variantPrice.original_price_number && (
                  <span className="label-md text-secondary line-through" data-testid="product-price-original">
                    {variantPrice.original_price}
                  </span>
                )}
              </>
            ) : (
              <span className="label-md text-secondary pt-2 pb-4" data-testid="product-price-unavailable">
                Indisponível na sua região
              </span>
            )}
          </div>
        </div>
        <div>
          {/* Add to Wishlist */}
          <WishlistButton
            productId={product.id}
            wishlist={wishlist}
            user={user}
          />
        </div>
      </div>
      {/* Product Variants */}
      {hasAnyPrice && (
        <ProductVariants product={product} selectedVariant={selectedVariant} />
      )}
      {/* Compra fica no CompraBox da coluna direita (estilo ML) */}
      {/* Seller message */}

      {user && product.seller && (
        <Chat
          user={user}
          seller={product.seller}
          buttonClassNames="w-full uppercase"
          product={product}
        />
      )}
    </div>
  )
}
