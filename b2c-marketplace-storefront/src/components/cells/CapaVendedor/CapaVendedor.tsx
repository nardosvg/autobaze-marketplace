import Image from "next/image"

import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import type { SellerProps } from "@/types/seller"

// ---------------------------------------------------------------------------
// Capa do vendedor no topo da pagina de produto (estilo loja oficial do
// Mercado Livre): banner personalizado da loja em largura total com um card
// branco "Acesse a loja" sobreposto. Sem banner, cai numa capa azul da marca.
// ---------------------------------------------------------------------------

export const CapaVendedor = ({ seller }: { seller?: SellerProps | null }) => {
  if (!seller) return null

  const banner = (seller as any).banner as string | undefined
  const logo = ((seller as any).logo as string | undefined) || seller.photo

  return (
    <section
      className="relative mb-6 h-[120px] w-full overflow-hidden rounded-md md:h-[170px]"
      data-testid="seller-cover"
    >
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
          <span className="absolute right-6 top-1/2 hidden -translate-y-1/2 text-3xl font-black uppercase tracking-tight text-white/25 md:block">
            {seller.name}
          </span>
        </div>
      )}

      {/* Card sobreposto da loja */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8">
        <div className="flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-md">
          {logo ? (
            <Image
              src={decodeURIComponent(logo)}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0F52FF] text-sm font-bold text-white">
              {seller.name?.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="leading-tight">
            <p className="text-sm font-semibold text-neutral-900">{seller.name}</p>
            <LocalizedClientLink
              href={`/sellers/${seller.handle}`}
              className="text-sm text-[#0F52FF] hover:underline"
            >
              Acesse a loja oficial
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
