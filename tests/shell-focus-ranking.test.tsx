/*
 * Keyboard and screen-reader details of the app shell and the command
 * palette: the drawer hands focus to the new page's content after a link, a
 * two-line item is named as one text, and the palette puts an exact name
 * first so Enter runs it.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AppShell, Main, Sidebar, SidebarContent, SidebarItem, SidebarNav, SidebarSection, TopBar } from "@/registry/bitop/ui/app-shell/app-shell";
import { CommandPalette, type CommandGroup, commandMatches, commandRank, rankCommandGroups } from "@/registry/bitop/ui/command-palette/command-palette";

function stubNarrow() {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({ matches: query.includes("max-width"), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;
  return () => (window.matchMedia = original);
}

describe("AppShell drawer focus", () => {
  it("moves focus to the main content after following a link, and back to the toggle after Escape", async () => {
    const restore = stubNarrow();
    try {
      const user = userEvent.setup();
      render(
        <AppShell
          sidebar={
            <Sidebar label="App sidebar">
              <SidebarContent>
                <SidebarNav aria-label="Main">
                  <SidebarSection label="Pages">
                    <SidebarItem render={<a href="#m" onClick={(e) => e.preventDefault()} />} label="Maintenance" />
                  </SidebarSection>
                </SidebarNav>
              </SidebarContent>
            </Sidebar>
          }
          topbar={<TopBar />}
        >
          <Main>
            <h1>Page</h1>
          </Main>
        </AppShell>,
      );
      await user.click(screen.getByRole("button", { name: "Open navigation" }));
      const drawer = await screen.findByRole("dialog", { name: "Navigation" });
      await user.click(within(drawer).getByRole("link", { name: "Maintenance" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull());
      await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());

      await user.click(screen.getByRole("button", { name: "Open navigation" }));
      await screen.findByRole("dialog", { name: "Navigation" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus());
    } finally {
      restore();
    }
  });
});

describe("SidebarItem with a description", () => {
  it("is named by one text, so browsers don't read a space before the comma", () => {
    render(
      <ul>
        <SidebarItem href="#1" label="How do I order a transcript?" description="Records helper" />
      </ul>,
    );
    const link = screen.getByRole("link", { name: "How do I order a transcript?, Records helper" });
    const spoken = [...link.querySelectorAll("span")].filter((el) => !el.closest("[aria-hidden]") && el.children.length === 0);
    expect(spoken.map((el) => el.textContent)).toEqual(["How do I order a transcript?, Records helper"]);
    // Both lines still show.
    expect(link).toHaveTextContent("How do I order a transcript?Records helper");
  });
});

const noop = () => {};
const adminGroups: CommandGroup[] = [
  {
    label: "Admin",
    items: [
      { id: "profiles", label: "Embedding profiles", keywords: ["embedding", "migrations"], onSelect: noop },
      { id: "costs", label: "Costs", keywords: ["spend", "budget"], onSelect: noop },
      { id: "retention", label: "Retention", keywords: ["legal holds", "hold"], onSelect: noop },
      { id: "migrations", label: "Profile migrations", keywords: ["migrate"], onSelect: noop },
      { id: "holds", label: "Legal holds", keywords: ["litigation"], onSelect: noop },
      { id: "budgets", label: "Budgets", keywords: ["extension"], onSelect: noop },
    ],
  },
];

describe("command ranking", () => {
  it.each([
    ["Legal holds", "holds"],
    ["legal", "holds"],
    ["holds", "holds"],
    ["profile migrations", "migrations"],
    ["migrations", "migrations"],
    ["budget", "budgets"],
    ["spend", "costs"],
  ])("%s → %s first", (query, first) => {
    expect(rankCommandGroups(adminGroups, query)[0]!.items.find((i) => commandMatches(i, query))!.id).toBe(first);
  });

  it("orders exact names, then prefixes, label words and keywords", () => {
    expect(commandRank({ label: "Usage & spend" }, "usage & spend")).toBe(0);
    expect(commandRank({ label: "Budgets" }, "budget")).toBe(1);
    expect(commandRank({ label: "Usage & spend" }, "spend")).toBe(2);
    expect(commandRank({ label: "Costs", keywords: ["spend"] }, "spend")).toBe(3);
    expect(commandRank({ label: "Retention", keywords: ["legal holds"] }, "legal")).toBe(4);
  });

  it("puts the group with the best match first, and leaves the order alone with no query", () => {
    const groups: CommandGroup[] = [
      { label: "Admin", items: [{ id: "costs", label: "Costs", keywords: ["spend"], onSelect: noop }] },
      { label: "Team", items: [{ id: "usage", label: "Usage & spend", onSelect: noop }] },
    ];
    expect(rankCommandGroups(groups, "spend").map((g) => g.label)).toEqual(["Team", "Admin"]);
    expect(rankCommandGroups(groups, "")).toBe(groups);
  });

  it("highlights the exact name, so Enter runs it", async () => {
    const user = userEvent.setup();
    const ran: string[] = [];
    function Palette() {
      const [open, setOpen] = useState(true);
      const groups = adminGroups.map((g) => ({ ...g, items: g.items.map((i) => ({ ...i, onSelect: () => ran.push(i.id) })) }));
      return <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />;
    }
    render(<Palette />);
    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    const input = within(dialog).getByRole("combobox", { name: "Command palette" });
    await user.click(input);
    await user.keyboard("legal holds");
    const options = within(dialog).getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Legal holds", "Retention"]);
    await user.keyboard("{Enter}");
    expect(ran).toEqual(["holds"]);
  });
});

