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
  sellerPrincipal,
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist
  avaliacoes?: { media: number; total: number }
  sellerPrincipal?: SellerProps | null
}) => {
  const loja = sellerPrincipal ?? product.seller ?? null
  // Condicao do atributo global (Novo/Usado/Recondicionado)
  const condicao = (product as any).attribute_values?.find(
    (av: any) => av?.attribute?.name?.toLowerCase().startsWith("condi")
  )?.value as string | undefined
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
      {/* Linha da loja (estilo ML) */}
      {loja && (
        <a
          href={`/${locale}/sellers/${loja.handle}`}
          className="flex items-center gap-2 text-md font-medium text-[#0F52FF] hover:underline"
          data-testid="product-seller-link"
        >
          {((loja as any).logo || loja.photo) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={decodeURIComponent((loja as any).logo || loja.photo)}
              alt=""
              className="h-6 w-6 rounded-full border object-cover"
            />
          )}
          Acesse a loja oficial de {loja.name}
        </a>
      )}

      {/* Condicao + coracao */}
      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="text-sm text-secondary">{condicao || "Novo"}</p>
        <WishlistButton productId={product.id} wishlist={wishlist} user={user} />
      </div>

      <h1 className="heading-md text-primary" data-testid="product-title">
        {product.title}
      </h1>

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

      {/* Preco estilo ML: riscado em cima, preco grande, selo de desconto */}
      <div className="mt-3" data-testid="product-price-container">
        {hasAnyPrice && variantPrice ? (
          <>
            {variantPrice.original_price_number != null &&
              variantPrice.calculated_price_number != null &&
              variantPrice.original_price_number >
                variantPrice.calculated_price_number && (
                <p
                  className="text-sm text-secondary line-through"
                  data-testid="product-price-original"
                >
                  {variantPrice.original_price}
                </p>
              )}
            <div className="flex items-center gap-2.5">
              <span
                className="text-[32px] font-normal leading-tight text-neutral-900"
                data-testid="product-price-current"
              >
                {variantPrice.calculated_price}
              </span>
              {variantPrice.original_price_number != null &&
                variantPrice.calculated_price_number != null &&
                variantPrice.original_price_number >
                  variantPrice.calculated_price_number && (
                  <span className="rounded-sm bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
                    {Math.round(
                      (1 -
                        variantPrice.calculated_price_number /
                          variantPrice.original_price_number) *
                        100
                    )}
                    % OFF
                  </span>
                )}
            </div>
            <a
              href="#pagamentos"
              className="mt-1 inline-block text-sm text-[#0F52FF] hover:underline"
            >
              Ver meios de pagamento
            </a>
          </>
        ) : (
          <span className="label-md text-secondary" data-testid="product-price-unavailable">
            Indisponível na sua região
          </span>
        )}
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
