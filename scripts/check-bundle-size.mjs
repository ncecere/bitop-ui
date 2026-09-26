#!/usr/bin/env node
/*
 * Docs bundle-size budget. Run after `npm run docs:build`.
 *
 * Reads dist/index.html to find what the browser downloads before the home
 * page can render: the entry <script type="module"> and every
 * <link rel="modulepreload"> (its static imports). Prints a size table (raw
 * and gzip, largest first) for that initial JS and the largest lazy chunks,
 * and exits 1 if a budget is exceeded:
 *
 *   entry chunk      the JS file index.html's <script> points at
 *   initial JS       entry + modulepreloaded chunks (raw and gzip)
 *   any chunk        no single JS file may exceed MAX_CHUNK (Vite's own
 *                    500 kB warning threshold, enforced)
 *
 * Budgets have ~25-30% headroom over the build they were set on. If you legitimately
 * need more, raise them here in the same PR and say why; if a page's content
 * lands in the entry chunk, it is usually a static import that should be lazy.
 *
 * Usage: node scripts/check-bundle-size.mjs [--dist dist]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const KB = 1000;
// At the time of writing: entry 267 kB raw; initial JS 580 kB raw / 197 kB
// gzip (of which React + ReactDOM, in their own chunk, are 219 / 67 kB).
const BUDGET = {
  entryRaw: 350 * KB,
  initialRaw: 720 * KB,
  initialGzip: 250 * KB,
  maxChunkRaw: 500 * KB,
};

const argDist = process.argv.indexOf("--dist");
const dist = path.resolve(argDist !== -1 ? process.argv[argDist + 1] : "dist");
const htmlPath = path.join(dist, "index.html");
if (!fs.existsSync(htmlPath)) {
  console.error(`check-bundle-size: ${path.relative(process.cwd(), htmlPath)} not found. Run \`npm run docs:build\` first.`);
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, "utf8");

/** Map a URL from index.html (which includes Vite's base path) to a file in dist. */
function toFile(url) {
  const clean = url.replace(/^[a-z]+:\/\/[^/]+/i, "").split(/[?#]/)[0];
  const parts = clean.split("/").filter(Boolean);
  for (let i = 0; i < parts.length; i++) {
    const candidate = path.join(dist, ...parts.slice(i));
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`check-bundle-size: ${url} (from index.html) not found in ${dist}`);
}

const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`))?.[1];
const tags = html.match(/<(script|link)\b[^>]*>/g) ?? [];
const entries = tags.filter((t) => t.startsWith("<script") && attr(t, "type") === "module" && attr(t, "src")).map((t) => toFile(attr(t, "src")));
const preloads = tags.filter((t) => t.startsWith("<link") && attr(t, "rel") === "modulepreload" && attr(t, "href")).map((t) => toFile(attr(t, "href")));
if (entries.length !== 1) {
  console.error(`check-bundle-size: expected exactly one <script type="module" src> in index.html, found ${entries.length}`);
  process.exit(1);
}
const entry = entries[0];
const initial = new Set([entry, ...preloads]);

const size = (file) => {
  const buf = fs.readFileSync(file);
  return { file, raw: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length };
};
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const allJs = walk(dist)
  .filter((f) => f.endsWith(".js"))
  .map(size)
  .sort((a, b) => b.raw - a.raw);

const fmt = (n) => `${(n / KB).toFixed(1)} kB`;
const rel = (f) => path.relative(dist, f);
function table(title, rows) {
  const w = Math.max(40, ...rows.map((r) => rel(r.file).length + (r.tag?.length ?? 0) + 1));
  console.log(`\n${title}`);
  console.log(`  ${"file".padEnd(w)} ${"raw".padStart(10)} ${"gzip".padStart(10)}`);
  for (const r of rows) console.log(`  ${(rel(r.file) + (r.tag ? ` ${r.tag}` : "")).padEnd(w)} ${fmt(r.raw).padStart(10)} ${fmt(r.gzip).padStart(10)}`);
}

const initialRows = allJs.filter((r) => initial.has(r.file)).map((r) => ({ ...r, tag: r.file === entry ? "(entry)" : undefined }));
const lazyRows = allJs.filter((r) => !initial.has(r.file));
const sum = (rows, k) => rows.reduce((n, r) => n + r[k], 0);
const initialRaw = sum(initialRows, "raw");
const initialGzip = sum(initialRows, "gzip");
const entryRow = initialRows.find((r) => r.file === entry);

table(`Initial JS (entry + ${initialRows.length - 1} modulepreloaded chunks), largest first`, initialRows);
table(`Largest lazy chunks (15 of ${lazyRows.length})`, lazyRows.slice(0, 15));
console.log(`\n  total JS: ${allJs.length} files, ${fmt(sum(allJs, "raw"))} raw, ${fmt(sum(allJs, "gzip"))} gzip`);

const checks = [
  ["entry chunk (raw)", entryRow.raw, BUDGET.entryRaw],
  ["initial JS (raw)", initialRaw, BUDGET.initialRaw],
  ["initial JS (gzip)", initialGzip, BUDGET.initialGzip],
  [`largest chunk (raw): ${rel(allJs[0].file)}`, allJs[0].raw, BUDGET.maxChunkRaw],
];
console.log("\nBudgets");
let failed = false;
for (const [label, actual, budget] of checks) {
  const ok = actual <= budget;
  failed ||= !ok;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${label.padEnd(56)} ${fmt(actual).padStart(10)} / ${fmt(budget)}`);
}
if (failed) {
  console.error("\ncheck-bundle-size: over budget. Lazy-load the new weight (React.lazy / dynamic import) or raise the budget in scripts/check-bundle-size.mjs with a reason.");
  process.exit(1);
}
console.log("\ncheck-bundle-size: within budget.");
