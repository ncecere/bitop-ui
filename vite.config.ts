import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { docsMeta } from "./docs/docs-meta-plugin.ts";

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
  plugins: [react(), docsMeta({ contentDir: fileURLToPath(new URL("./docs/src/content", import.meta.url)) }), spaFallback()],
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  // Each component page (and the heavier guide pages) is its own chunk; the
  // entry's size budget is enforced by scripts/check-bundle-size.mjs.
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          // React + ReactDOM change rarely: keep them in their own long-cached chunk.
          groups: [{ name: "react", test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 10 }],
        },
      },
    },
  },
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
