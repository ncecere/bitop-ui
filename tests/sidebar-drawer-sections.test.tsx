/*
 * AppShell on narrow windows (the sidebar as a drawer), collapsible sidebar
 * sections, two-line items and the current item kept in view.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { AppShell, Sidebar, SidebarContent, SidebarItem, SidebarNav, SidebarSection, TopBar } from "@/registry/bitop/ui/app-shell/app-shell";

function stubMatchMedia(matches: (q: string) => boolean) {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({ matches: matches(query), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;
  return () => (window.matchMedia = original);
}

function Shell({ current = "a" }: { current?: string }) {
  return (
    <AppShell
      skipTo={null}
      sidebar={
        <Sidebar label="App sidebar">
          <SidebarContent>
            <SidebarNav aria-label="Main">
              <SidebarSection label="Pages">
                <SidebarItem href="#a" label="Alpha" current={current === "a"} />
                <SidebarItem href="#b" label="Beta" current={current === "b"} />
              </SidebarSection>
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      }
      topbar={<TopBar start={<span>Crumbs</span>} />}
    >
      <main>page</main>
    </AppShell>
  );
}

describe("AppShell on a narrow window", () => {
  it("has no rail: the toggle opens the sidebar as a modal drawer that a link or Escape closes", async () => {
    const restore = stubMatchMedia((q) => q.includes("max-width"));
    try {
      const user = userEvent.setup();
      const { container } = render(<Shell />);
      expect(screen.queryByRole("complementary", { name: "App sidebar" })).toBeNull();
      const toggle = screen.getByRole("button", { name: "Open navigation" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await act(async () => {});
      expect(await axe(container)).toHaveNoViolations();

      await user.click(toggle);
      const drawer = await screen.findByRole("dialog", { name: "Navigation" });
      // Full labels, not the icon rail.
      const aside = within(drawer).getByRole("complementary", { name: "App sidebar" });
      expect(aside).not.toHaveAttribute("data-collapsed");
      expect(within(drawer).getByText("Alpha")).not.toHaveClass("sr-only");
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(toggle).toHaveAccessibleName("Close navigation");
      expect(await axe(document.body)).toHaveNoViolations();

      await user.click(within(drawer).getByRole("link", { name: "Beta" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull());

      await user.click(screen.getByRole("button", { name: "Open navigation" }));
      await screen.findByRole("dialog", { name: "Navigation" });
      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull());
      expect(screen.getByRole("button", { name: "Open navigation" })).toHaveFocus();

      await user.click(screen.getByRole("button", { name: "Open navigation" }));
      const again = await screen.findByRole("dialog", { name: "Navigation" });
      await user.click(within(again).getByRole("button", { name: "Close navigation" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Navigation" })).toBeNull());
    } finally {
      restore();
    }
  });

  it("keeps the rail when drawerQuery is null, and on a wide window", () => {
    const restore = stubMatchMedia(() => true);
    try {
      render(
        <AppShell skipTo={null} drawerQuery={null} sidebar={<Sidebar label="Rail">x</Sidebar>} topbar={<TopBar />}>
          <main />
        </AppShell>,
      );
      expect(screen.getByRole("complementary", { name: "Rail" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Collapse sidebar" })).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});

function Sections({ railed = false }: { railed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <AppShell skipTo={null} collapsed={railed} sidebar={
      <Sidebar label="Sections">
        <SidebarContent>
          <SidebarNav aria-label="Main">
            <SidebarSection label="People" collapsible open={open} onOpenChange={setOpen}>
              <SidebarItem href="#u" label="Users" />
            </SidebarSection>
            <SidebarSection label="Models" collapsible>
              <SidebarItem href="#m" label="Models" />
            </SidebarSection>
          </SidebarNav>
        </SidebarContent>
      </Sidebar>
    }>
      <main />
    </AppShell>
  );
}

describe("SidebarSection collapsible", () => {
  it("shows and hides its items from a disclosure button", async () => {
    const user = userEvent.setup();
    const { container } = render(<Sections />);
    const people = screen.getByRole("button", { name: "People" });
    expect(people).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Users" })).toBeNull();
    // Uncontrolled sections start open.
    expect(screen.getByRole("button", { name: "Models" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Models" })).toBeVisible();
    await user.click(people);
    expect(people).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("list", { name: "People" })).toContainElement(screen.getByRole("link", { name: "Users" }));
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows every item on the icon rail", () => {
    render(<Sections railed />);
    expect(screen.queryByRole("button", { name: "People" })).toBeNull();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
  });
});

describe("SidebarItem description and the current item", () => {
  it("adds a second line that tells items with the same label apart", () => {
    render(
      <ul>
        <SidebarItem href="#1" label="Report" description="Finance" />
        <SidebarItem href="#2" label="Report" description="Sales" />
      </ul>,
    );
    expect(screen.getByRole("link", { name: /^Report\W+Finance$/ })).toHaveAttribute("data-description");
    expect(screen.getByRole("link", { name: /^Report\W+Sales$/ })).toBeInTheDocument();
  });

  it("scrolls the current page's item into view, and the next one when it changes", async () => {
    const scrolled: string[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.textContent ?? "");
    };
    try {
      const { rerender } = render(<Shell current="a" />);
      expect(scrolled).toEqual(["Alpha"]);
      rerender(<Shell current="b" />);
      await waitFor(() => expect(scrolled).toEqual(["Alpha", "Beta"]));
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });
});
