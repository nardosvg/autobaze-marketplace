// Faixa de beneficios (o "NAO DEIXE DE CONFERIR" do ML). Icones inline SVG.
const ITENS = [
  {
    titulo: "Nota fiscal em tudo",
    icone: (
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1zm2 5h6M9 12h6" />
    ),
  },
  {
    titulo: "Estoque real",
    icone: <path d="M3 8l9-5 9 5v8l-9 5-9-5V8zm9 5V21M3 8l9 5 9-5" />,
  },
  {
    titulo: "Lojas verificadas",
    icone: <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3zm-3 9l2 2 4-4" />,
  },
  {
    titulo: "Compra garantida",
    icone: <path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7zm4 0V5a4 4 0 0 1 8 0v2" />,
  },
  {
    titulo: "Frete pra todo o Brasil",
    icone: (
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7zM6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
    ),
  },
  {
    titulo: "Pagamento seguro",
    icone: <path d="M3 6h18v12H3zM3 10h18M7 15h3" />,
  },
]

export const MLBeneficios = () => (
  <section className="container mx-auto w-full px-4 py-8 lg:px-8">
    <h2 className="mb-6 text-center text-lg font-bold uppercase tracking-wide text-neutral-800">
      Não deixe de conferir
    </h2>
    <div className="flex justify-start gap-6 overflow-x-auto pb-2 lg:justify-center">
      {ITENS.map((item) => (
        <div
          key={item.titulo}
          className="flex w-[120px] shrink-0 flex-col items-center gap-3 text-center"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-[#0F52FF]">
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {item.icone}
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase leading-tight text-neutral-700">
            {item.titulo}
          </span>
        </div>
      ))}
    </div>
  </section>
)
