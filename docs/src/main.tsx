import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The library's stylesheet entry (font, tokens, neutral theme, base layer),
// then the opt-in UF brand theme (scoped to data-brand="uf").
import "@/registry/bitop/ui/styles/bitop.css";
import "@/registry/bitop/ui/themes/uf.css";
import "./docs.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
