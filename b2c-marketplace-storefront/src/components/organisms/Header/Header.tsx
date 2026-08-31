import Image from "next/image"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"

import { CartDropdown, MobileNavbar } from "@/components/cells"
import { HeartIcon } from "@/icons"
import { UserDropdown } from "@/components/cells/UserDropdown/UserDropdown"
import { Wishlist } from "@/types/wishlist"
import { Badge } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { MessageButton } from "@/components/molecules/MessageButton/MessageButton"
import { SearchBar } from "@/components/molecules/SearchBar/SearchBar"
import { listCategories } from "@/lib/data/categories"
import { getUserWishlists } from "@/lib/data/wishlist"
import { retrieveCustomer } from "@/lib/data/customer"

// ---------------------------------------------------------------------------
// Header estilo Mercado Livre em duas faixas na cor da marca (azul AutoBaze):
//   1. logo | busca grande branca | conta / favoritos / carrinho
//   2. categorias + links de navegacao (Ofertas, Vender, Contato)
// O CountrySelector saiu: so existe a regiao Brasil.
// ---------------------------------------------------------------------------

const VENDER_URL = "https://app.autobaze.com.br/canais-online/marketplace"
const CONTATO_URL = "https://wa.me/5541987444662"

export const Header = async ({ locale }: { locale: string }) => {
  const user = await retrieveCustomer().catch(() => null)
  const isLoggedIn = Boolean(user)

  let wishlist: Wishlist = { products: [] }
  if (user) {
    wishlist = await getUserWishlists({ countryCode: locale })
  }
  const wishlistCount = wishlist?.products.length || 0

  const { categories, parentCategories } = (await listCategories({
    query: { include_ancestors_tree: true },
  })) as {
    categories: HttpTypes.StoreProductCategory[]
    parentCategories: HttpTypes.StoreProductCategory[]
  }
  const navCategorias = parentCategories.length ? parentCategories : categories

  return (
    <header className="bg-[#0F52FF] text-white" data-testid="header">
      {/* Faixa 1: logo, busca, acoes */}
      <div className="container mx-auto flex items-center gap-4 px-4 pt-3 pb-2 lg:px-8">
        <div className="flex items-center gap-2 [&_svg]:text-white">
          <MobileNavbar parentCategories={parentCategories} categories={categories} />
          <LocalizedClientLink
            href="/"
            className="shrink-0"
            data-testid="header-logo-link"
            aria-label="AutoBaze Marketplace"
          >
            {/* Logo "Vertical 2" (escolha do Leonardo), nas cores originais. */}
            <Image
              src="/Logo-navbar.svg"
              width={128}
              height={44}
              alt="AutoBaze"
              priority
              className="h-11 w-auto"
            />
          </LocalizedClientLink>
        </div>

        <div className="flex flex-1 justify-center">
          <SearchBar locale={locale} />
        </div>

        <div
          className="flex items-center gap-3 lg:gap-5 [&_svg]:text-white [&_button]:text-white [&_a]:text-white"
          data-testid="header-actions"
        >
          {isLoggedIn && <MessageButton />}
          <UserDropdown isLoggedIn={isLoggedIn} />
          {isLoggedIn && (
            <LocalizedClientLink
              href="/user/wishlist"
              className="relative"
              data-testid="header-wishlist-link"
              aria-label="Favoritos"
            >
              <HeartIcon size={20} />
              {Boolean(wishlistCount) && (
                <Badge
                  className="absolute -top-2 -right-2 h-4 w-4 p-0"
                  data-testid="wishlist-count-badge"
                >
                  {wishlistCount}
                </Badge>
              )}
            </LocalizedClientLink>
          )}
          <CartDropdown />
        </div>
      </div>

      {/* Faixa 2: categorias + navegacao */}
      <nav
        className="container mx-auto hidden items-center gap-6 overflow-x-auto px-4 pb-2.5 text-sm lg:flex lg:px-8"
        aria-label="Navegação principal"
      >
        <div className="group relative">
          <LocalizedClientLink
            href="/categories"
            className="flex items-center gap-1 font-medium text-white/90 hover:text-white"
          >
            Categorias
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </LocalizedClientLink>
          {navCategorias.length > 0 && (
            <div className="invisible absolute left-0 top-full z-50 min-w-[260px] rounded-md bg-white p-2 text-neutral-800 opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
              {navCategorias.map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                  className="block rounded px-3 py-2 text-sm hover:bg-[#0F52FF] hover:text-white"
                >
                  {c.name}
                </LocalizedClientLink>
              ))}
            </div>
          )}
        </div>
        <LocalizedClientLink href="/categories" className="text-white/90 hover:text-white">
          Ofertas
        </LocalizedClientLink>
        {navCategorias.slice(0, 5).map((c) => (
          <LocalizedClientLink
            key={c.id}
            href={`/categories/${c.handle}`}
            className="whitespace-nowrap text-white/90 hover:text-white"
          >
            {c.name}
          </LocalizedClientLink>
        ))}
        <Link href={VENDER_URL} className="ml-auto whitespace-nowrap font-medium text-white hover:underline">
          Vender no marketplace
        </Link>
        <Link href={CONTATO_URL} className="whitespace-nowrap text-white/90 hover:text-white">
          Contato
        </Link>
      </nav>
    </header>
  )
}
