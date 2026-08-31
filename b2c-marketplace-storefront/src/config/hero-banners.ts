// ---------------------------------------------------------------------------
// Banners do hero da home (carrossel estilo Mercado Livre).
//
// Pra trocar a campanha: coloque a arte em public/banners/ e ajuste aqui.
// Tamanho recomendado: 1180x400 (desktop). O componente faz object-cover,
// entao arte fora dessa proporcao e' cortada nas bordas, nunca distorcida.
// Os dois arquivos atuais sao provisorios ate as artes oficiais chegarem.
// ---------------------------------------------------------------------------

export interface HeroBanner {
  /** Caminho em /public ou URL absoluta. */
  src: string
  alt: string
  /** Destino do clique. Relativo (/categories) recebe o prefixo do locale. */
  href: string
  /** true = link externo (ex: painel AutoBaze), sem prefixo de locale. */
  externo?: boolean
}

export const HERO_BANNERS: HeroBanner[] = [
  {
    src: "/banners/banner-ofertas.svg",
    alt: "Peças com nota fiscal e estoque real — veja as ofertas",
    href: "/categories",
  },
  {
    src: "/banners/banner-vender.svg",
    alt: "Venda no AutoBaze Marketplace",
    href: "https://app.autobaze.com.br/canais-online/marketplace",
    externo: true,
  },
]
