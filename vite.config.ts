import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/** GitHub Pages serves 404.html for unknown paths: reuse the SPA entry. */
function spaFallback(): Plugin {
  return {
    name: "bitop-spa-fallback",
    apply: "build",
    closeBundle() {
      const out = path.resolve("dist");
      if (fs.existsSync(path.join(out, "index.html"))) {
        fs.copyFileSync(path.join(out, "index.html"), path.join(out, "404.html"));
        fs.writeFileSync(path.join(out, ".nojekyll"), "");
      }
    },
  };
}

/**
 * SITE_URL (or VITE_SITE_URL) is the absolute URL the docs are served from,
 * e.g. https://OWNER.github.io/bitop-ui. It drives the install commands shown
 * in the docs and the Vite base path (its pathname). Defaults to the local
 * `vite preview` URL.
 */
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "http://localhost:4173").replace(/\/+$/, "");
const base = `${new URL(siteUrl).pathname.replace(/\/+$/, "")}/`;

export default defineConfig({
  base,
  plugins: [react(), spaFallback()],
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // The docs bundle every example eagerly (so each page renders in tests); ~1.2 MB is
  // expected since the AI pages added react-markdown + remark-gfm.
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false, chunkSizeWarningLimit: 1600 },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
    testTimeout: 20_000,
  },
});
