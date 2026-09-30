/*
 * Follow-ups from a consumer's release: a tooltip on plain text, labelled
 * ticks on a line chart's scale, a Columns menu only where it helps, a
 * visible search label, no chip for a single-choice toggle filter, menus
 * inside the page's landmarks (axe `region`), and a citation card's "go to
 * source" action.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import { DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
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
