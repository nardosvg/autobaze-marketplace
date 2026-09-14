import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { AvatarLoja } from "@/components/atoms/AvatarLoja/AvatarLoja"
import { BotaoDenunciarLoja } from "@/components/cells/BotaoDenunciarLoja/BotaoDenunciarLoja"
import { Chat } from "@/components/organisms/Chat/Chat"
import type { SellerProps } from "@/types/seller"

// ---------------------------------------------------------------------------
// Header da pagina da loja (estilo loja oficial do Mercado Livre): capa
// full-bleed colada no navbar, avatar sobreposto, nome + descricao, metricas
// reais (produtos, avaliacoes, desde) e acoes (chat, denunciar).
// ---------------------------------------------------------------------------

export const SellerPageHeader = ({
  seller,
  user,
}: {
  seller: SellerProps
  user: HttpTypes.StoreCustomer | null
}) => {
  const banner = (seller as any).banner as string | undefined
  const logo = ((seller as any).logo as string | undefined) || seller.photo

  const reviews = (seller.reviews ?? []).filter((r: any) => r && r.rating >= 1)
  const media = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : null
  const qtdProdutos = seller.products?.length ?? 0
  const desde = seller.created_at ? new Date(seller.created_at).getFullYear() : null

  return (
    <section data-testid="seller-page-header">
      {/* Capa full-bleed, colada no navbar */}
      <div className="relative h-[140px] w-full overflow-hidden md:h-[220px]">
        {banner ? (
          <Image
            src={decodeURIComponent(banner)}
            alt={`Capa da loja ${seller.name}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized={banner.endsWith(".svg")}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F52FF] to-[#0a3bd1]">
            <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-4xl font-black uppercase tracking-tight text-white/25 md:block">
              {seller.name}
            </span>
          </div>
        )}
      </div>

      {/* Bloco branco com avatar sobreposto */}
      <div className="container !py-0">
        <div className="flex flex-col gap-4 border-b pb-5 pt-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <AvatarLoja
              src={logo}
              nome={seller.name}
              tamanho={88}
              className="relative z-10 -mt-12 border-4 border-white shadow-md md:-mt-14"
            />
            <div className="min-w-0">
              <h1 className="heading-md text-primary" data-testid="seller-name">
                {seller.name}
              </h1>
              <p className="text-sm text-secondary">Loja do marketplace AutoBaze</p>
              {seller.description && (
                <p
                  className="mt-2 max-w-2xl text-md text-primary"
                  dangerouslySetInnerHTML={{ __html: seller.description }}
                />
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 md:pt-1">
            {user && (
              <Chat
                user={user}
                seller={seller}
                buttonClassNames="h-10"
                variant="filled"
                buttonSize="small"
              />
            )}
            <BotaoDenunciarLoja />
          </div>
        </div>

        {/* Metricas reais da loja */}
        <div className="grid grid-cols-3 gap-2 border-b py-4 text-center md:max-w-md md:text-left">
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              {qtdProdutos > 0 ? `+${qtdProdutos}` : "—"}
            </p>
            <p className="text-xs text-secondary">Produtos</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">
              {media ? `${media.toFixed(1).replace(".", ",")} ★` : "—"}
            </p>
            <p className="text-xs text-secondary">
              {reviews.length === 1 ? "1 avaliação" : `${reviews.length} avaliações`}
            </p>
          </div>
          <div>
            <p className="text-lg font-semibold text-neutral-900">{desde ?? "—"}</p>
            <p className="text-xs text-secondary">No AutoBaze desde</p>
          </div>
        </div>
      </div>
    </section>
  )
}
