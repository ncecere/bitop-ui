import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// The library's stylesheet entry (font, tokens, neutral theme, base layer).
import "@/registry/bitop/ui/styles/bitop.css";
import "./docs.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
