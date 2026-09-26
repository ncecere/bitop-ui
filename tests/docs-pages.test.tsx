/*
 * Renders every docs page inside the real docs shell and runs axe on it.
 * (Colour contrast can't be computed in jsdom; tests/contrast.test.ts and the
 * browser a11y run cover that.)
 *
 * Component pages are code-split: the page list comes from build-time
 * metadata (virtual:bitop-docs-meta, see vite.config.ts) and each page module
 * loads on demand, so these tests await the loaders / the rendered page.
 */
import fs from "node:fs";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { App } from "@/docs/src/App";
import { categories, componentDocs, findDoc } from "@/docs/src/content";
import type { ComponentDoc } from "@/docs/src/content/types";
import registry from "@/registry.json";
import { collectDocMeta, extractDocMeta, readCategories } from "@/docs/docs-meta-plugin";

const pages = ["/", "/installation", "/theming", "/components", "/examples/chat", ...componentDocs.map((d) => `/components/${d.slug}`)];

test("every registry component has a docs page", () => {
  const documented = new Set(componentDocs.map((d) => d.slug));
  const components = registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name);
  expect(components.filter((name) => !documented.has(name))).toEqual([]);
  expect([...documented].filter((slug) => !components.includes(slug))).toEqual([]);
});

describe("docs metadata (read from the content files at build time)", () => {
  let loaded: ComponentDoc[] = [];
  beforeAll(async () => {
    loaded = await Promise.all(componentDocs.map((d) => d.load()));
  }, 60_000);

  it("lists every content file", () => {
    const files = fs.readdirSync("docs/src/content/components").filter((f) => f.endsWith(".tsx"));
    expect(componentDocs).toHaveLength(files.length);
    expect(collectDocMeta("docs/src/content").map((m) => m.file)).toEqual(files.sort().map((f) => `./components/${f}`));
  });

  it("matches what each page module exports", () => {
    componentDocs.forEach((meta, i) => {
      const doc = loaded[i]!;
      expect({ slug: doc.slug, title: doc.title, category: doc.category }).toEqual({ slug: meta.slug, title: meta.title, category: meta.category });
      if (typeof doc.description === "string") expect(meta.description).toBe(doc.description);
    });
  });

  it("puts every page in a sidebar category", () => {
    const types = fs.readFileSync("docs/src/content/types.ts", "utf8");
    expect([...categories].sort()).toEqual(readCategories(types).sort());
  });

  it("every docs example shows its source", () => {
    for (const doc of loaded) {
      expect(doc.examples.length).toBeGreaterThan(0);
      for (const ex of doc.examples) expect(ex.code).toMatch(/^function \w+\(/);
    }
  });
});

describe("docs metadata extraction", () => {
  const cats = ["Actions", "Forms"];
  const file = (doc: string) => `import raw from "./x.tsx?raw";\nconst doc: ComponentDoc = ${doc};\nexport default doc;\n`;

  it("reads a const-bound or inline default export", () => {
    const body = `{ slug: "x", title: "X", category: "Forms", description: \`An x.\`, examples: examples(raw, []) }`;
    expect(extractDocMeta("x.tsx", file(body), cats)).toEqual({ slug: "x", title: "X", category: "Forms", description: "An x." });
    expect(extractDocMeta("x.tsx", `export default ${body} satisfies ComponentDoc;`, cats).slug).toBe("x");
  });

  it("fails loudly when metadata isn't static", () => {
    expect(() => extractDocMeta("x.tsx", file(`{ slug: "x", title: "X", category: "Forms", description: <p>Hi</p> }`), cats)).toThrow(/x\.tsx: `description` must be a plain string literal/);
    expect(() => extractDocMeta("x.tsx", file(`{ slug: "x", title: "X", description: "d" }`), cats)).toThrow(/missing `category`/);
    expect(() => extractDocMeta("x.tsx", file(`{ slug: "x", title: "X", category: "Nope", description: "d" }`), cats)).toThrow(/category "Nope"/);
    expect(() => extractDocMeta("x.tsx", `const doc = makeDoc();\nexport default doc;`, cats)).toThrow(/object literal/);
    expect(() => extractDocMeta("x.tsx", `export const doc = {};`, cats)).toThrow(/no `export default`/);
  });
});

describe("client-side navigation focus", () => {
  it("does not move focus on first load", async () => {
    render(<App initialPath="/components/button" />);
    await screen.findByRole("heading", { level: 1, name: "Button" }, { timeout: 15_000 });
    expect(document.body).toHaveFocus();
  });

  it("moves focus to the new page's heading after following a sidebar link", async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    const nav = screen.getByRole("navigation", { name: "Documentation" });
    await user.click(within(nav).getByRole("link", { name: "Dialog" }));
    const heading = await screen.findByRole("heading", { level: 1, name: "Dialog" }, { timeout: 15_000 });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("moves focus to the new page's heading after a command-palette jump", async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    await user.click(screen.getByRole("button", { name: /Search docs/ }));
    const input = await screen.findByRole("combobox", { name: "Command palette" }, { timeout: 15_000 });
    await user.type(input, "Switch");
    await user.keyboard("{Enter}");
    const heading = await screen.findByRole("heading", { level: 1, name: "Switch" }, { timeout: 15_000 });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(heading).toHaveFocus());
  });
});

describe.each(["/components/not-a-component", "/no-such-page"])("unknown route %s", (path) => {
  it("renders the 404 page", () => {
    render(<App initialPath={path} />);
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeInTheDocument();
  });
});

describe.each(pages)("docs page %s", (path) => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(<App initialPath={path} />);
    // Code-split pages render after their chunk loads (the fallback has no h1).
    const h1s = await screen.findAllByRole("heading", { level: 1 }, { timeout: 15_000 });
    expect(h1s).toHaveLength(1);
    const doc = findDoc(path.replace(/^\/components\//, ""));
    if (doc) expect(h1s[0]).toHaveTextContent(doc.title);
    expect(screen.queryByText("Loading page…")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    // Router links rendered through components (useRender) must keep their href.
    for (const a of container.querySelectorAll("nav a")) expect(a).toHaveAttribute("href");
    // iframes: false: axe can't message jsdom frames (their parent isn't the
    // test's global window), and a frame's content isn't ours to audit anyway.
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  }, 30_000);
});
