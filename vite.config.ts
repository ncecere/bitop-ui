import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
  plugins: [react()],
  define: {
    __SITE_URL__: JSON.stringify(siteUrl),
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  build: { outDir: "dist", emptyOutDir: true, sourcemap: false },
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
