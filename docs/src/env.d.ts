/// <reference types="vite/client" />

/** Absolute site URL (see vite.config.ts). */
declare const __SITE_URL__: string;

/** Static metadata for every docs content file (the bitop-docs-meta plugin in vite.config.ts). */
declare module "virtual:bitop-docs-meta" {
  const meta: { file: string; slug: string; title: string; category: import("./content/types").Category; description: string }[];
  export default meta;
}
