/*
 * Renders every docs page inside the real docs shell and runs axe on it.
 * (Colour contrast can't be computed in jsdom; tests/contrast.test.ts and the
 * browser a11y run cover that.)
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { App } from "@/docs/src/App";
import { componentDocs } from "@/docs/src/content";
import registry from "@/registry.json";

const pages = ["/", "/installation", "/theming", "/components", "/examples/chat", ...componentDocs.map((d) => `/components/${d.slug}`)];

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

describe("client-side navigation focus", () => {
  it("does not move focus on first load", () => {
    render(<App initialPath="/components/button" />);
    expect(document.body).toHaveFocus();
  });

  it("moves focus to the new page's heading after following a sidebar link", async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    const nav = screen.getByRole("navigation", { name: "Documentation" });
    await user.click(within(nav).getByRole("link", { name: "Dialog" }));
    const heading = await screen.findByRole("heading", { level: 1, name: "Dialog" });
    await waitFor(() => expect(heading).toHaveFocus());
  });

  it("moves focus to the new page's heading after a command-palette jump", async () => {
    const user = userEvent.setup();
    render(<App initialPath="/" />);
    await user.click(screen.getByRole("button", { name: /Search docs/ }));
    const input = await screen.findByRole("combobox", { name: "Command palette" });
    await user.type(input, "Switch");
    await user.keyboard("{Enter}");
    const heading = await screen.findByRole("heading", { level: 1, name: "Switch" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(heading).toHaveFocus());
  });
});

describe.each(pages)("docs page %s", (path) => {
  it("renders one h1 and has no axe violations", async () => {
    const { container } = render(<App initialPath={path} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();
    // Router links rendered through components (useRender) must keep their href.
    for (const a of container.querySelectorAll("nav a")) expect(a).toHaveAttribute("href");
    // iframes: false: axe can't message jsdom frames (their parent isn't the
    // test's global window), and a frame's content isn't ours to audit anyway.
    expect(await axe(container, { iframes: false })).toHaveNoViolations();
  }, 30_000);
});
