"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HttpTypes } from "@medusajs/types"
import useGetAllSearchParams from "@/hooks/useGetAllSearchParams"
import { getProductPrice } from "@/lib/helpers/get-product-price"
import { getProductOffers, type ProductOffer } from "@/lib/data/offers"
import { addWishlistItem, removeWishlistItem } from "@/lib/data/wishlist"
import { toast } from "@/lib/helpers/toast"
import { useCartContext } from "@/components/providers"
import type { Wishlist } from "@/types/wishlist"

// ---------------------------------------------------------------------------
// Card de compra da coluna direita (estilo Mercado Livre): estoque real da
// oferta, seletor de quantidade, botoes Comprar agora/Adicionar ao carrinho,
// outras ofertas do buybox, devolucao e favoritos ("Adicionar a uma lista").
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
  logado = false,
  wishlist,
}: {
  product: HttpTypes.StoreProduct
  locale: string
  logado?: boolean
  wishlist?: Wishlist
}) => {
  const router = useRouter()
  const { addToCart, onAddToCart, cart, isAddingItem } = useCartContext()
  const { allSearchParams } = useGetAllSearchParams()

  const [offers, setOffers] = useState<ProductOffer[]>([])
  const [ofertaEscolhida, setOfertaEscolhida] = useState<string | null>(null)
  const [comprandoAgora, setComprandoAgora] = useState(false)
  const [qtd, setQtd] = useState(1)
  const [favorito, setFavorito] = useState(
    Boolean(wishlist?.products?.some((p) => p.id === product.id))
  )
  const [salvandoFavorito, setSalvandoFavorito] = useState(false)

  useEffect(() => {
    setFavorito(Boolean(wishlist?.products?.some((p) => p.id === product.id)))
  }, [wishlist, product.id])

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

  // Fonte da verdade do estoque: a OFERTA (modelo marketplace — a variante
  // master nao carrega estoque proprio). Sem oferta, cai no estoque da
  // variante (produto fora do modelo de ofertas).
  const estoqueOferta = ofertaAtiva ? ofertaAtiva.estoque : variantStock
  const desabilitado = ofertaAtiva
    ? estoqueOferta <= 0 || !hasAnyPrice
    : !variantStock || !variantHasPrice || !hasAnyPrice || maxLimitReached

  const maxQtd = Math.min(10, Math.max(1, estoqueOferta))
  const qtdFinal = Math.min(qtd, maxQtd)

  const adicionar = async () => {
    if (desabilitado || !variantId) return false

    const subtotal = +(variantPrice?.calculated_price_without_tax_number || 0)
    const total = +(variantPrice?.calculated_price_number || 0)

    onAddToCart(
      {
        thumbnail: product.thumbnail || "",
        product_title: product.title,
        quantity: qtdFinal,
        subtotal: subtotal * qtdFinal,
        total: total * qtdFinal,
        tax_total: (total - subtotal) * qtdFinal,
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
        productId: product.id,
        quantity: qtdFinal,
        countryCode: locale,
      })
      return true
    } catch (e) {
      toast.error({
        title: "Erro ao adicionar ao carrinho",
        description:
          e instanceof Error && e.message
            ? e.message
            : "Não foi possível adicionar este produto",
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

  const alternarLista = async () => {
    if (salvandoFavorito) return
    setSalvandoFavorito(true)
    try {
      if (favorito) {
        await removeWishlistItem({ product_id: product.id })
        setFavorito(false)
      } else {
        await addWishlistItem({ reference: "product", reference_id: product.id })
        setFavorito(true)
        toast.success({ title: "Salvo na sua lista de favoritos" })
      }
    } catch {
      toast.error({ title: "Não foi possível atualizar seus favoritos" })
    } finally {
      setSalvandoFavorito(false)
    }
  }

  return (
    <div className="rounded-md border bg-white p-4" data-testid="buy-box">
      {estoqueOferta > 0 ? (
        <>
          <p className="text-lg font-semibold text-neutral-900">Estoque disponível</p>
          {/* Quantidade, na linha do ML */}
          <div className="mt-2 flex items-center gap-1.5 text-md">
            <label htmlFor="compra-qtd" className="font-medium text-neutral-900">
              Quantidade:
            </label>
            <select
              id="compra-qtd"
              value={qtdFinal}
              onChange={(e) => setQtd(Number(e.target.value))}
              className="cursor-pointer rounded-sm border-0 bg-transparent py-0 pl-0 pr-6 text-md font-medium text-neutral-900 focus:outline-none"
              data-testid="quantity-select"
            >
              {Array.from({ length: maxQtd }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "unidade" : "unidades"}
                </option>
              ))}
            </select>
            <span className="truncate text-sm text-secondary">
              ({estoqueOferta > 50 ? "+50" : estoqueOferta}{" "}
              {estoqueOferta === 1 ? "disponível" : "disponíveis"})
            </span>
          </div>
        </>
      ) : (
        <p className="text-lg font-semibold text-neutral-900">Sem estoque</p>
      )}

      <div className="mt-4 space-y-2.5">
        <Button
          onClick={comprarAgora}
          disabled={desabilitado || comprandoAgora}
          loading={comprandoAgora}
          className="h-12 w-full justify-center rounded-md text-[15px] font-semibold"
          data-testid="buy-now-button"
        >
          Comprar agora
        </Button>
        <button
          type="button"
          onClick={adicionar}
          disabled={desabilitado || (isAddingItem && !comprandoAgora)}
          className="h-12 w-full rounded-md bg-[#0F52FF]/10 text-[15px] font-semibold text-[#0F52FF] transition hover:bg-[#0F52FF]/15 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          data-testid="buybox-add-to-cart-button"
        >
          Adicionar ao carrinho
        </button>
      </div>

      {ofertasRanqueadas.length > 1 && (
        <div className="mt-4 rounded-sm border p-3">
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

      {/* Devolucao (CDC) com icone, estilo ML */}
      <div className="mt-5 flex gap-3 text-sm">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="mt-0.5 shrink-0 text-neutral-500"
        >
          <path
            d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-secondary">
          <span className="font-medium text-[#0F52FF]">Devolução em até 7 dias</span>{" "}
          após o recebimento (CDC, art. 49).
        </p>
      </div>

      {/* Favoritos */}
      <div className="mt-4 border-t pt-3">
        {logado ? (
          <button
            type="button"
            onClick={alternarLista}
            disabled={salvandoFavorito}
            className="flex items-center gap-2.5 text-sm font-medium text-[#0F52FF] hover:underline disabled:opacity-60"
            data-testid="add-to-list-button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden className="shrink-0">
              <path
                d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                fill={favorito ? "currentColor" : "none"}
              />
            </svg>
            {favorito ? "Salvo na sua lista" : "Adicionar a uma lista"}
          </button>
        ) : (
          <LocalizedClientLink
            href="/login"
            className="flex items-center gap-2.5 text-sm font-medium text-[#0F52FF] hover:underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
              <path
                d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            Adicionar a uma lista
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}
