"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/atoms"
import { HttpTypes } from "@medusajs/types"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { getProductOffers, type ProductOffer } from "@/lib/data/offers"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"

// ---------------------------------------------------------------------------
// Card de compra da coluna direita (estilo Mercado Livre): estoque, botoes
// "Comprar agora" e "Adicionar ao carrinho" sempre visiveis, vendido por e
// as outras ofertas do buybox.
// ---------------------------------------------------------------------------

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

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
) =>
  variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option?.title.toLowerCase() || ""] = varopt.value
    return acc
  }, {})

export const CompraBox = ({
  product,
  locale,
}: {
  product: HttpTypes.StoreProduct
  locale: string
}) => {
  const router = useRouter()
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()

  const [offers, setOffers] = useState<ProductOffer[]>([])
  const [ofertaEscolhida, setOfertaEscolhida] = useState<string | null>(null)
  const [comprandoAgora, setComprandoAgora] = useState(false)

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

  const { cheapestVariant, cheapestPrice } = getProductPrice({ product })
  const hasAnyPrice = cheapestPrice !== null && cheapestVariant !== null

  const selectedVariant = hasAnyPrice
    ? { ...optionsAsKeymap(cheapestVariant.options ?? null), ...allSearchParams }
    : allSearchParams

  const variantId =
    product.variants?.find(({ options }: { options: any }) =>
      options?.every((option: any) =>
        selectedVariant[option.option?.title.toLowerCase() || ""]?.includes(
          option.value
        )
      )
    )?.id || ""

  const { variantPrice } = getProductPrice({ product, variantId })

  const variantStock =
    product.variants?.find(({ id }) => id === variantId)?.inventory_quantity || 0
  const variantHasPrice = !!product.variants?.find(({ id }) => id === variantId)
    ?.calculated_price
  const maxLimitReached =
    (cart?.items?.find((item) => item.variant_id === variantId)?.quantity ?? 0) >=
    variantStock

  const ofertasRanqueadas = useMemo(
    () => rankOffers(offers, variantId),
    [offers, variantId]
  )
  const ofertaAtiva =
    ofertasRanqueadas.find((o) => o.id === ofertaEscolhida) ??
    ofertasRanqueadas[0] ??
    null

  const estoqueOferta = ofertaAtiva ? ofertaAtiva.estoque : variantStock
  const desabilitado =
    !variantStock || !variantHasPrice || !hasAnyPrice || maxLimitReached

  const adicionar = async () => {
    if (desabilitado || !variantId) return false

    const subtotal = +(variantPrice?.calculated_price_without_tax_number || 0)
    const total = +(variantPrice?.calculated_price_number || 0)

    onAddToCart(
      {
        thumbnail: product.thumbnail || "",
        product_title: product.title,
        quantity: 1,
        subtotal,
        total,
        tax_total: total - subtotal,
        variant_id: variantId,
        product_id: product.id,
        variant: product.variants?.find(({ id }) => id === variantId),
      },
      variantPrice?.currency_code || "eur"
    )

    try {
      await addToCart({
        variantId,
        offerId: ofertaAtiva?.id,
        quantity: 1,
        countryCode: locale,
      })
      return true
    } catch {
      toast.error({
        title: "Erro ao adicionar ao carrinho",
        description: "A oferta selecionada não tem estoque suficiente",
      })
      return false
    }
  }

  const comprarAgora = async () => {
    setComprandoAgora(true)
    const ok = await adicionar()
    if (ok) {
      router.push(`/${locale}/cart`)
    } else {
      setComprandoAgora(false)
    }
  }

  return (
    <div className="rounded-md border bg-white p-4" data-testid="buy-box">
      {estoqueOferta > 0 ? (
        <>
          <p className="text-base font-semibold text-neutral-900">Estoque disponível</p>
          <p className="mt-0.5 text-sm text-secondary">
            {estoqueOferta > 50 ? "+50 disponíveis" : `${estoqueOferta} ${estoqueOferta === 1 ? "disponível" : "disponíveis"}`}
          </p>
        </>
      ) : (
        <p className="text-base font-semibold text-neutral-900">Sem estoque</p>
      )}

      <div className="mt-4 space-y-2">
        <Button
          onClick={comprarAgora}
          disabled={desabilitado || comprandoAgora}
          loading={comprandoAgora}
          className="w-full justify-center py-3"
          data-testid="buy-now-button"
        >
          Comprar agora
        </Button>
        <Button
          variant="tonal"
          onClick={adicionar}
          disabled={desabilitado}
          loading={isAddingItem && !comprandoAgora}
          className="w-full justify-center py-3"
          data-testid="buybox-add-to-cart-button"
        >
          Adicionar ao carrinho
        </Button>
      </div>

      {ofertasRanqueadas.length > 1 && (
        <div className="mt-3 rounded-sm border p-3">
          <p className="mb-2 text-xs text-secondary">
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
                    name="oferta-compra"
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

      <ul className="mt-4 space-y-2 border-t pt-3 text-sm text-secondary">
        <li>
          <span className="font-medium text-neutral-900">Devolução em até 7 dias</span>{" "}
          após o recebimento (CDC, art. 49).
        </li>
      </ul>
    </div>
  )
}
