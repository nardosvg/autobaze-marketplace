// ---------------------------------------------------------------------------
// Banners do hero da home (carrossel estilo Mercado Livre).
//
// Pra trocar a campanha: coloque a arte em public/banners/ e ajuste aqui.
// O banner e' full-bleed (ocupa a largura toda da tela, 440px de altura no
// desktop). Tamanho recomendado da arte: 1920x440. O componente faz
// object-cover: arte fora dessa proporcao e' cortada nas bordas, nunca
// distorcida — mantenha texto e CTA no centro da imagem.
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
