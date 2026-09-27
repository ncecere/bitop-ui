#!/usr/bin/env node
/*
 * Styling and behaviour policy for bitop-ui: every component is Base UI +
 * CSS Modules + CSS variables. Fails (exit 1) with one actionable line per
 * violation:
 *
 *  1. Banned packages: package.json and registry.json dependencies must not
 *     include Tailwind, Radix, CSS-in-JS, class-name utilities or other
 *     component kits, and registry source must not import them.
 *  2. CSS Modules only: every .css under registry/bitop/ui/<component>/ is a
 *     *.module.css; only ui/styles/* and ui/themes/* may be global. No
 *     Tailwind directives (@tailwind, @apply) anywhere.
 *  3. Tokens only: no literal colours (hex, rgb[a], hsl[a], hwb, lab, lch,
 *     oklab, oklch) in component .tsx / .module.css. Comments are ignored;
 *     color-mix() is fine when it only mixes var(--…), currentColor and
 *     transparent. Inline style objects must not contain literal colours or
 *     px/numeric lengths (CSS custom properties with unitless/seconds values
 *     are fine).
 *  4. Base UI for behaviour: a registry:ui item that is not on the
 *     DISPLAY_ONLY allowlist must import @base-ui/react, or import another
 *     bitop item that (transitively) does. Items with popup / disclosure /
 *     tab / listbox semantics must import @base-ui/react themselves (no
 *     hand-rolled popups). Allowlisted items must stay display-only: no
 *     keyboard handlers, tabIndex, focus management, popup ARIA or form
 *     controls (a plain native <button> is allowed; see CONTRIBUTING).
 *
 * Usage: node scripts/check-styling.mjs [--root <dir>]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const argRoot = process.argv.indexOf("--root");
const root =
  argRoot !== -1 && process.argv[argRoot + 1]
    ? path.resolve(process.argv[argRoot + 1])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Components with no interactive behaviour of their own. Adding a name here
 * is a deliberate decision: say why in the comment.
 */
const DISPLAY_ONLY = new Set([
  "alert", // text + optional native dismiss <button>
  "aspect-ratio", // a CSS aspect-ratio box around media
  "badge",
  "card",
  "empty-state",
  "image", // <img> with loading / error presentation; no interaction
  "kbd",
  "loader", // decorative dots / status text
  "marker", // static status / note / separator row; `render` only swaps the element
  "package-info", // static dependency-change card: text, badges and lists only
  "page-header",
  "save-bar", // sticky container for a form's buttons and a status message
  "skeleton",
  "sparkline", // one SVG trend in a role="img"; no interaction
  "spinner",
  "stat-card", // metric tile; `render`/`href` only turn the label into a link
  "table",
  "time", // <time> with formatted text; its only effect is a refresh timer for relative times
]);

const BANNED = [
  [/^(tailwindcss|@tailwindcss\/.+|tailwind-merge|tailwind-variants|tailwindcss-animate|tw-animate-css)$/, "Tailwind"],
  [/^(@radix-ui\/.+|radix-ui)$/, "Radix (use @base-ui/react)"],
  [/^(styled-components|@emotion\/.+|@stitches\/.+|@vanilla-extract\/.+|@linaria\/.+|@pandacss\/.+|goober|styled-jsx)$/, "CSS-in-JS (use CSS Modules)"],
  [/^(clsx|classnames|class-variance-authority|cva)$/, "class-name utilities (use cx() from bitop-utils and data attributes)"],
  [/^(@mui\/.+|@material-ui\/.+|@chakra-ui\/.+|@mantine\/.+|antd|@ant-design\/.+|@headlessui\/.+|react-aria|react-aria-components|@react-aria\/.+|@react-stately\/.+|@ark-ui\/.+)$/, "another component kit (use @base-ui/react)"],
];

