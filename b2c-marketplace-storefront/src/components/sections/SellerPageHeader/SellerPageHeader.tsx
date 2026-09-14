import Image from "next/image"
import { HttpTypes } from "@medusajs/types"

import { AvatarLoja } from "@/components/atoms/AvatarLoja/AvatarLoja"
import { BotaoCompartilharLoja } from "@/components/cells/BotaoCompartilharLoja/BotaoCompartilharLoja"
import { BotaoDenunciarLoja } from "@/components/cells/BotaoDenunciarLoja/BotaoDenunciarLoja"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { Chat } from "@/components/organisms/Chat/Chat"
import { sdk } from "@/lib/config"
import type { SellerProps } from "@/types/seller"

// ---------------------------------------------------------------------------
// Header da pagina da loja no padrao Mercado Livre: capa com o card branco
// "Loja oficial" sobreposto + barra de navegacao branca (Inicio, categorias
// reais da loja, Todos os produtos, Avaliacoes) com resumo e Compartilhar.
// ---------------------------------------------------------------------------

export type AbaLoja = "inicio" | "produtos" | "avaliacoes"

async function categoriasDaLoja(sellerId: string) {
  // Categorias raiz dos anuncios da loja (pra nav filtrar de verdade)
  try {
    const { products } = await sdk.client.fetch<{
      products: { sellers?: { id: string }[]; categories?: any[] }[]
    }>(`/store/products`, {
      query: { limit: 100, fields: "id,*sellers,*categories" },
      cache: "no-cache",
    })
    const contagem = new Map<string, { id: string; name: string; qtd: number }>()
    for (const p of products ?? []) {
      if (!p.sellers?.some((s) => s?.id === sellerId)) continue
      for (const c of p.categories ?? []) {
        if (!c || c.parent_category_id) continue
        const atual = contagem.get(c.id) ?? { id: c.id, name: c.name, qtd: 0 }
        atual.qtd++
        contagem.set(c.id, atual)
      }
    }
    return [...contagem.values()].sort((a, b) => b.qtd - a.qtd).slice(0, 4)
  } catch {
    return []
  }
}

export const SellerPageHeader = async ({
  seller,
  user,
  tab = "inicio",
}: {
  seller: SellerProps
  user: HttpTypes.StoreCustomer | null
  tab?: AbaLoja
}) => {
  const banner = (seller as any).banner as string | undefined
  const logo = ((seller as any).logo as string | undefined) || seller.photo

  const reviews = (seller.reviews ?? []).filter((r: any) => r && r.rating >= 1)
  const media = reviews.length
    ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
    : null
  const qtdProdutos = seller.products?.length ?? 0
  const categorias = await categoriasDaLoja(seller.id)

  const base = `/sellers/${seller.handle}`
  const abaCls = (ativa: boolean) =>
    `whitespace-nowrap border-b-2 pb-2.5 pt-3 text-sm font-medium transition-colors ${
      ativa
        ? "border-[#0F52FF] text-[#0F52FF]"
        : "border-transparent text-neutral-700 hover:text-[#0F52FF]"
    }`

  return (
    <section data-testid="seller-page-header">
      {/* Capa com o card "Loja oficial" sobreposto (estilo ML) */}
      <div className="relative h-[120px] w-full overflow-hidden md:h-[160px]">
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
        <div className="container absolute inset-x-0 top-1/2 !py-0" style={{ transform: "translateY(-50%)" }}>
          <div className="inline-flex items-center gap-3 rounded-md bg-white px-4 py-3 shadow-md">
            <AvatarLoja src={logo} nome={seller.name} tamanho={44} />
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-xs text-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0F52FF" aria-hidden>
                  <path d="M12 2 3.8 5.6v5.2c0 5 3.5 9.7 8.2 11.2 4.7-1.5 8.2-6.2 8.2-11.2V5.6L12 2Zm-1.4 14.5-3.5-3.5 1.4-1.4 2.1 2.1 5-5 1.4 1.4-6.4 6.4Z" />
                </svg>
                Loja oficial
              </p>
              <p className="text-base font-semibold text-neutral-900" data-testid="seller-name">
                {seller.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de navegacao branca da loja */}
      <div className="border-b bg-white">
        <div className="container flex flex-wrap items-center gap-x-6 gap-y-0 !py-0">
          <LocalizedClientLink href={base} className={abaCls(tab === "inicio")}>
            Início
          </LocalizedClientLink>
          {categorias.map((c) => (
            <LocalizedClientLink
              key={c.id}
              href={`${base}/produtos?categoria=${c.id}`}
              className={abaCls(false)}
            >
              {c.name}
            </LocalizedClientLink>
          ))}
          <LocalizedClientLink href={`${base}/produtos`} className={abaCls(tab === "produtos")}>
            Todos os produtos
          </LocalizedClientLink>
          <LocalizedClientLink href={`${base}/reviews`} className={abaCls(tab === "avaliacoes")}>
            Avaliações
          </LocalizedClientLink>

          <div className="ml-auto flex items-center gap-4 py-2">
            <span className="hidden text-sm text-secondary md:block">
              {qtdProdutos > 0 ? `+${qtdProdutos} produtos` : ""}
              {media
                ? ` · ${media.toFixed(1).replace(".", ",")} ★ (${reviews.length})`
                : ""}
            </span>
            {user && (
              <Chat
                user={user}
                seller={seller}
                buttonClassNames="h-9"
                variant="tonal"
                buttonSize="small"
              />
            )}
            <BotaoCompartilharLoja nome={seller.name} />
            <BotaoDenunciarLoja />
          </div>
        </div>
      </div>

      {seller.description && (
        <div className="container !pb-0 !pt-4">
          <p
            className="max-w-3xl text-md text-secondary"
            dangerouslySetInnerHTML={{ __html: seller.description }}
          />
        </div>
      )}
    </section>
  )
}
