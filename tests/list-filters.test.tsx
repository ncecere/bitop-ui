/*
 * List pages: date range presets, FilterBar and its helpers, and the
 * DataTable extensions (Columns menu, facets, bulk actions).
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import {
  DatePicker,
  DateRangePresets,
  type DateRangeSelection,
  lastDaysPreset,
  matchDateRangePreset,
  parseDateRangeSelection,
  serializeDateRangeSelection,
} from "@/registry/bitop/ui/date-picker/date-picker";
import {
  activeFilterCount,
  type Facet,
  FilterBar,
  type FilterValues,
  facetCounts,
  filterRows,
  filterValuesFromSearchParams,
  filterValuesToSearchParams,
} from "@/registry/bitop/ui/filter-bar/filter-bar";

const TODAY = new Date(2026, 8, 26);
describe("date range presets", () => {
  it("serializes and parses selections for URLs", () => {
    const sel = parseDateRangeSelection("7d", undefined, TODAY)!;
    expect(sel.preset).toBe("7d");
    expect(sel.range!.from).toEqual(new Date(2026, 8, 20));
    expect(sel.range!.to).toEqual(TODAY);
    expect(serializeDateRangeSelection(sel)).toBe("7d");
    const custom = parseDateRangeSelection("2026-09-01/2026-09-10")!;
    expect(custom).toEqual({ preset: "custom", range: { from: new Date(2026, 8, 1), to: new Date(2026, 8, 10) } });
    expect(serializeDateRangeSelection(custom)).toBe("2026-09-01/2026-09-10");
    expect(parseDateRangeSelection("nonsense")).toBeNull();
    expect(matchDateRangePreset({ from: new Date(2026, 7, 28), to: TODAY }, undefined, TODAY)).toBe("30d");
  });

  it("DateRangePresets: a named toggle group; Custom reveals a range picker", async () => {
    function Demo() {
      const [value, setValue] = useState<DateRangeSelection | null>(null);
      return (
        <>
          <DateRangePresets aria-label="Range" today={TODAY} presets={[lastDaysPreset(7), lastDaysPreset(30)]} value={value} onValueChange={setValue} />
          <output>{serializeDateRangeSelection(value)}</output>
        </>
      );
    }
    const { container } = render(<Demo />);
    const group = screen.getByRole("group", { name: "Range" });
    await userEvent.click(within(group).getByRole("button", { name: "Last 30 days" }));
    expect(screen.getByRole("status")).toHaveTextContent("30d");
    expect(within(group).getByRole("button", { name: "Last 30 days" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(group).getByRole("button", { name: "Custom" }));
    expect(screen.getByRole("button", { name: /Range: custom/ })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("DatePicker presets set the range and close the popup", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker mode="range" aria-label="Period" presets={[lastDaysPreset(7)]} presetsToday={TODAY} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Period/ }));
    const presets = await screen.findByRole("group", { name: "Presets" });
    await userEvent.click(within(presets).getByRole("button", { name: "Last 7 days" }));
    expect(onValueChange).toHaveBeenCalledWith({ from: new Date(2026, 8, 20), to: TODAY });
    expect(screen.getByRole("button", { name: /Period/ })).toHaveTextContent("Sep 20, 2026");
  });
});

type Doc = { id: string; title: string; status: "ready" | "failed"; kind: string; updated: Date };
const docs: Doc[] = [
  { id: "1", title: "Deadlines", status: "ready", kind: "PDF", updated: new Date(2026, 8, 25) },
  { id: "2", title: "Transcripts", status: "failed", kind: "HTML", updated: new Date(2026, 8, 24) },
  { id: "3", title: "FERPA", status: "ready", kind: "HTML", updated: new Date(2026, 5, 1) },
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
  { id: "kind", label: "Kind", type: "select", multiple: true, accessor: (d) => d.kind, options: ["PDF", "HTML"].map((k) => ({ value: k, label: k })) },
  { id: "updated", label: "Updated", type: "date-range", accessor: (d) => d.updated },
];

describe("filter-bar helpers", () => {
  it("filters, counts facets against the other facets, and round-trips the URL", () => {
    const values: FilterValues = { status: ["ready"], updated: parseDateRangeSelection("30d", undefined, TODAY)! };
    expect(filterRows(docs, facets, values).map((d) => d.id)).toEqual(["1"]);
    expect(facetCounts(docs, facets, values)).toEqual({ status: { ready: 1, failed: 1 }, kind: { PDF: 1, HTML: 0 } });
    expect(activeFilterCount(values)).toBe(2);
    const params = filterValuesToSearchParams(facets, { ...values, kind: ["PDF", "HTML"] }, "page=2&status=failed");
    expect(params.toString()).toBe("page=2&status=ready&kind=PDF&kind=HTML&updated=30d");
    const back = filterValuesFromSearchParams(facets, params, TODAY);
    expect(back.status).toEqual(["ready"]);
    expect(back.kind).toEqual(["PDF", "HTML"]);
    expect(back.updated).toEqual(values.updated);
    expect(filterValuesFromSearchParams(facets, "status=bogus&status=failed&status=ready")).toEqual({ status: ["failed"] });
  });
});

describe("FilterBar", () => {
  it("toggle facets with counts, chips that remove filters and keep focus, Clear all", async () => {
    function Demo() {
      const [value, setValue] = useState<FilterValues>({ status: ["failed"], kind: ["PDF", "HTML"] });
      return <FilterBar facets={facets} value={value} onValueChange={setValue} counts={facetCounts(docs, facets, value)} />;
    }
    const { container } = render(<Demo />);
    const bar = screen.getByRole("group", { name: "Filters" });
    const status = within(bar).getByRole("group", { name: "Status" });
    expect(within(status).getByRole("button", { name: "Failed, 1" })).toHaveAttribute("aria-pressed", "true");
    expect(await axe(container)).toHaveNoViolations();

    // "All" clears the facet.
    await userEvent.click(within(status).getByRole("button", { name: "All" }));
    expect(within(status).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(within(status).getByRole("button", { name: "Ready, 2" }));

    const chips = within(bar).getByRole("list", { name: "Active filters" });
    // A single-choice toggle has no chip: its pressed item shows the choice.
    expect(within(chips).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual([
      "Remove filter Kind: PDF",
      "Remove filter Kind: HTML",
      "Clear all",
    ]);
    await userEvent.click(within(chips).getByRole("button", { name: "Remove filter Kind: PDF" }));
    expect(within(chips).getByRole("button", { name: "Remove filter Kind: HTML" })).toHaveFocus();
    await userEvent.click(within(chips).getByRole("button", { name: "Clear all" }));
    expect(within(bar).queryByRole("list", { name: "Active filters" })).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(document.body);
    // Clear all cleared the toggle too.
    expect(within(status).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  });

  it("a facet's chip option overrides the default either way", () => {
    const withChips: Facet<Doc>[] = facets.map((f) => (f.id === "status" ? { ...f, chip: true } : f.id === "kind" ? { ...f, chip: false } : f));
    render(<FilterBar facets={withChips} defaultValue={{ status: ["ready"], kind: ["PDF"] }} />);
    const chips = screen.getByRole("list", { name: "Active filters" });
    expect(within(chips).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Remove filter Status: Ready", "Clear all"]);
  });

  it("with only a single-choice toggle active there are no chips and no Clear all", () => {
    render(<FilterBar facets={facets} defaultValue={{ status: ["failed"] }} />);
    expect(screen.queryByRole("list", { name: "Active filters" })).toBeNull();
    expect(within(screen.getByRole("group", { name: "Status" })).getByRole("button", { name: "Failed" })).toHaveAttribute("aria-pressed", "true");
  });
});

describe("DataTable extensions", () => {
  const columns: DataTableColumn<Doc>[] = [
    { id: "title", header: "Title", accessor: "title", rowHeader: true },
    { id: "status", header: "Status", accessor: "status" },
    { id: "kind", header: "Kind", accessor: "kind" },
    { id: "id", header: "ID", accessor: "id", defaultHidden: true },
  ];

  beforeEach(() => window.localStorage.clear());

  it("Columns menu hides and shows columns and persists them", async () => {
    const onHidden = vi.fn();
    const { unmount } = render(
      <DataTable caption="Documents" columns={columns} data={docs} getRowId={(d) => d.id} columnsMenu columnsStorageKey="t-cols" onHiddenColumnsChange={onHidden} />,
    );
    const headers = () => screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers()).toEqual(["Title", "Status", "Kind"]);
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    const menu = await screen.findByRole("menu");
    // Row-header columns aren't hideable.
    expect(within(menu).getAllByRole("menuitemcheckbox").map((i) => i.textContent)).toEqual(["Status", "Kind", "ID"]);
    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "Kind" }));
    await userEvent.click(within(menu).getByRole("menuitemcheckbox", { name: "ID" }));
    expect(headers()).toEqual(["Title", "Status", "ID"]);
    expect(onHidden).toHaveBeenLastCalledWith(["kind"]);
    expect(JSON.parse(window.localStorage.getItem("t-cols")!)).toEqual(["kind"]);
    unmount();
    render(<DataTable caption="Documents" columns={columns} data={docs} getRowId={(d) => d.id} columnsMenu columnsStorageKey="t-cols" />);
    expect(headers()).toEqual(["Title", "Status", "ID"]);
  });

  it("facets filter rows in memory, announce the count and reset to page 1", async () => {
    const onFacets = vi.fn();
    function Demo() {
      const [values, setValues] = useState<FilterValues>({});
      return (
        <DataTable
          caption="Documents"
          columns={columns}
          data={docs}
          getRowId={(d) => d.id}
          facets={facets}
          facetValues={values}
          onFacetValuesChange={(v) => {
            onFacets(v);
            setValues(v);
          }}
          pageSize={2}
          defaultPage={2}
        />
      );
    }
    const { container } = render(<Demo />);
    await userEvent.click(within(screen.getByRole("group", { name: "Status" })).getByRole("button", { name: "Failed, 1" }));
    expect(onFacets).toHaveBeenLastCalledWith({ status: ["failed"] });
    const table = screen.getByRole("table", { name: "Documents" });
    expect(within(table).getAllByRole("rowheader").map((c) => c.textContent)).toEqual(["Transcripts"]);
    expect(screen.getByText("1 row matches the filters")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the no-results message for facets, and passes counts through in manual mode", () => {
    render(
      <DataTable
        caption="Documents"
        columns={columns}
        data={[]}
        manual
        facets={facets}
        facetValues={{ status: ["failed"] }}
        facetCounts={{ status: { ready: 7, failed: 0 } }}
      />,
    );
    expect(screen.getByText("No rows match these filters.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ready, 7" })).toBeInTheDocument();
  });

  it("bulk action bar appears with a selection and clears it", async () => {
    const onDelete = vi.fn();
    const { container } = render(
      <DataTable
        caption="Documents"
        columns={columns}
        data={docs}
        getRowId={(d) => d.id}
        selectable
        rowLabel={(d) => d.title}
        bulkActions={(ids) => (
          <button type="button" onClick={() => onDelete(ids)}>
            Delete
          </button>
        )}
      />,
    );
    expect(screen.queryByRole("group", { name: "Bulk actions" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("checkbox", { name: "Select Deadlines" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Select FERPA" }));
    const bar = screen.getByRole("group", { name: "Bulk actions" });
    expect(bar).toHaveTextContent("2 selected");
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(within(bar).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith(["1", "3"]);
    await userEvent.click(within(bar).getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByRole("group", { name: "Bulk actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select Deadlines" })).not.toBeChecked();
  });
});
