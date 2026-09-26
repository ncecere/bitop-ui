#!/usr/bin/env node
/*
 * Consistency checks for registry.json and the built public/r output, on top
 * of `shadcn registry validate` (which checks the schema):
 *
 *  - every source file under registry/bitop is shipped by exactly one item,
 *    with the expected type and `@ui/` / `@lib/` target
 *  - imports match the item's dependencies / registryDependencies, and
 *    relative imports only point at the item's own CSS module
 *  - no import specifier is mangled by the CLI's `@/registry/<style>/ui`
 *    rewrite (e.g. a lib file whose name contains "/ui")
 *  - components only use CSS custom properties that core or the theme define,
 *    and never read --palette-* primitives
 *  - public/r/<item>.json exists for every item and embeds current sources
 *
 * Usage: node scripts/validate-registry.mjs [--skip-build-output]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skipBuild = process.argv.includes("--skip-build-output");
const errors = [];
const fail = (msg) => errors.push(msg);

const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
if (registry.name !== "bitop") fail(`registry name must be "bitop", got ${registry.name}`);
if (registry.$schema !== "https://ui.shadcn.com/schema/registry.json") fail("registry $schema is wrong");

const items = new Map();
for (const item of registry.items) {
  if (items.has(item.name)) fail(`duplicate item ${item.name}`);
  if (!/^[a-z][a-z0-9-]*$/.test(item.name)) fail(`item name must be kebab-case: ${item.name}`);
  items.set(item.name, item);
}

const FOUNDATION = new Set(["core", "theme-neutral", "theme-uf"]);
const shipped = new Map();

for (const item of registry.items) {
  if (!item.title || !item.description) fail(`${item.name}: title and description are required`);
  for (const file of item.files ?? []) {
    const abs = path.join(root, file.path);
    if (!fs.existsSync(abs)) fail(`${item.name}: missing file ${file.path}`);
    if (shipped.has(file.path)) fail(`${file.path} is shipped by both ${shipped.get(file.path)} and ${item.name}`);
    shipped.set(file.path, item.name);
    const rel = file.path.replace(/^registry\/bitop\//, "");
    const expectedTarget = rel.startsWith("lib/") ? `@lib/${rel.slice(4)}` : `@ui/${rel.replace(/^ui\//, "")}`;
    if (file.target !== expectedTarget) fail(`${item.name}: ${file.path} should target ${expectedTarget}, got ${file.target}`);
    const isCode = /\.(tsx?|jsx?)$/.test(file.path);
    const expectedType = isCode ? (rel.startsWith("lib/") ? "registry:lib" : "registry:ui") : "registry:file";
    // CSS must be registry:file: the CLI parses non-file types as TSX and may rewrite them.
    if (file.type !== expectedType) fail(`${item.name}: ${file.path} should be ${expectedType}, got ${file.type}`);
  }
  for (const dep of item.registryDependencies ?? []) {
    const m = dep.match(/^@bitop\/(.+)$/);
    if (!m) fail(`${item.name}: registryDependencies must use @bitop/<name> in registry.json (got ${dep})`);
    else if (!items.has(m[1])) fail(`${item.name}: unknown registry dependency ${dep}`);
  }
  if (!FOUNDATION.has(item.name) && !(item.registryDependencies ?? []).includes("@bitop/core")) {
    fail(`${item.name}: every component must depend on @bitop/core`);
  }
}

// Every source file must be shipped.
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
for (const abs of walk(path.join(root, "registry/bitop"))) {
  const rel = path.relative(root, abs).split(path.sep).join("/");
  if (!shipped.has(rel)) fail(`${rel} is not part of any registry item`);
}

// Import analysis.
const packageName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
const stripVersion = (dep) => dep.replace(/(?<=.)@[^/]*$/, "");
for (const item of registry.items) {
  const declaredNpm = new Set((item.dependencies ?? []).map(stripVersion));
  const declaredReg = new Set((item.registryDependencies ?? []).map((d) => d.replace(/^@bitop\//, "")));
  const usedNpm = new Set();
  const usedReg = new Set();
  for (const file of item.files ?? []) {
    if (!/\.(tsx?|css)$/.test(file.path)) continue;
    const src = fs.readFileSync(path.join(root, file.path), "utf8");
    const specs = file.path.endsWith(".css")
      ? [...src.matchAll(/@import\s+"([^"]+)"/g)].map((m) => m[1])
      : [...src.matchAll(/(?:from|import)\s+"([^"]+)"/g)].map((m) => m[1]);
    for (const spec of specs) {
      if (spec.startsWith("@/registry/")) {
        if (/^@\/registry\/(.+)\/ui/.test(spec) && !spec.startsWith("@/registry/bitop/ui/")) {
          fail(`${file.path}: "${spec}" would be rewritten to the ui alias by the shadcn CLI (contains "/ui")`);
        }
        const ui = spec.match(/^@\/registry\/bitop\/ui\/([a-z-]+)\//);
        if (ui) {
          const dep = ui[1] === "styles" || ui[1] === "themes" ? "core" : ui[1];
          if (dep !== item.name) usedReg.add(dep);
        } else if (spec.startsWith("@/registry/bitop/lib/")) {
          if (item.name !== "core") usedReg.add("core");
        } else fail(`${file.path}: unexpected registry import ${spec}`);
      } else if (spec.startsWith(".")) {
        const resolved = path.normalize(path.join(path.dirname(file.path), spec)).split(path.sep).join("/");
        const owner = shipped.get(resolved);
        if (owner === item.name) continue;
        // CSS @import may reach into a dependency (core's bitop.css imports the neutral theme).
        if (file.path.endsWith(".css") && owner && declaredReg.has(owner)) {
          usedReg.add(owner);
          continue;
        }
        fail(`${file.path}: relative import ${spec} must point at a file in the same item (use @/registry/bitop/… across items)`);
      } else if (spec.startsWith("@/")) {
        fail(`${file.path}: import ${spec} is outside the registry`);
      } else {
        const pkg = packageName(spec);
        if (pkg !== "react" && pkg !== "react-dom") usedNpm.add(pkg);
      }
    }
  }
  for (const pkg of usedNpm) if (!declaredNpm.has(pkg)) fail(`${item.name}: imports ${pkg} but does not list it in dependencies`);
  for (const pkg of declaredNpm) if (!usedNpm.has(pkg)) fail(`${item.name}: lists unused dependency ${pkg}`);
  for (const dep of usedReg) if (!declaredReg.has(dep)) fail(`${item.name}: imports ${dep} but does not list @bitop/${dep}`);
  for (const dep of declaredReg) {
    if (!usedReg.has(dep) && dep !== "core" && !(item.name === "core" && dep === "theme-neutral")) {
      fail(`${item.name}: lists unused registry dependency @bitop/${dep}`);
    }
  }
}

// CSS custom properties.
const defined = new Set();
for (const f of ["registry/bitop/ui/styles/tokens.css", "registry/bitop/ui/themes/neutral.css"]) {
  for (const m of fs.readFileSync(path.join(root, f), "utf8").matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
}
for (const [file, itemName] of shipped) {
  if (!file.endsWith(".module.css")) continue;
  const css = fs.readFileSync(path.join(root, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const local = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  for (const m of css.matchAll(/var\((--[\w-]+)\s*(,?)/g)) {
    const name = m[1];
    const hasFallback = m[2] === ",";
    if (name.startsWith("--palette-")) fail(`${file}: components must not read palette primitives (${name})`);
    // Base UI exposes positioning variables such as --anchor-width, --available-height.
    const baseUi = /^--(anchor|available|transform-origin|collapsible|accordion|active-tab|indicator|toast|nested|popup|positioner|scroll-area|slider|field|checkbox|radio|switch|progress|meter|viewport|swipe|offset|z-index|gap|peek|height|width|tab)/;
    if (!defined.has(name) && !local.has(name) && !baseUi.test(name) && !hasFallback) fail(`${file} (${itemName}): undefined token ${name}`);
  }
}

// Built output.
if (!skipBuild) {
  const outDir = path.join(root, "public/r");
  if (!fs.existsSync(outDir)) fail("public/r is missing: run npm run registry:build");
  else {
    const index = JSON.parse(fs.readFileSync(path.join(outDir, "registry.json"), "utf8"));
    if (index.items?.length !== registry.items.length) fail("public/r/registry.json is out of date");
    for (const item of registry.items) {
      const p = path.join(outDir, `${item.name}.json`);
      if (!fs.existsSync(p)) {
        fail(`public/r/${item.name}.json is missing`);
        continue;
      }
      const built = JSON.parse(fs.readFileSync(p, "utf8"));
      if (built.$schema !== "https://ui.shadcn.com/schema/registry-item.json") fail(`${item.name}.json: wrong $schema`);
      for (const file of item.files ?? []) {
        const b = built.files?.find((f) => f.path === file.path);
        if (!b) fail(`${item.name}.json: missing ${file.path}`);
        else if (b.content !== fs.readFileSync(path.join(root, file.path), "utf8")) fail(`${item.name}.json: ${file.path} is stale`);
      }
      for (const dep of built.registryDependencies ?? []) {
        if (!/^@bitop\/[a-z-]+$/.test(dep) && !/^https?:\/\/.+\/r\/[a-z-]+\.json$/.test(dep)) {
          fail(`${item.name}.json: unexpected registry dependency ${dep}`);
        }
      }
    }
  }
}

if (errors.length) {
  console.error(`Registry validation failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Registry OK: ${registry.items.length} items, ${shipped.size} files.`);
