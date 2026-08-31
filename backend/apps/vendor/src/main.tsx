import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@mercurjs/vendor/index.css";
import App from "@mercurjs/vendor";

// Idioma padrao pt-BR: a traducao ptBR vem embutida no pacote, mas o detector
// do i18next procura a chave exata "ptBR" e o navegador manda "pt-BR", entao
// sem este default o painel cai no ingles. O usuario ainda pode trocar em
// Configuracoes -> Idioma (o seletor grava por cima deste valor).
if (!localStorage.getItem("lng") && !document.cookie.includes("lng=")) {
  localStorage.setItem("lng", "ptBR");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
