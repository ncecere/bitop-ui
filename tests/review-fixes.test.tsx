/*
 * Regression tests for review findings on filter-bar, data-table,
 * date-picker, the charts and meter. Each test failed before its fix.
 */
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { BarChart } from "@/registry/bitop/ui/bar-chart/bar-chart";
import { ChartData } from "@/registry/bitop/ui/chart/chart";
import { DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { DateRangePresets, type DateRangeSelection } from "@/registry/bitop/ui/date-picker/date-picker";
import { type Facet, FilterBar, type FilterValues, filterRows } from "@/registry/bitop/ui/filter-bar/filter-bar";
import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
import { Meter, meterLevel } from "@/registry/bitop/ui/meter/meter";
import { Sparkline } from "@/registry/bitop/ui/sparkline/sparkline";

const TODAY = new Date(2026, 8, 26);

type Doc = { id: string; title: string; status: "ready" | "failed"; updated: Date };
const docs: Doc[] = [
  { id: "1", title: "Deadlines", status: "ready", updated: new Date(2026, 8, 25, 12) },
  { id: "2", title: "Transcripts", status: "failed", updated: new Date(2026, 8, 24, 12) },
  { id: "3", title: "FERPA", status: "ready", updated: new Date(2026, 5, 1, 12) },
];
const facets: Facet<Doc>[] = [
  {
    id: "status",
    label: "Status",
    type: "toggle",
    allLabel: "All",
    accessor: (d) => d.status,
    options: [
      { value: "ready", label: "Ready" },
      { value: "failed", label: "Failed" },
    ],
  },
  { id: "updated", label: "Updated", type: "date-range", accessor: (d) => d.updated, pickerProps: { today: TODAY, numberOfMonths: 1 } },
];
const columns: DataTableColumn<Doc>[] = [
  { id: "title", header: "Title", accessor: "title", rowHeader: true },
  { id: "status", header: "Status", accessor: "status" },
  { id: "id", header: "ID", accessor: "id" },
];

async function pickRange(fromDay: RegExp, toDay: RegExp) {
  const grid = await screen.findByRole("grid", { name: "September 2026" });
  await userEvent.click(within(grid).getByRole("button", { name: fromDay }));
  await userEvent.click(within(grid).getByRole("button", { name: toDay }));
}

describe("1. Custom date range inside FilterBar / DataTable", () => {
  it("FilterBar: Custom with no active date filter shows the range picker, and a picked range filters", async () => {
    function Demo() {
      const [value, setValue] = useState<FilterValues>({});
      return (
        <>
          <FilterBar facets={facets} value={value} onValueChange={setValue} />
          <output>{filterRows(docs, facets, value).map((d) => d.id).join(",")}</output>
        </>
      );
    }
    render(<Demo />);
    const group = screen.getByRole("group", { name: "Updated" });
    await userEvent.click(within(group).getByRole("button", { name: "Custom" }));
    expect(within(group).getByRole("button", { name: "Custom" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Updated: custom/ })).toBeInTheDocument();
    // Nothing is filtered until a range is picked.
    expect(screen.getByRole("status")).toHaveTextContent("1,2,3");
    await pickRange(/September 24, 2026/, /September 25, 2026/);
    expect(screen.getByRole("status")).toHaveTextContent(/^1,2$/);
    expect(screen.getByRole("button", { name: /Remove filter Updated: Sep 24, 2026 – Sep 25, 2026/ })).toBeInTheDocument();
  });

  it("DataTable facets: Custom shows the range picker and a picked range filters the rows", async () => {
    render(<DataTable caption="Documents" columns={columns} data={docs} getRowId={(d) => d.id} facets={facets} />);
    const group = screen.getByRole("group", { name: "Updated" });
    await userEvent.click(within(group).getByRole("button", { name: "Custom" }));
    expect(screen.getByRole("button", { name: /Updated: custom/ })).toBeInTheDocument();
    await pickRange(/September 25, 2026/, /September 26, 2026/);
    const table = screen.getByRole("table", { name: "Documents" });
    expect(within(table).getAllByRole("rowheader").map((c) => c.textContent)).toEqual(["Deadlines"]);
  });

  it("DateRangePresets (controlled by a parent that drops a range-less Custom) keeps Custom pending until another choice", async () => {
    const onValueChange = vi.fn();
    render(<DateRangePresets aria-label="Range" today={TODAY} value={null} onValueChange={onValueChange} />);
    const group = screen.getByRole("group", { name: "Range" });
    await userEvent.click(within(group).getByRole("button", { name: "Custom" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ preset: "custom", range: null } satisfies DateRangeSelection);
    expect(screen.getByRole("button", { name: /Range: custom/ })).toBeInTheDocument();
    // Unpressing Custom hides the picker again.
    await userEvent.keyboard("{Escape}");
    await userEvent.click(within(group).getByRole("button", { name: "Custom" }));
    expect(screen.queryByRole("button", { name: /Range: custom/ })).not.toBeInTheDocument();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });
});

describe("2. Bulk actions only act on visible selected rows", () => {
  it("counts and passes only selected ids that pass the facets and text filter", async () => {
    const onDelete = vi.fn();
    const onSelectionChange = vi.fn();
    render(
      <DataTable
        caption="Documents"
        columns={columns}
        data={docs}
        getRowId={(d) => d.id}
        selectable
        rowLabel={(d) => d.title}
        filterable
        facets={facets}
        onSelectionChange={onSelectionChange}
        bulkActions={(ids) => (
          <button type="button" onClick={() => onDelete(ids)}>
            Delete
          </button>
        )}
      />,
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Select Deadlines" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Select Transcripts" }));
    expect(screen.getByRole("group", { name: "Bulk actions" })).toHaveTextContent("2 selected");
    onSelectionChange.mockClear();

    // A facet hides Transcripts: the bar counts and acts on Deadlines only.
    await userEvent.click(within(screen.getByRole("group", { name: "Status" })).getByRole("button", { name: /^Ready/ }));
    let bar = screen.getByRole("group", { name: "Bulk actions" });
    expect(bar).toHaveTextContent("1 selected");
    await userEvent.click(within(bar).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenLastCalledWith(["1"]);

    // The text filter hides Deadlines too: nothing visible is selected, so no bar.
    await userEvent.type(screen.getByRole("searchbox", { name: "Filter rows" }), "FERPA");
    expect(screen.queryByRole("group", { name: "Bulk actions" })).not.toBeInTheDocument();

    // Hidden selections are kept (filtering doesn't change the selection) and come back.
    await userEvent.clear(screen.getByRole("searchbox", { name: "Filter rows" }));
    await userEvent.click(within(screen.getByRole("group", { name: "Status" })).getByRole("button", { name: "All" }));
    bar = screen.getByRole("group", { name: "Bulk actions" });
    expect(bar).toHaveTextContent("2 selected");
    await userEvent.click(within(bar).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenLastCalledWith(["1", "2"]);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });
});

describe("3. Charts with non-finite values, negatives and duplicate labels", () => {
  const series = [{ key: "a" as const, label: "Answers" }];
  const withNaN = [
    { label: "Mon", values: { a: 10 } },
    { label: "Tue", values: { a: Number.NaN } },
    { label: "Wed", values: { a: 5 } },
    { label: "Thu", values: { a: 0 } },
  ];

  it("BarChart ignores NaN for the scale and peak, and leaves that slot empty", () => {
    const { container } = render(<BarChart data={withNaN} series={series} summary="Bars" />);
    const img = screen.getByRole("img", { name: "Bars" });
    expect(img).not.toHaveTextContent("NaN");
    expect(within(img).getByText("10")).toBeInTheDocument();
    const bars = [...container.querySelectorAll<HTMLElement>("[data-tone]")].filter((e) => e.closest("[role='img']"));
    expect(bars.map((b) => b.style.getPropertyValue("--bar-size"))).toEqual(["100%", "0%", "50%", "0%"]);
    expect(bars[1]).toHaveAttribute("data-missing");
    expect(container.querySelector("[title^='Tue']")!.getAttribute("title")).not.toContain("NaN");
  });

  it("BarChart clamps negative values to 0 (the table keeps the real number)", () => {
    const { container } = render(
      <BarChart
        data={[
          { label: "Mon", values: { a: -4 } },
          { label: "Tue", values: { a: 8 } },
        ]}
        series={series}
        summary="Bars"
        dataTable={{ caption: "Numbers", defaultOpen: true }}
      />,
    );
    const bars = [...container.querySelectorAll<HTMLElement>("[data-tone]")].filter((e) => e.closest("[role='img']"));
    expect(bars.map((b) => b.style.getPropertyValue("--bar-size"))).toEqual(["0%", "100%"]);
    expect(screen.getByRole("cell", { name: (-4).toLocaleString() })).toBeInTheDocument();
  });

  it("LineChart ignores NaN for the peak and breaks the line at it", () => {
    const { container } = render(<LineChart data={withNaN} series={series} summary="Lines" variant="area" />);
    const img = screen.getByRole("img", { name: "Lines" });
    expect(img).not.toHaveTextContent("NaN");
    expect(within(img).getByText("10")).toBeInTheDocument();
    const paths = [...container.querySelectorAll("path")].map((p) => p.getAttribute("d")!);
    expect(paths).toHaveLength(2);
    for (const d of paths) expect(d).not.toContain("NaN");
    // Mon alone before the gap, then Wed–Thu.
    const line = paths[1]!;
    expect(line.match(/M/g)).toHaveLength(2);
    expect(line).toContain("M0.00,0.00");
    expect(line).toContain("M666.67,50.00 L1000.00,100.00");
  });

  it("ChartData shows missing values as no data instead of NaN", () => {
    render(<ChartData caption="Numbers" series={series} data={withNaN} defaultOpen />);
    const table = screen.getByRole("table", { name: "Numbers" });
    expect(table).not.toHaveTextContent("NaN");
    expect(within(table).getAllByRole("row")[2]).toHaveTextContent(/no data/i);
  });

  it("Sparkline ignores NaN for the scale and breaks the line at it", () => {
    const { container } = render(<Sparkline values={[1, 2, Number.NaN, 3, 4]} label="Trend" />);
    expect(container.querySelector("path")!.getAttribute("d")).toBe("M0.00,75.00 L25.00,50.00 M75.00,25.00 L100.00,0.00");
  });

  it("duplicate point labels don't produce duplicate React keys", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const dup = [
      { label: "Sep 1", values: { a: 1 } },
      { label: "Sep 1", values: { a: 2 } },
    ];
    render(
      <>
        <BarChart data={dup} series={series} summary="Bars" dataTable={{ caption: "Bar data", defaultOpen: true }} />
        <LineChart data={dup} series={series} summary="Lines" points dataTable={{ caption: "Line data", defaultOpen: true }} />
      </>,
    );
    const keyErrors = errors.mock.calls.filter((c) => c.some((a) => typeof a === "string" && a.includes("same key")));
    errors.mockRestore();
    expect(keyErrors).toEqual([]);
  });
});

describe("4. meterLevel uses min", () => {
  it("thresholds are fractions of the min–max range", () => {
    // (85 - 50) / (100 - 50) = 0.7: below the 0.8 warning threshold.
    expect(meterLevel(85, 100, 0.8, 1, 50)).toBe("normal");
    expect(meterLevel(90, 100, 0.8, 1, 50)).toBe("warning");
    expect(meterLevel(-10, 0, 0.8, 1, -100)).toBe("warning");
    // Without min the old behaviour is unchanged.
    expect(meterLevel(85, 100)).toBe("warning");
    render(<Meter label="Score" value={85} min={50} max={100} />);
    expect(screen.getByRole("meter", { name: "Score" })).toHaveAttribute("aria-valuetext", "85 of 100");
  });
});

describe("5. date-range filter on DST days", () => {
  it("a range ends at the start of the next calendar day, not 24 hours later", () => {
    const previousTZ = process.env.TZ;
    process.env.TZ = "America/New_York";
    try {
      // Sanity: the process honours TZ, so 1 Nov 2026 is 25 hours long and 8 Mar 2026 is 23.
      expect(new Date(2026, 10, 2).getTime() - new Date(2026, 10, 1).getTime()).toBe(25 * 3_600_000);
      expect(new Date(2026, 2, 9).getTime() - new Date(2026, 2, 8).getTime()).toBe(23 * 3_600_000);
      type Row = { at: Date };
      const f: Facet<Row>[] = [{ id: "at", label: "At", type: "date-range", accessor: (r) => r.at }];
      const on = (y: number, m: number, d: number) => ({ at: { preset: "custom", range: { from: new Date(y, m, d), to: new Date(y, m, d) } } }) as FilterValues;
      // 23:30 on the 25-hour day is still that day.
      const lateFallBack = { at: new Date(2026, 10, 1, 23, 30) };
      expect(filterRows([lateFallBack], f, on(2026, 10, 1))).toEqual([lateFallBack]);
      // 00:30 the day after the 23-hour day is not.
      const afterSpring = { at: new Date(2026, 2, 9, 0, 30) };
      expect(filterRows([afterSpring], f, on(2026, 2, 8))).toEqual([]);
    } finally {
      if (previousTZ === undefined) delete process.env.TZ;
      else process.env.TZ = previousTZ;
    }
  });
});

describe("6. DataTable saved columns and SSR", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  const table = <DataTable caption="Documents" columns={columns} data={docs} getRowId={(d) => d.id} columnsMenu columnsStorageKey="rf-cols" />;

  it("renderToString doesn't read localStorage", () => {
    window.localStorage.setItem("rf-cols", JSON.stringify(["status"]));
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const html = renderToString(table);
    expect(getItem).not.toHaveBeenCalled();
    // The server renders the default columns.
    expect(html).toContain(">Status<");
  });

  it("hydrates without a mismatch, then applies the saved columns", async () => {
    const html = renderToString(table);
    window.localStorage.setItem("rf-cols", JSON.stringify(["status"]));
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    const onRecoverableError = vi.fn();
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      root = hydrateRoot(container, table, { onRecoverableError });
    });
    const hydrationErrors = errors.mock.calls.filter((c) => c.some((a) => typeof a === "string" && /hydrat/i.test(a)));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(hydrationErrors).toEqual([]);
    expect(within(container).getAllByRole("columnheader").map((h) => h.textContent)).toEqual(["Title", "ID"]);
    act(() => root!.unmount());
    container.remove();
  });
});
