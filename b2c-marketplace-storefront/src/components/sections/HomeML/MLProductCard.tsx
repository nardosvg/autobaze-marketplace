import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { getProductPrice } from "@/lib/helpers/get-product-price"

// Card de produto estilo Mercado Livre: imagem quadrada em fundo branco,
// preco antigo riscado, preco grande, selo verde de desconto.
export const MLProductCard = ({
  product,
}: {
  product: HttpTypes.StoreProduct
}) => {
  const { cheapestPrice } = getProductPrice({ product })
  const temDesconto =
    cheapestPrice &&
    cheapestPrice.original_price_number != null &&
    cheapestPrice.calculated_price_number != null &&
    cheapestPrice.original_price_number > cheapestPrice.calculated_price_number

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="flex h-full w-[230px] shrink-0 flex-col overflow-hidden rounded-md border bg-white shadow-sm transition-shadow hover:shadow-lg"
      data-testid="ml-product-card"
    >
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden border-b bg-white">
        <Image
          src={
            product.thumbnail
              ? decodeURIComponent(product.thumbnail)
              : "/images/placeholder.svg"
          }
          alt={product.title || "Produto"}
          width={230}
          height={230}
          className="h-full w-full object-contain"
          sizes="230px"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {temDesconto && (
          <span className="w-fit rounded-sm bg-[#0F52FF] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            Oferta
          </span>
        )}
        <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-snug text-neutral-800">
          {product.title}
        </p>
        {temDesconto && (
          <p className="text-xs text-neutral-400 line-through">
            {cheapestPrice!.original_price}
          </p>
        )}
        <p className="flex items-baseline gap-2">
          <span className="text-2xl font-medium text-neutral-900">
            {cheapestPrice?.calculated_price ?? "—"}
          </span>
          {temDesconto && cheapestPrice?.percentage_diff && (
            <span className="text-sm font-semibold text-green-600">
              {cheapestPrice.percentage_diff}% OFF
            </span>
          )}
        </p>
        <p className="mt-auto text-xs font-medium text-green-600">
          Nota fiscal inclusa
        </p>
      </div>
    </LocalizedClientLink>
  )
}
