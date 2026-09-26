#!/usr/bin/env node
/*
 * Builds the registry into public/r with the shadcn CLI.
 *
 * registry.json (the source of truth) declares dependencies between items as
 * `@bitop/<name>`. Those resolve in any project that configured the `@bitop`
 * namespace in components.json. When SITE_URL (or VITE_SITE_URL) is set, this
 * script rewrites them to absolute URLs (`${SITE_URL}/r/<name>.json`) in a
 * temporary copy before building, so items installed by direct URL resolve
 * their dependencies without any namespace configuration.
 *
 *   npm run registry:build                                   # namespaced deps
 *   SITE_URL=https://OWNER.github.io/bitop-ui npm run registry:build
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/r");
const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || "").replace(/\/+$/, "");

const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const names = new Set(registry.items.map((item) => item.name));

let registryFile = path.join(root, "registry.json");
if (siteUrl) {
  new URL(siteUrl); // throws on an invalid URL
  const rewritten = {
    ...registry,
    homepage: siteUrl,
    items: registry.items.map((item) => ({
      ...item,
      ...(item.registryDependencies && {
        registryDependencies: item.registryDependencies.map((dep) => {
          const match = dep.match(/^@bitop\/(.+)$/);
          if (!match) return dep;
          if (!names.has(match[1])) throw new Error(`${item.name}: unknown registry dependency ${dep}`);
          return `${siteUrl}/r/${match[1]}.json`;
        }),
      }),
    })),
  };
  // Keep the temporary registry.json inside the project root so file paths
  // (relative to the project root) resolve exactly as they do for the source.
  const tmpDir = path.join(root, ".cache/registry");
  fs.mkdirSync(tmpDir, { recursive: true });
  registryFile = path.join(tmpDir, "registry.json");
  fs.writeFileSync(registryFile, JSON.stringify(rewritten, null, 2));
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const bin = path.join(root, "node_modules/.bin/shadcn");
const result = spawnSync(bin, ["build", path.relative(root, registryFile), "--output", "public/r", "--cwd", root], {
  cwd: root,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);

const built = fs.readdirSync(outDir).filter((f) => f.endsWith(".json"));
console.log(
  `Built ${built.length - 1} items into public/r (${siteUrl ? `dependencies point to ${siteUrl}/r` : "dependencies use the @bitop namespace"}).`,
);
