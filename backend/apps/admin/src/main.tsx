import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/admin/index.css";
import App from "@mercurjs/admin";

// Idioma padrao pt-BR (mesma logica do painel vendor): traducao ptBR ja vem
// no pacote, mas a deteccao automatica nao casa "pt-BR" do navegador com a
// chave "ptBR". Troca manual continua possivel em Configuracoes -> Idioma.
if (!localStorage.getItem("lng") && !document.cookie.includes("lng=")) {
  localStorage.setItem("lng", "ptBR");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
