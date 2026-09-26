#!/usr/bin/env node
/*
 * Browser accessibility audit of every docs page with agent-browser (axe in a
 * real Chromium, so colour contrast is checked too). Not part of CI.
 *
 *   npm run build && npm run preview          # in another terminal
 *   AGENT_BROWSER_SESSION=bitop node scripts/a11y-docs.mjs [baseUrl]
 *
 * Audits each page in neutral light, neutral dark, uf light and uf dark and
 * exits non-zero on any WCAG 2.0/2.1 A/AA violation.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] || "http://127.0.0.1:4173").replace(/\/+$/, "");
const registry = JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8"));
const pages = ["/", "/installation", "/theming", "/components", ...registry.items.filter((i) => i.type === "registry:ui").map((i) => `/components/${i.name}`)];
const modes = [
  ["light", "neutral"],
  ["dark", "neutral"],
  ["light", "uf"],
  ["dark", "uf"],
];

const ab = (...args) => execFileSync("agent-browser", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

let failures = 0;
ab("set", "viewport", "1440", "900");
ab("open", `${base}/`);
for (const [theme, brand] of modes) {
  ab("eval", `localStorage.setItem("bitop-color-mode", "${theme}"); localStorage.setItem("bitop-docs-brand", "${brand}"); true`);
  for (const page of pages) {
    ab("open", `${base}${page}`);
    const out = JSON.parse(ab("a11y", "--tags", "wcag2a,wcag2aa,wcag21a,wcag21aa", "--json"));
    const result = out.data ?? out;
    const violations = result.violations ?? [];
    const label = `${theme}/${brand} ${page}`;
    if (violations.length) {
      failures += violations.length;
      console.log(`✗ ${label}`);
      for (const v of violations) console.log(`    [${v.impact}] ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
    } else {
      console.log(`✓ ${label}`);
    }
  }
}
console.log(failures ? `\n${failures} violation(s)` : `\n0 violations across ${pages.length * modes.length} page audits`);
process.exit(failures ? 1 : 0);
