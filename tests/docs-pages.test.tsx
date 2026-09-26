/*
 * Renders every docs page inside the real docs shell and runs axe on it.
 * (Colour contrast can't be computed in jsdom; tests/contrast.test.ts and the
 * browser a11y run cover that.)
 */
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { App } from "@/docs/src/App";
import { componentDocs } from "@/docs/src/content";
import registry from "@/registry.json";

const pages = ["/", "/installation", "/theming", "/components", ...componentDocs.map((d) => `/components/${d.slug}`)];

test("every registry component has a docs page", () => {
  const documented = new Set(componentDocs.map((d) => d.slug));
  const components = registry.items.filter((i) => i.type === "registry:ui").map((i) => i.name);
  expect(components.filter((name) => !documented.has(name))).toEqual([]);
  expect([...documented].filter((slug) => !components.includes(slug))).toEqual([]);
});

test("every docs example shows its source", () => {
  for (const doc of componentDocs) {
    expect(doc.examples.length).toBeGreaterThan(0);
    for (const ex of doc.examples) expect(ex.code).toMatch(/^function \w+\(/);
  }
});

describe.each(pages)("docs page %s", (path) => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(<App initialPath={path} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  }, 30_000);
});
