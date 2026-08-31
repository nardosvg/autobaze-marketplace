import Image from "next/image"

import { AvatarLoja } from "@/components/atoms/AvatarLoja/AvatarLoja"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import type { SellerProps } from "@/types/seller"

// ---------------------------------------------------------------------------
// Card da loja na coluna direita da pagina de produto (estilo Mercado Livre):
// banner, logo, nome, metricas reais (produtos, avaliacoes da loja) e CTA.
// ---------------------------------------------------------------------------

export const CardLoja = ({ seller }: { seller?: SellerProps | null }) => {
  if (!seller) return null

  const banner = (seller as any).banner as string | undefined
  const logo = ((seller as any).logo as string | undefined) || seller.photo

  const reviews = (seller.reviews ?? []).filter(
    (r: any) => r && r.rating >= 1 && (!r.status || r.status === "published")
  )
  const mediaLoja = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : null
  const qtdProdutos = seller.products?.length ?? 0
  const desde = seller.created_at ? new Date(seller.created_at).getFullYear() : null

  return (
    <div className="overflow-hidden rounded-md border bg-white" data-testid="store-card">
      {banner && (
        <div className="relative h-20 w-full">
          <Image
            src={decodeURIComponent(banner)}
            alt=""
            fill
            className="object-cover"
            sizes="360px"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-3">
          <AvatarLoja
            src={logo}
            nome={seller.name}
            tamanho={44}
            className={banner ? "-mt-9 border-2 border-white shadow" : ""}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-neutral-900">{seller.name}</p>
            <p className="text-sm text-secondary">Loja do marketplace AutoBaze</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
          <div>
            <p className="text-base font-semibold text-neutral-900">
              {qtdProdutos > 0 ? `+${qtdProdutos}` : "—"}
            </p>
            <p className="text-xs text-secondary">Produtos</p>
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">
              {mediaLoja ? mediaLoja.toFixed(1).replace(".", ",") + " ★" : "—"}
            </p>
            <p className="text-xs text-secondary">
              {reviews.length === 1 ? "1 avaliação" : `${reviews.length} avaliações`}
            </p>
          </div>
          <div>
            <p className="text-base font-semibold text-neutral-900">{desde ?? "—"}</p>
            <p className="text-xs text-secondary">No AutoBaze desde</p>
          </div>
        </div>

        <LocalizedClientLink
          href={`/sellers/${seller.handle}`}
          className="mt-4 block rounded-sm bg-[#0F52FF]/10 py-2.5 text-center text-sm font-semibold text-[#0F52FF] transition hover:bg-[#0F52FF]/15"
        >
          Ir para a loja
        </LocalizedClientLink>
      </div>
    </div>
  )
}