const errors = [];
const fail = (where, msg, fix) => errors.push(`${where}: ${msg}${fix ? `\n      fix: ${fix}` : ""}`);
const rel = (abs) => path.relative(root, abs).split(path.sep).join("/");
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), "utf8"));
const bannedReason = (name) => BANNED.find(([re]) => re.test(name))?.[1];
const stripVersion = (dep) => dep.replace(/(?<=.)@[^/]*$/, "");
const packageName = (spec) => (spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

/** Removes comments but keeps line breaks, so reported line numbers stay right. */
function stripComments(src, css) {
  const blank = (m) => m.replace(/[^\n]/g, " ");
  let out = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (!css) out = out.replace(/(^|[^:"'`\\])\/\/[^\n]*/g, (m, pre) => pre + blank(m.slice(pre.length)));
  return out;
}
const lineOf = (src, index) => src.slice(0, index).split("\n").length;

// ---------- 1. Banned packages ----------
const pkg = readJson("package.json");
for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
  for (const name of Object.keys(pkg[field] ?? {})) {
    const reason = bannedReason(name);
    if (reason) fail(`package.json ${field}`, `"${name}" is not allowed (${reason})`, `npm uninstall ${name}`);
  }
}
const registry = readJson("registry.json");
for (const item of registry.items) {
  for (const dep of item.dependencies ?? []) {
    const name = stripVersion(dep);
    const reason = bannedReason(name);
    if (reason) fail(`registry.json ${item.name}`, `dependency "${name}" is not allowed (${reason})`, `remove it from the item's dependencies`);
  }
}

// ---------- 2–3. Files ----------
const uiDir = path.join(root, "registry/bitop/ui");
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;
const STYLE_PX = /-?\d*\.?\d+px\b/;
const STYLE_NUMERIC_LENGTH = /\b(width|height|min[A-Z]\w*|max[A-Z]\w*|top|left|right|bottom|inset\w*|margin\w*|padding\w*|gap|rowGap|columnGap|fontSize|lineHeight|borderRadius|borderWidth|outlineOffset|flexBasis)\s*:\s*-?\d/;

/** Returns the text of each inline style object: style={{…}} and style: {…}. */
function styleObjects(src) {
  const found = [];
  const re = /style=\{\{|style:\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") depth--;
      i++;
    }
    found.push({ text: src.slice(m.index, i), index: m.index });
  }
  return found;
}

function checkColours(file, src, css) {
  const code = stripComments(src, css);
  // Allow color-mix() whose arguments are only tokens / currentColor / transparent.
  for (const m of code.matchAll(COLOR)) {
    fail(
      `${rel(file)}:${lineOf(code, m.index)}`,
      `literal colour "${m[0].replace(/\($/, "(…)")}"`,
      "use a semantic token such as var(--color-text-muted); add a new token to themes/neutral.css (and uf.css) with its contrast ratio if none fits",
    );
  }
  if (css && /@tailwind\b|@apply\b/.test(code)) fail(rel(file), "Tailwind directive (@tailwind/@apply)", "write plain CSS in the module");
  if (!css) {
    for (const { text, index } of styleObjects(code)) {
      const where = `${rel(file)}:${lineOf(code, index)}`;
      if (STYLE_PX.test(text)) fail(where, `inline style with a px value: ${text.replace(/\s+/g, " ").slice(0, 80)}`, "move the value into the CSS Module or a --token");
      else if (STYLE_NUMERIC_LENGTH.test(text)) fail(where, `inline style with a numeric length (React adds px): ${text.replace(/\s+/g, " ").slice(0, 80)}`, "move the value into the CSS Module, or pass it as a CSS custom property");
    }
  }
}

const itemsByName = new Map(registry.items.map((i) => [i.name, i]));
const ownerOf = new Map();
for (const item of registry.items) for (const f of item.files ?? []) ownerOf.set(f.path, item.name);

for (const abs of walk(uiDir)) {
  const r = rel(abs);
  const [, , , group] = r.split("/"); // registry/bitop/ui/<group>/…
  const isGlobalDir = group === "styles" || group === "themes";
  if (abs.endsWith(".css")) {
    if (!isGlobalDir && !abs.endsWith(".module.css")) {
      fail(r, "global stylesheet inside a component folder", `rename it to ${path.basename(abs, ".css")}.module.css and import it as a CSS Module`);
    }
    if (!isGlobalDir) checkColours(abs, fs.readFileSync(abs, "utf8"), true);
  } else if (/\.(tsx?|jsx?)$/.test(abs)) {
    const src = fs.readFileSync(abs, "utf8");
    checkColours(abs, src, false);
    for (const m of src.matchAll(/(?:from|import)\s+["']([^"']+)["']/g)) {
      const spec = m[1];
      if (spec.startsWith(".") || spec.startsWith("@/")) {
        if (/\.css$/.test(spec) && !/\.module\.css$/.test(spec) && !spec.includes("/styles/") && !spec.includes("/themes/")) {
          fail(`${r}:${lineOf(src, m.index)}`, `imports global CSS "${spec}"`, "import a *.module.css instead");
        }
        continue;
      }
      const reason = bannedReason(packageName(spec));
      if (reason) fail(`${r}:${lineOf(src, m.index)}`, `imports "${spec}" (${reason})`, "rebuild it with @base-ui/react + a CSS Module");
    }
  }
}

// ---------- 4. Base UI for behaviour ----------
const HANDROLLED = /role=["'{`]+(dialog|alertdialog|menu|menuitem|menubar|listbox|option|combobox|tooltip|tablist|tab|tabpanel|tree|treeitem)\b|aria-haspopup|aria-expanded|createPortal\(/;
const INTERACTIVE = /\bon(Key(Down|Up|Press))\b|\btabIndex\b|\.focus\(|aria-haspopup|aria-expanded|aria-controls|role=["'{`]+(button|dialog|menu|listbox|option|combobox|tooltip|tab|slider|switch|checkbox|textbox)\b|<(input|select|textarea)\b|createPortal\(/;

const info = new Map();
for (const item of registry.items) {
  if (item.type !== "registry:ui") continue;
  let base = false;
  let handrolled = null;
  let interactive = null;
  const deps = new Set();
  for (const f of item.files ?? []) {
    if (!/\.(tsx?|jsx?)$/.test(f.path)) continue;
    const abs = path.join(root, f.path);
    if (!fs.existsSync(abs)) continue;
    const src = stripComments(fs.readFileSync(abs, "utf8"), false);
    if (/["']@base-ui\/react(\/[^"']*)?["']/.test(src)) base = true;
    for (const m of src.matchAll(/["']@\/registry\/bitop\/ui\/([a-z-]+)\//g)) if (m[1] !== item.name && itemsByName.has(m[1])) deps.add(m[1]);
    const h = src.match(HANDROLLED);
    if (h && !handrolled) handrolled = `${f.path}:${lineOf(src, h.index)} (${h[0]})`;
    // A focusable scroll region (tabIndex 0 + role region, WCAG 2.1.1) is not behaviour.
    const scrollRegion = /role\s*[:=]\s*\{?\s*["']region["']/.test(src);
    const scanned = scrollRegion ? src.replace(/\btabIndex\s*[:=]\s*\{?\s*0\b/g, (m) => m.replace(/\S/g, " ")) : src;
    const i = scanned.match(INTERACTIVE);
    if (i && !interactive) interactive = `${f.path}:${lineOf(src, i.index)} (${i[0]})`;
  }
  info.set(item.name, { base, deps, handrolled, interactive });
}

const memo = new Map();
function reachesBaseUi(name, seen = new Set()) {
  if (memo.has(name)) return memo.get(name);
  if (seen.has(name)) return false;
  seen.add(name);
  const i = info.get(name);
  const ok = Boolean(i && (i.base || [...i.deps].some((d) => reachesBaseUi(d, seen))));
  memo.set(name, ok);
  return ok;
}

for (const [name, i] of info) {
  if (DISPLAY_ONLY.has(name)) {
    if (i.interactive) {
      fail(
        `registry item ${name}`,
        `is on the DISPLAY_ONLY allowlist but has interactive code at ${i.interactive}`,
        `build the behaviour on @base-ui/react (or a bitop item that uses it) and remove "${name}" from DISPLAY_ONLY in scripts/check-styling.mjs`,
      );
    }
    continue;
  }
  if (!reachesBaseUi(name)) {
    fail(
      `registry item ${name}`,
      "is not built on Base UI: none of its files import @base-ui/react, directly or through another bitop item",
      `use a Base UI part (node_modules/@base-ui/react/docs/react/components/*.md) or a bitop item such as button/popover; if it truly has no behaviour, add it to DISPLAY_ONLY in scripts/check-styling.mjs with a reason`,
    );
  }
  if (i.handrolled && !i.base) {
    fail(
      `registry item ${name}`,
      `has popup/disclosure semantics at ${i.handrolled} but doesn't import @base-ui/react`,
      "use Base UI Popover / PreviewCard / Collapsible / Menu / Combobox / Tabs instead of hand-rolled ARIA",
    );
  }
}
// Stale allowlist entries only matter for the real registry (fixtures use a subset).
if (argRoot === -1) {
  for (const name of DISPLAY_ONLY) {
    if (!itemsByName.has(name)) fail("scripts/check-styling.mjs", `DISPLAY_ONLY lists unknown item "${name}"`, "remove it from the allowlist");
  }
}

if (errors.length) {
  console.error(`Styling policy failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join("\n"));
  console.error("\nPolicy: Base UI for behaviour, CSS Modules for styles, CSS variables for colours. See CONTRIBUTING.md.");
  process.exit(1);
}
console.log(`Styling policy OK: ${info.size} components (${[...info.keys()].filter((n) => DISPLAY_ONLY.has(n)).length} display-only), ${walk(uiDir).length} files.`);
