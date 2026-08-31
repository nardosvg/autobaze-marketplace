"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import { ProductVariants } from "@/components/molecules"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { getProductOffers, type ProductOffer } from "@/lib/data/offers"
import { Chat } from "@/components/organisms/Chat/Chat"
import { SellerProps } from "@/types/seller"
import { WishlistButton } from "../WishlistButton/WishlistButton"
import { Wishlist } from "@/types/wishlist"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

// Buybox: com estoque primeiro, depois menor preco
function rankOffers(offers: ProductOffer[], variantId: string) {
  return offers
    .filter((o) => o.variant_id === variantId)
    .sort((a, b) => {
      const ea = a.estoque > 0 ? 0 : 1
      const eb = b.estoque > 0 ? 0 : 1
      if (ea !== eb) return ea - eb
      return (a.amount ?? Number.MAX_SAFE_INTEGER) - (b.amount ?? Number.MAX_SAFE_INTEGER)
    })
}

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
}: {
  product: HttpTypes.StoreProduct & { seller?: SellerProps }
  locale: string
  user: HttpTypes.StoreCustomer | null
  wishlist?: Wishlist
}) => {
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()

  // Ofertas do produto (modelo marketplace): buybox + outras ofertas
  const [offers, setOffers] = useState<ProductOffer[]>([])
  const [ofertaEscolhida, setOfertaEscolhida] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    getProductOffers(product.id)
      .then((o) => {
        if (vivo) setOffers(o)
      })
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [product.id])

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

  const variantStock =
    product.variants?.find(({ id }) => id === variantId)?.inventory_quantity ||
    0

  const variantHasPrice = !!product.variants?.find(({ id }) => id === variantId)
    ?.calculated_price

  const isVariantStockMaxLimitReached =
    (cart?.items?.find((item) => item.variant_id === variantId)?.quantity ??
      0) >= variantStock

  // Ranking do buybox pra variante selecionada + oferta ativa (vencedora ou
  // a que o comprador escolheu na lista de outras ofertas)
  const ofertasRanqueadas = useMemo(
    () => rankOffers(offers, variantId),
    [offers, variantId]
  )
  const ofertaAtiva =
    ofertasRanqueadas.find((o) => o.id === ofertaEscolhida) ?? ofertasRanqueadas[0] ?? null

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!variantId || !hasAnyPrice || isVariantStockMaxLimitReached) return

    const subtotal = +(variantPrice?.calculated_price_without_tax_number || 0)
    const total = +(variantPrice?.calculated_price_number || 0)

    const storeCartLineItem = {
      thumbnail: product.thumbnail || "",
      product_title: product.title,
      quantity: 1,
      subtotal,
      total,
      tax_total: total - subtotal,
      variant_id: variantId,
      product_id: product.id,
      variant: product.variants?.find(({ id }) => id === variantId),
    }

    // Optimistic update
    onAddToCart(storeCartLineItem, variantPrice?.currency_code || "eur")

    try {
      await addToCart({
        variantId: variantId,
        // Oferta do buybox (ou a escolhida pelo comprador) — o core cria o
        // line item a partir dela
        offerId: ofertaAtiva?.id,
        quantity: 1,
        countryCode: locale,
      })
    } catch (error) {
      toast.error({
        title: "Erro ao adicionar ao carrinho",
        description: "A oferta selecionada não tem estoque suficiente",
      })
    }
  }

  const isAddToCartDisabled = !variantStock || !variantHasPrice || !hasAnyPrice || isVariantStockMaxLimitReached

  return (
    <div className="border rounded-sm p-5" data-testid="product-details-header">
      <div className="flex justify-between">
        <div>
          <h2 className="label-md text-secondary">
            {/* {product?.brand || "Sem marca"} */}
          </h2>
          <h1 className="heading-lg text-primary" data-testid="product-title">{product.title}</h1>
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
      {/* Buybox: vendedor da oferta vencedora + outras ofertas */}
      {ofertaAtiva?.seller && (
        <p className="label-md text-secondary mb-2">
          Vendido por{" "}
          <a
            href={`/${locale}/sellers/${ofertaAtiva.seller.handle}`}
            className="underline text-primary"
          >
            {ofertaAtiva.seller.name}
          </a>
        </p>
      )}
      {ofertasRanqueadas.length > 1 && (
        <div className="mb-4 rounded-sm border p-3">
          <p className="label-sm text-secondary mb-2">
            {ofertasRanqueadas.length} vendedores oferecem este produto
          </p>
          <div className="space-y-1.5">
            {ofertasRanqueadas.map((oferta) => (
              <label
                key={oferta.id}
                className="flex cursor-pointer items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="oferta"
                    checked={ofertaAtiva?.id === oferta.id}
                    onChange={() => setOfertaEscolhida(oferta.id)}
                    disabled={oferta.estoque <= 0}
                  />
                  <span className={oferta.estoque <= 0 ? "text-secondary" : ""}>
                    {oferta.seller?.name ?? "Vendedor"}
                    {oferta.estoque <= 0 ? " (sem estoque)" : ""}
                  </span>
                </span>
                <span className="font-medium">
                  {oferta.amount != null ? BRL.format(oferta.amount) : "—"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      {/* Add to Cart */}
      <Button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        loading={isAddingItem}
        className="w-full uppercase mb-4 py-3 flex justify-center"
        size="large"
        data-testid="product-add-to-cart-button"
      >
        {!hasAnyPrice
          ? "INDISPONÍVEL NA SUA REGIÃO"
          : variantStock && variantHasPrice
          ? "ADICIONAR AO CARRINHO"
          : "SEM ESTOQUE"}
      </Button>
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
