/*
 * WCAG 2.1 AA contrast checks for the theme (neutral × light/dark); a brand theme can reuse them.
 * Parses the theme CSS, resolves var() chains the way the cascade would for
 * <html data-theme=… data-brand=…>, and checks the documented token pairs.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

type Block = { selectors: string[]; decls: Map<string, string> };

function parseBlocks(css: string): Block[] {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: Block[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (const m of noComments.matchAll(re)) {
    const selectors = m[1]!.split(",").map((s) => s.trim());
    const decls = new Map<string, string>();
    for (const d of m[2]!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) decls.set(d[1]!, d[2]!.trim());
    blocks.push({ selectors, decls });
  }
  return blocks;
}

const neutral = parseBlocks(read("registry/bitop/ui/themes/neutral.css"));

/** Declarations that apply to <html> with the given attributes, in cascade order. */
function tokensFor(theme: "light" | "dark", brand: "neutral") {
  const applies = (sel: string) => {
    if (sel === ":root") return true;
    if (sel.includes(" ")) return false; // descendant selectors target subtrees
    const attrs = [...sel.matchAll(/\[data-([\w-]+)="([\w-]+)"\]/g)].map((a) => [a[1], a[2]]);
    return attrs.every(([k, v]) => (k === "theme" ? v === theme : k === "brand" ? v === brand : false));
  };
  const specificity = (sel: string) => (sel === ":root" ? 1 : (sel.match(/\[/g) ?? []).length);
  const rules: { spec: number; order: number; decls: Map<string, string> }[] = [];
  let order = 0;
  for (const block of neutral) {
    const matching = block.selectors.filter(applies);
    order++;
    if (matching.length) rules.push({ spec: Math.max(...matching.map(specificity)), order, decls: block.decls });
  }
  rules.sort((a, b) => a.spec - b.spec || a.order - b.order);
  const vars = new Map<string, string>();
  for (const r of rules) for (const [k, v] of r.decls) vars.set(k, v);
  const resolve = (value: string, depth = 0): string => {
    if (depth > 10) throw new Error(`var() cycle in ${value}`);
    return value.replace(/var\((--[\w-]+)\)/g, (_m, name: string) => {
      const v = vars.get(name);
      if (v === undefined) throw new Error(`undefined token ${name}`);
      return resolve(v, depth + 1);
    });
  };
  return (name: string) => resolve(`var(${name})`);
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const TEXT = 4.5;
const UI = 3;

// [foreground, background, minimum]
const pairs: [string, string, number][] = [
  ["--color-text", "--color-bg", TEXT],
  ["--color-text", "--color-surface", TEXT],
  ["--color-text", "--color-surface-raised", TEXT],
  ["--color-text", "--color-surface-sunken", TEXT],
  ["--color-text-muted", "--color-bg", TEXT],
  ["--color-text-muted", "--color-surface", TEXT],
  ["--color-text-muted", "--color-surface-raised", TEXT],
  ["--color-text-muted", "--color-surface-sunken", TEXT],
  ["--color-text-subtle", "--color-bg", TEXT],
  ["--color-text-subtle", "--color-surface", TEXT],
  ["--color-text-subtle", "--color-surface-raised", TEXT],
  ["--color-text-inverse", "--color-text", TEXT],
  ["--color-primary-contrast", "--color-primary", TEXT],
  ["--color-primary-contrast", "--color-primary-hover", TEXT],
  ["--color-primary-contrast", "--color-primary-active", TEXT],
  ["--color-primary", "--color-bg", UI],
  ["--color-link", "--color-bg", TEXT],
  ["--color-link", "--color-surface", TEXT],
  ["--color-link-hover", "--color-surface", TEXT],
  ["--color-danger-contrast", "--color-danger", TEXT],
  ["--color-danger-contrast", "--color-danger-hover", TEXT],
  ["--color-danger-text", "--color-danger-subtle", TEXT],
  ["--color-success-text", "--color-success-subtle", TEXT],
  ["--color-warning-text", "--color-warning-subtle", TEXT],
  ["--color-info-text", "--color-info-subtle", TEXT],
  ["--color-neutral-text", "--color-neutral-subtle", TEXT],
  ["--color-border-strong", "--color-surface", UI],
  ["--color-border-strong", "--color-bg", UI],
  ["--color-border-strong", "--color-control", UI],
  ["--color-focus-ring", "--color-bg", UI],
  ["--color-focus-ring", "--color-surface", UI],
  ["--color-focus-ring", "--color-surface-raised", UI],
  // AI items: user message bubble, citation / count chips, code line numbers,
  // the prompt counter at its limit, the confirmation request card, source rows on hover.
  ["--color-text", "--color-neutral-subtle", TEXT],
  ["--color-text-muted", "--color-neutral-subtle", TEXT],
  ["--color-primary-subtle-text", "--color-primary-subtle", TEXT],
  ["--color-text-subtle", "--color-surface-sunken", TEXT],
  ["--color-text-muted", "--color-surface-sunken", TEXT],
  ["--color-danger-text", "--color-surface-raised", TEXT],
  ["--color-text", "--color-warning-subtle", TEXT],
  ["--color-text-muted", "--color-control-hover", TEXT],
  ["--color-focus-ring", "--color-surface-sunken", UI],
  // Charts (line, area, bar, sparkline series), meter fills and limit markers.
  ...["primary", "info", "success", "warning", "danger", "neutral"].flatMap((tone): [string, string, number][] => [
    [`--color-chart-${tone}`, "--color-surface", UI],
    [`--color-chart-${tone}`, "--color-bg", UI],
    // The paler variant: the back series of an overlapping bar chart and its legend swatch.
    [`--color-chart-${tone}-soft`, "--color-surface", UI],
    [`--color-chart-${tone}-soft`, "--color-bg", UI],
  ]),
  ["--color-warning", "--color-surface", UI],
  // Diff viewer: code and line numbers on the added / removed tints, fold links.
  ["--color-text", "--color-success-subtle", TEXT],
  ["--color-text", "--color-danger-subtle", TEXT],
  ["--color-text-muted", "--color-success-subtle", TEXT],
  ["--color-text-muted", "--color-danger-subtle", TEXT],
  ["--color-link", "--color-surface-sunken", TEXT],
  ["--color-danger", "--color-surface", UI],
];

const isHex = (v: string) => /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v);

/** An rgba() tint composited over a hex colour, as a hex colour (a hex value is returned as is). */
function over(tint: string, base: string) {
  if (isHex(tint)) return tint;
  const m = tint.match(/rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`can't composite ${tint}`);
  const a = Number(m[4]);
  const b = base.replace("#", "");
  return (
    "#" +
    [1, 2, 3]
      .map((i, k) => Math.round(Number(m[i]) * a + parseInt(b.slice(k * 2, k * 2 + 2), 16) * (1 - a)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

/*
 * Text and icons on rows that are hovered, highlighted or selected: [foreground, tint, the surface under it, minimum].
 * Menus, selects, comboboxes and the command palette highlight items with surface-active on surface-raised; lists
 * and tables with surface-hover; selected nav items and options with primary-subtle.
 */
const tinted: [string, string, string, number][] = [
  ["--color-text-muted", "--color-surface-active", "--color-surface-raised", TEXT],
  ["--color-text-subtle", "--color-surface-active", "--color-surface-raised", TEXT],
  ["--color-text-subtle", "--color-surface-hover", "--color-surface", TEXT],
  ["--color-text-muted", "--color-surface-hover", "--color-surface", TEXT],
  ["--color-link", "--color-surface-hover", "--color-surface", TEXT],
  ["--color-primary-subtle-text", "--color-primary-subtle", "--color-surface", TEXT],
  ["--color-primary-subtle-text", "--color-primary-subtle", "--color-surface-raised", TEXT],
  // Selected-option checks and current-page icons.
  ["--color-primary-subtle-text", "--color-surface-active", "--color-surface-raised", UI],
];

describe.each([
  ["neutral", "light"],
  ["neutral", "dark"],
] as const)("%s theme, %s", (brand, theme) => {
  const token = tokensFor(theme, brand);
  it.each(pairs)("%s on %s ≥ %d:1", (fg, bg, min) => {
    const a = token(fg);
    const b = token(bg);
    // Translucent tints (e.g. dark primary-subtle) are composited and noted in the CSS.
    if (!isHex(a) || !isHex(b)) return;
    expect(ratio(a, b)).toBeGreaterThanOrEqual(min);
  });
  it.each(tinted)("%s on %s over %s ≥ %d:1", (fg, tint, base, min) => {
    expect(ratio(token(fg), over(token(tint), token(base)))).toBeGreaterThanOrEqual(min);
  });
});

test("the neutral theme's brand tokens", () => {
  expect(tokensFor("light", "neutral")("--color-primary")).toBe("#4b4fd6");
});
