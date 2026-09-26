/*
 * scripts/check-styling.mjs: the real registry passes, and a fixture with one
 * violation of each rule fails with an actionable message per violation.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const script = path.join(root, "scripts/check-styling.mjs");
const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });

function fixture(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bitop-styling-"));
  for (const [p, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true });
    fs.writeFileSync(path.join(dir, p), content);
  }
  return dir;
}

const item = (name: string, files: string[], extra: object = {}) => ({
  name,
  type: "registry:ui",
  title: name,
  description: name,
  files: files.map((f) => ({ path: `registry/bitop/ui/${name}/${f}`, type: f.endsWith(".tsx") ? "registry:ui" : "registry:file", target: `@ui/${name}/${f}` })),
  ...extra,
});

test("the bitop-ui registry passes the styling policy", () => {
  const result = run();
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
  expect(result.stdout).toMatch(/Styling policy OK/);
});

describe("a fixture with violations", () => {
  const dir = fixture({
    "package.json": JSON.stringify({ dependencies: { "@base-ui/react": "1.8.0", clsx: "2.0.0" }, devDependencies: { tailwindcss: "4.0.0" } }),
    "registry.json": JSON.stringify({
      items: [
        item("good", ["good.tsx", "good.module.css"]),
        item("sneaky", ["sneaky.tsx"]),
        item("popup", ["popup.tsx"], { dependencies: ["@radix-ui/react-popover@^1.0.0"] }),
        item("badge", ["badge.tsx", "badge.css"]),
      ],
    }),
    "registry/bitop/ui/styles/tokens.css": ":root { --color-text: #111111; }",
    "registry/bitop/ui/good/good.tsx": [
      'import { Collapsible } from "@base-ui/react/collapsible";',
      'import styles from "./good.module.css";',
      "/* #ffffff in a comment is fine */",
      "export const Good = () => <Collapsible.Root className={styles.root} />;",
    ].join("\n"),
    "registry/bitop/ui/good/good.module.css": [
      ".root { color: var(--color-text); border-color: color-mix(in srgb, currentColor 30%, transparent); }",
      ".bad { background: rgba(0, 0, 0, 0.5); }",
    ].join("\n"),
    "registry/bitop/ui/sneaky/sneaky.tsx": [
      "export const Sneaky = () => (",
      '  <div tabIndex={0} onKeyDown={() => {}} style={{ width: 12, color: "#ff0000" }} />',
      ");",
    ].join("\n"),
    "registry/bitop/ui/popup/popup.tsx": [
      'import { Button } from "@/registry/bitop/ui/good/good";',
      'import * as Popover from "@radix-ui/react-popover";',
      'export const P = () => <div role="dialog" aria-expanded="true"><Button /></div>;',
    ].join("\n"),
    "registry/bitop/ui/badge/badge.tsx": 'import "./badge.css";\nexport const Badge = () => <span onKeyDown={() => {}} />;',
    "registry/bitop/ui/badge/badge.css": ".badge { padding: 4px; }",
  });
  const result = run("--root", dir);
  const out = result.stderr;

  it("exits non-zero", () => {
    expect(result.status).toBe(1);
    expect(out).toMatch(/Styling policy failed/);
  });

  it.each([
    [/package\.json dependencies: "clsx" is not allowed \(class-name utilities/, "banned runtime dependency"],
    [/package\.json devDependencies: "tailwindcss" is not allowed \(Tailwind\)/, "banned dev dependency"],
    [/registry\.json popup: dependency "@radix-ui\/react-popover" is not allowed \(Radix/, "banned item dependency"],
    [/popup\/popup\.tsx:2: imports "@radix-ui\/react-popover"/, "banned import"],
    [/badge\/badge\.css: global stylesheet inside a component folder\n\s+fix: rename it to badge\.module\.css/, "global CSS in a component"],
    [/badge\/badge\.tsx:1: imports global CSS "\.\/badge\.css"/, "global CSS import"],
    [/good\/good\.module\.css:2: literal colour "rgba\(…\)"/, "literal colour in a module"],
    [/sneaky\/sneaky\.tsx:2: literal colour "#ff0000"/, "literal colour in TSX"],
    [/sneaky\/sneaky\.tsx:2: inline style with a numeric length/, "numeric inline length"],
    [/registry item sneaky: is not built on Base UI/, "interactive item without Base UI"],
    [/registry item popup: has popup\/disclosure semantics at .*popup\.tsx:3 .* but doesn't import @base-ui\/react/, "hand-rolled popup"],
    [/registry item badge: is on the DISPLAY_ONLY allowlist but has interactive code .*onKeyDown/, "allowlisted item with behaviour"],
  ])("reports %s (%s)", (pattern) => {
    expect(out).toMatch(pattern);
  });

  it("accepts tokens, color-mix with tokens and colours in comments", () => {
    expect(out).not.toMatch(/good\.tsx/);
    expect(out).not.toMatch(/good\.module\.css:1/);
    expect(out).not.toMatch(/registry item good/);
  });
});
