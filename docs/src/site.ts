/*
 * Where the registry is served. SITE_URL is injected at build time by
 * vite.config.ts (env SITE_URL or VITE_SITE_URL); /r/<item>.json lives under it.
 */
export const SITE_URL: string = __SITE_URL__;
export const REGISTRY_URL = `${SITE_URL}/r`;

export const itemUrl = (name: string) => `${REGISTRY_URL}/${name}.json`;

export const namespaceCommand = (names: string[]) => `npx shadcn@latest add ${names.map((n) => `@bitop/${n}`).join(" ")}`;
export const urlCommand = (names: string[]) => `npx shadcn@latest add ${names.map(itemUrl).join(" ")}`;

export const registriesSnippet = `"registries": {
  "@bitop": "${REGISTRY_URL}/{name}.json"
}`;
