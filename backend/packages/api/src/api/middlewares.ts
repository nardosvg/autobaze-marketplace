import { authenticate, defineMiddlewares } from "@medusajs/framework/http"

export default defineMiddlewares({
  routes: [
    // Perguntar exige comprador logado; listar e' publico
    {
      matcher: "/store/perguntas",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    // Upload de fotos da avaliacao: comprador logado + body maior (base64)
    {
      matcher: "/store/avaliacoes/:id/fotos",
      method: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
      bodyParser: { sizeLimit: "30mb" },
    },
  ],
})
