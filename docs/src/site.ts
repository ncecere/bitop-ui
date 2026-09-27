/*
 * Where the registry is served. SITE_URL is injected at build time by
 * vite.config.ts (env SITE_URL or VITE_SITE_URL); /r/<item>.json lives under it.
 */
export const SITE_URL: string = __SITE_URL__;
export const REGISTRY_URL = `${SITE_URL}/r`;

/** The registry source for components.json when installing from this site. */
export const registryTemplate = `${REGISTRY_URL}/{name}.json`;

/** The install command for items (the source comes from components.json). */
export const addCommand = (names: string[]) => `npx @bitop-dev/cli add ${names.join(" ")}`;
