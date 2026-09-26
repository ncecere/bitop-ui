/*
 * Every registry:ui item (and every registry:lib item other than core's
 * bitop-utils) must be imported by at least one behaviour test. The docs-page
 * axe sweep (docs-pages.test.tsx) renders everything, so it doesn't count.
 *
 * registry.json and tests/ are read at test time, so new items are picked up
 * automatically: add a behaviour test that imports the new component.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const testsDir = path.join(root, "tests");
const SELF = path.basename(__filename);
const EXCLUDED_TEST_FILES = new Set(["docs-pages.test.tsx", SELF]);
const EXEMPT_FILES = new Set(["registry/bitop/lib/bitop-utils.ts"]);
const CODE_FILE = /\.(tsx?|jsx?|mjs)$/;

type RegistryFile = { path: string; type: string };
type RegistryItem = { name: string; type: string; files?: RegistryFile[] };

function readRegistry(): RegistryItem[] {
  return JSON.parse(fs.readFileSync(path.join(root, "registry.json"), "utf8")).items;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : walk(p);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

/** Registry module paths ("registry/bitop/ui/select/select") imported by a source file. */
function registryImports(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const specifier = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(["'])(@\/registry\/bitop\/[^"']+)\1/g;
  const out: string[] = [];
  for (const m of code.matchAll(specifier)) out.push((m[2] ?? "").slice(2).replace(CODE_FILE, "").replace(/\/+$/, ""));
  return out;
}

/** Imported registry modules across every test file except the docs sweep. */
function importedByTests(): Set<string> {
  const imported = new Set<string>();
  for (const file of walk(testsDir)) {
    if (EXCLUDED_TEST_FILES.has(path.basename(file))) continue;
    for (const mod of registryImports(fs.readFileSync(file, "utf8"))) imported.add(mod);
  }
  return imported;
}

/** Code files that need coverage for an item (empty when the item is exempt). */
function coverableFiles(item: RegistryItem): string[] {
  if (item.type !== "registry:ui" && item.type !== "registry:lib") return [];
  return (item.files ?? []).map((f) => f.path).filter((p) => CODE_FILE.test(p) && !EXEMPT_FILES.has(p));
}

/**
 * An item counts as covered when a test imports one of its code files, or
 * (for component folders) any module inside one of its folders, e.g.
 * "@/registry/bitop/ui/response/close-markdown".
 */
function isCovered(item: RegistryItem, imported: Set<string>): boolean {
  const files = coverableFiles(item);
  const stems = files.map((p) => p.replace(CODE_FILE, ""));
  const folders = files.filter((p) => p.startsWith("registry/bitop/ui/")).map((p) => `${path.posix.dirname(p)}/`);
  for (const mod of imported) {
    if (stems.includes(mod)) return true;
    if (folders.some((dir) => mod.startsWith(dir))) return true;
  }
  return false;
}

describe("registry test coverage", () => {
  it("parses registry imports from test sources", () => {
    const src = [
      'import { Select } from "@/registry/bitop/ui/select/select";',
      "import { cx } from '@/registry/bitop/lib/bitop-utils.ts';",
      'const lazy = () => import("@/registry/bitop/ui/response/response-lazy");',
      "// import { Nope } from \"@/registry/bitop/ui/nope/nope\";",
      '/* import { Nope2 } from "@/registry/bitop/ui/nope2/nope2"; */',
      'import styles from "./local.module.css";',
    ].join("\n");
    expect(registryImports(src)).toEqual(["registry/bitop/ui/select/select", "registry/bitop/lib/bitop-utils", "registry/bitop/ui/response/response-lazy"]);
  });

  it("matches items by file or folder", () => {
    const item: RegistryItem = {
      name: "demo",
      type: "registry:ui",
      files: [
        { path: "registry/bitop/ui/demo/demo.tsx", type: "registry:ui" },
        { path: "registry/bitop/ui/demo/demo.module.css", type: "registry:file" },
      ],
    };
    expect(isCovered(item, new Set(["registry/bitop/ui/demo/demo"]))).toBe(true);
    expect(isCovered(item, new Set(["registry/bitop/ui/demo/helpers"]))).toBe(true);
    expect(isCovered(item, new Set(["registry/bitop/ui/demo-extra/demo-extra"]))).toBe(false);
    expect(isCovered(item, new Set())).toBe(false);
    const lib: RegistryItem = { name: "fmt", type: "registry:lib", files: [{ path: "registry/bitop/lib/fmt.ts", type: "registry:lib" }] };
    expect(isCovered(lib, new Set(["registry/bitop/lib/fmt"]))).toBe(true);
    expect(isCovered(lib, new Set(["registry/bitop/lib/other"]))).toBe(false);
  });

  it("every registry:ui and registry:lib item is imported by a behaviour test", () => {
    const imported = importedByTests();
    const items = readRegistry().filter((item) => coverableFiles(item).length > 0);
    expect(items.length).toBeGreaterThan(0);
    const uncovered = items.filter((item) => !isCovered(item, imported)).map((item) => item.name);
    expect(uncovered, `Items with no behaviour test outside docs-pages.test.tsx: ${uncovered.join(", ")}`).toEqual([]);
  });
});
