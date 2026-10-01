/*
 * Follow-ups from a consumer's release: a tooltip on plain text, labelled
 * ticks on a line chart's scale, a Columns menu only where it helps, a
 * visible search label, no chip for a single-choice toggle filter, menus
 * inside the page's landmarks (axe `region`), a citation card's "go to
 * source" action, a selectable source card and a full-screen sheet.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import { Button } from "@/registry/bitop/ui/button/button";
import { DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { Dialog } from "@/registry/bitop/ui/dialog/dialog";
import { InlineCitation } from "@/registry/bitop/ui/inline-citation/inline-citation";
import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
import { Menu, MenuItem, MenuSubmenu } from "@/registry/bitop/ui/menu/menu";
import { Popover } from "@/registry/bitop/ui/popover/popover";
import { Sheet } from "@/registry/bitop/ui/sheet/sheet";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/registry/bitop/ui/sources/sources";
import { NARROW_QUERY } from "@/registry/bitop/lib/bitop-utils";
import { TooltipText } from "@/registry/bitop/ui/tooltip/tooltip";

describe("TooltipText", () => {
  it("is focusable text described by the tooltip, which opens on focus and hover and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <p>
          Score:{" "}
          <TooltipText content="Recall@5: the share of questions whose document was in the top 5." delay={0} className="scoped">
            82%
          </TooltipText>
        </p>
      </main>,
    );
    const text = screen.getByText("82%");
    expect(text.tagName).toBe("SPAN");
    expect(text).toHaveClass("scoped");
    expect(screen.queryByRole("button")).toBeNull();
    // Screen readers get the tooltip's text as the description, open or not.
    expect(text).toHaveAccessibleDescription("Recall@5: the share of questions whose document was in the top 5.");

    // The popup (visual only, no role) and the hidden description hold the same text.
    const shown = () => screen.getAllByText(/^Recall@5/).length === 2;
    expect(shown()).toBe(false);
    await user.tab();
    expect(text).toHaveFocus();
    await waitFor(() => expect(shown()).toBe(true));
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(shown()).toBe(false));
    expect(text).toHaveFocus();

    act(() => text.blur());
    await user.hover(text);
    await waitFor(() => expect(shown()).toBe(true));
  });
});

describe("LineChart ticks", () => {
  const runs = [
    { label: "Run 1", values: { score: 62 } },
    { label: "Run 2", values: { score: 81 } },
  ];
  const series = [{ key: "score" as const, label: "Recall@5" }];
  const pct = (v: number) => `${v}%`;

  it("labels the ticks on the scale, each at its height; the top keeps its own label", async () => {
    const { container } = render(
      <LineChart data={runs} series={series} summary="Recall@5 over 2 runs, from 62% to 81%." domain={{ min: 0, max: 100 }} ticks={[0, 50, 100, 150]} formatValue={pct} />,
    );
    const img = screen.getByRole("img", { name: "Recall@5 over 2 runs, from 62% to 81%." });
    // 100% once (the peak line), 50% half way, 0% at the bottom; 150 is off the scale.
    expect(within(img).getAllByText("100%")).toHaveLength(1);
    const half = within(img).getByText("50%");
    expect(half.style.getPropertyValue("--y")).toBe("50.00%");
    expect(half).not.toHaveAttribute("data-floor");
    const zero = within(img).getByText("0%");
    expect(zero.style.getPropertyValue("--y")).toBe("100.00%");
    expect(zero).toHaveAttribute("data-floor");
    expect(within(img).queryByText("150%")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a tick at a non-zero minimum replaces the minimum's own label; without axis nothing is labelled", () => {
    const { rerender } = render(<LineChart data={runs} series={series} summary="s" domain={{ min: 40, max: 100 }} ticks={[40, 70]} formatValue={pct} />);
    expect(within(screen.getByRole("img")).getAllByText("40%")).toHaveLength(1);
    expect(within(screen.getByRole("img")).getByText("70%").style.getPropertyValue("--y")).toBe("50.00%");
    rerender(<LineChart data={runs} series={series} summary="s" domain={{ min: 40, max: 100 }} ticks={[40, 70]} formatValue={pct} axis={false} />);
    expect(within(screen.getByRole("img")).queryByText("70%")).toBeNull();
  });
});

describe("DataTable on small tables", () => {
  type Run = { id: string; name: string; score: number; when: string };
  const rows: Run[] = [
    { id: "1", name: "Retrieval", score: 82, when: "Sep 28" },
    { id: "2", name: "Full answer", score: 64, when: "Sep 29" },
  ];
  const columns: DataTableColumn<Run>[] = [
    { id: "name", header: "Run", accessor: "name", rowHeader: true },
    { id: "score", header: "Score", accessor: "score", numeric: true },
    { id: "when", header: "Started", accessor: "when" },
  ];
  const columnsButton = () => screen.queryByRole("button", { name: "Columns" });

  afterEach(() => vi.restoreAllMocks());

  it("columnsMenuMin leaves the Columns menu out until enough columns can be hidden", () => {
    const { rerender } = render(<DataTable caption="Runs" columns={columns} data={rows} getRowId={(r) => r.id} columnsMenu columnsMenuMin={3} />);
    // Score and Started can be hidden (the row header can't): 2 < 3.
    expect(columnsButton()).toBeNull();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    rerender(<DataTable caption="Runs" columns={columns} data={rows} getRowId={(r) => r.id} columnsMenu columnsMenuMin={2} />);
    expect(columnsButton()).toBeInTheDocument();
    // Without columnsMenuMin the menu is always there.
    rerender(<DataTable caption="Runs" columns={columns} data={rows} getRowId={(r) => r.id} columnsMenu />);
    expect(columnsButton()).toBeInTheDocument();
  });

  it("shows the menu anyway once a column is hidden, so it can be shown again", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) => ({ matches: query === NARROW_QUERY, media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    const narrow = columns.map((c) => (c.id === "when" ? { ...c, defaultHiddenNarrow: true } : c));
    render(<DataTable caption="Runs" columns={narrow} data={rows} getRowId={(r) => r.id} columnsMenu columnsMenuMin={5} />);
    expect(screen.queryByRole("columnheader", { name: "Started" })).toBeNull();
    await user.click(columnsButton()!);
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Started" }));
    expect(screen.getByRole("columnheader", { name: "Started" })).toBeInTheDocument();
    // The menu stays (it isn't pulled from under the pointer), so the column can be hidden again.
    expect(columnsButton()).toBeInTheDocument();
    expect(screen.getByRole("menuitemcheckbox", { name: "Started" })).toHaveAttribute("aria-checked", "true");
  });

  it("showFilterLabel shows the search box's label; by default it is for assistive technology only", async () => {
    const { container, rerender } = render(<DataTable caption="Runs" columns={columns} data={rows} filterable filterLabel="Search runs" />);
    const label = () => screen.getByText("Search runs").closest("div")!;
    expect(screen.getByRole("searchbox", { name: "Search runs" })).toBeInTheDocument();
    expect(label()).toHaveClass("sr-only");
    rerender(<DataTable caption="Runs" columns={columns} data={rows} filterable filterLabel="Search runs" showFilterLabel />);
    expect(label()).not.toHaveClass("sr-only");
    expect(screen.getByRole("searchbox", { name: "Search runs" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Popups inside the page's landmarks (axe region)", () => {
  // axe's region rule is a page-level rule: run it on the whole body.
  const regionViolations = async () => (await axe(document.body, { runOnly: { type: "rule", values: ["region"] } })).violations;

  // axe moves focus to the body, so each test checks once, with its popups open.
  it("a menu opens inside its trigger's landmark, and so does a submenu", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <Menu trigger={<Button>Actions</Button>}>
          <MenuItem>Rename</MenuItem>
          <MenuSubmenu label="Move to">
            <MenuItem>Archive</MenuItem>
          </MenuSubmenu>
        </Menu>
      </main>,
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    const menu = await screen.findByRole("menu");
    expect(menu.closest("main")).not.toBeNull();
    await waitFor(() => expect(menu).toHaveFocus());
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Move to" })).toHaveFocus());
    await user.keyboard("{ArrowRight}");
    const archive = await screen.findByRole("menuitem", { name: "Archive" });
    expect(archive.closest("main")).not.toBeNull();
    expect(await regionViolations()).toEqual([]);
  });

  it("a menu in the sidebar's nav opens inside the nav", async () => {
    const user = userEvent.setup();
    render(
      <>
        <nav aria-label="Sections">
          <Menu trigger={<Button>Team</Button>}>
            <MenuItem>Switch team</MenuItem>
          </Menu>
        </nav>
        <main>Content</main>
      </>,
    );
    await user.click(screen.getByRole("button", { name: "Team" }));
    expect((await screen.findByRole("menuitem", { name: "Switch team" })).closest("nav")).not.toBeNull();
    expect(await regionViolations()).toEqual([]);
  });

  it("a menu in a dialog still opens outside the page's landmarks; container overrides the choice", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <main>
        <Dialog open title="Share" onOpenChange={() => {}}>
          <Menu trigger={<Button>Role</Button>}>
            <MenuItem>Editor</MenuItem>
          </Menu>
        </Dialog>
      </main>,
    );
    await user.click(await screen.findByRole("button", { name: "Role" }));
    const item = await screen.findByRole("menuitem", { name: "Editor" });
    expect(item.closest("main")).toBeNull();
    await user.keyboard("{Escape}");
    unmount();

    function Custom() {
      const [aside, setAside] = useState<HTMLElement | null>(null);
      return (
        <>
          <aside ref={setAside} aria-label="Help" />
          <main>
            <Menu trigger={<Button>More</Button>} container={aside}>
              <MenuItem>Shortcuts</MenuItem>
            </Menu>
          </main>
        </>
      );
    }
    render(<Custom />);
    await user.click(screen.getByRole("button", { name: "More" }));
    expect((await screen.findByRole("menuitem", { name: "Shortcuts" })).closest("aside")).not.toBeNull();
  });

  it.each(["click", "hover"])("a popover is a dialog, which axe counts as a region (opened by %s)", async (how) => {
    const user = userEvent.setup();
    render(
      <main>
        <Popover trigger={<Button>Details</Button>} title="Retention" openOnHover>
          Kept for 90 days.
        </Popover>
      </main>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    await (how === "click" ? user.click(trigger) : user.hover(trigger));
    expect(await screen.findByRole("dialog", { name: "Retention" })).toBeInTheDocument();
    expect(await regionViolations()).toEqual([]);
  });
});

describe("InlineCitation sourceAction", () => {
  const sources = [
    { title: "Leave policy", href: "https://hr.example.com/leave", quote: "Staff accrue 2 days a month." },
    { title: "Benefits FAQ", description: "Answers about benefits." },
  ];

  it("ends the card with a button that closes it and goes to the current source, which gets the focus", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <main>
        <p>
          Claim{" "}
          <InlineCitation
            index={[1, 2]}
            sources={sources}
            sourceAction={{
              label: (i) => `Show source ${i + 1} below`,
              onSelect: (i, source) => {
                onSelect(i, source.title);
                document.getElementById(`source-${i}`)!.focus();
              },
            }}
          />
        </p>
        <ol>
          <li id="source-0" tabIndex={-1}>Leave policy</li>
          <li id="source-1" tabIndex={-1}>Benefits FAQ</li>
        </ol>
      </main>,
    );
    const chip = screen.getByRole("button", { name: /^Sources 1, 2/ });
    await user.click(chip);
    let card = await screen.findByRole("dialog", { name: /Leave policy/ });
    // After the passage.
    const first = within(card).getByRole("button", { name: "Show source 1 below" });
    expect(within(card).getByText("Staff accrue 2 days a month.").compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(await axe(card)).toHaveNoViolations();
    await user.click(within(card).getByRole("button", { name: "Next source" }));
    await user.click(within(card).getByRole("button", { name: "Show source 2 below" }));
    expect(onSelect).toHaveBeenCalledWith(1, "Benefits FAQ");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.getElementById("source-1")).toHaveFocus();

    // Escape still returns focus to the chip.
    await user.click(chip);
    card = await screen.findByRole("dialog", { name: /Leave policy/ });
    await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(chip).toHaveFocus();
  });
});

describe("Source onSelect", () => {
  it("makes the card a button, named and described, with its link beside it", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <main>
        <Sources defaultOpen>
          <SourcesTrigger count={2} />
          <SourcesContent>
            <Source
              index={1}
              title="Leave policy"
              href="https://hr.example.com/leave"
              meta="Policies › Leave"
              description="Staff accrue 2 days a month."
              onSelect={onSelect}
              selectLabel="Show source 1: Leave policy"
              linkLabel="Open the page"
            />
            <Source index={2} title="Benefits FAQ" description="Answers about benefits." onSelect={() => {}} />
          </SourcesContent>
        </Sources>
      </main>,
    );
    const card = screen.getByRole("button", { name: "Show source 1: Leave policy" });
    expect(card).toHaveAccessibleDescription("Policies › Leave Staff accrue 2 days a month.");
    const link = screen.getByRole("link", { name: "Open the page (opens in a new tab)" });
    expect(link).toHaveAttribute("href", "https://hr.example.com/leave");
    expect(card.contains(link)).toBe(false);
    // Without selectLabel the content names it.
    expect(screen.getByRole("button", { name: /Source 2: Benefits FAQ/ })).toBeInTheDocument();
    await user.click(card);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(await axe(document.body)).toHaveNoViolations();
  });
});

describe("Sheet size full", () => {
  it("covers the screen from its side, with the close button", async () => {
    render(
      <Sheet open title="Source" description="The cited passage." size="full" side="bottom">
        <p>Passage</p>
      </Sheet>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Source" });
    expect(dialog).toHaveAttribute("data-size", "full");
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
