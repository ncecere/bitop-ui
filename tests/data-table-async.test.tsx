import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { CellText, DataTable, type DataTableColumn, type DataTableCursor } from "@/registry/bitop/ui/data-table/data-table";

type Row = { id: string; name: string; size: number };
const rows: Row[] = [
  { id: "r1", name: "beta.pdf", size: 30 },
  { id: "r2", name: "alpha.md", size: 200 },
  { id: "r3", name: "gamma.txt", size: 5 },
  { id: "r4", name: "delta.csv", size: 80 },
  { id: "r5", name: "alpine.png", size: 120 },
];
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true, rowHeader: true },
  { id: "size", header: "Size", accessor: "size", sortable: true, numeric: true, cell: (r) => `${r.size} KB` },
];
const getRowId = (r: Row) => r.id;
const bodyNames = () => screen.queryAllByRole("rowheader").map((c) => c.textContent);
const skeletonRows = (container: HTMLElement) => container.querySelectorAll('tbody tr[aria-hidden="true"]');

/* ---------------- loading ---------------- */

describe("DataTable loading", () => {
  it("shows skeleton rows and a status while loading with no rows", async () => {
    const { container } = render(<DataTable caption="Files" columns={columns} data={[]} loading loadingRows={3} empty={<p>No files yet</p>} />);
    const table = screen.getByRole("table", { name: "Files" });
    expect(table).toHaveAttribute("aria-busy", "true");
    expect(skeletonRows(container)).toHaveLength(3);
    // Every skeleton row spans the columns and is hidden from assistive technology.
    expect(skeletonRows(container)[0]!.querySelectorAll("td")).toHaveLength(2);
    expect(screen.getByRole("status")).toHaveTextContent("Loading rows…");
    // Loading wins over the empty state.
    expect(screen.queryByText("No files yet")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps existing rows visible (dimmed, busy) instead of flashing skeletons", async () => {
    const { container, rerender } = render(<DataTable caption="Files" columns={columns} data={rows} getRowId={getRowId} loading />);
    expect(bodyNames()).toHaveLength(5);
    expect(skeletonRows(container)).toHaveLength(0);
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(container.firstElementChild).toHaveAttribute("data-stale");
    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(await axe(container)).toHaveNoViolations();

    rerender(<DataTable caption="Files" columns={columns} data={rows} getRowId={getRowId} />);
    expect(screen.getByRole("table")).not.toHaveAttribute("aria-busy");
    expect(container.firstElementChild).not.toHaveAttribute("data-stale");
  });

  it("uses a custom loading label and defaults the skeleton count to the page size", () => {
    const { container } = render(<DataTable caption="Files" columns={columns} data={[]} loading loadingLabel="Fetching files…" pageSize={4} />);
    expect(skeletonRows(container)).toHaveLength(4);
    expect(screen.getByRole("status")).toHaveTextContent("Fetching files…");
  });
});

/* ---------------- error ---------------- */

describe("DataTable error", () => {
  it("renders an ErrorAlert with Retry in place of the body and keeps the toolbar usable", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onFilterChange = vi.fn();
    const { container } = render(
      <DataTable
        caption="Files"
        columns={columns}
        data={[]}
        error={new Error("Network down")}
        onRetry={onRetry}
        filterable
        onFilterChange={onFilterChange}
        empty={<p>No files yet</p>}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Couldn't load rows");
    expect(alert).toHaveTextContent("Network down");
    // In place of the body: inside the table, and the empty state is not shown.
    expect(screen.getByRole("table")).toContainElement(alert);
    expect(screen.queryByText("No files yet")).toBeNull();

    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    await user.type(screen.getByRole("searchbox", { name: "Filter rows" }), "a");
    expect(onFilterChange).toHaveBeenLastCalledWith("a");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("gives error precedence over loading and keeps Retry focused while retrying", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const { container, rerender } = render(<DataTable caption="Files" columns={columns} data={[]} error="Timed out" onRetry={onRetry} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    await user.click(retry);
    rerender(<DataTable caption="Files" columns={columns} data={[]} error="Timed out" onRetry={onRetry} loading />);
    expect(skeletonRows(container)).toHaveLength(0);
    expect(retry).toHaveAttribute("aria-busy", "true");
    expect(retry).toHaveAttribute("aria-disabled", "true");
    expect(retry).toHaveFocus();
    // Clicks are ignored while busy.
    await user.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);

    // Recovered: the alert goes away and focus moves to the table, not <body>.
    rerender(<DataTable caption="Files" columns={columns} data={rows} getRowId={getRowId} onRetry={onRetry} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("table")).toHaveFocus();
  });

  it("shows the alert above stale rows when a refresh fails", async () => {
    const { container } = render(<DataTable caption="Files" columns={columns} data={rows} getRowId={getRowId} error="Refresh failed" />);
    const alert = screen.getByRole("alert");
    expect(screen.getByRole("table")).not.toContainElement(alert);
    expect(bodyNames()).toHaveLength(5);
    expect(within(alert).queryByRole("button")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* ---------------- cursor paging ---------------- */

function CursorTable({ onNext, onPrevious, loading = false }: { onNext?: () => void; onPrevious?: () => void; loading?: boolean }) {
  const [page, setPage] = useState(0);
  const data = rows.slice(page * 2, page * 2 + 2);
  const cursor: DataTableCursor = {
    hasPrevious: page > 0,
    hasNext: page < 2,
    onPrevious: () => {
      onPrevious?.();
      setPage((p) => p - 1);
    },
    onNext: () => {
      onNext?.();
      setPage((p) => p + 1);
    },
    label: `Showing ${page * 2 + 1}–${page * 2 + data.length}`,
  };
  // pageSize is ignored when cursor is set.
  return <DataTable caption="Files" columns={columns} data={data} getRowId={getRowId} pageSize={1} loading={loading} cursor={cursor} />;
}

describe("DataTable cursor paging", () => {
  it("renders Previous/Next with disabled ends, the range label and callbacks", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const { container } = render(<CursorTable onNext={onNext} onPrevious={onPrevious} />);
    const nav = screen.getByRole("navigation", { name: "Files pages" });
    const previous = within(nav).getByRole("button", { name: "Go to previous page" });
    const next = within(nav).getByRole("button", { name: "Go to next page" });
    // Replaces numbered paging: no page buttons, no slicing to pageSize.
    expect(within(nav).queryByRole("button", { name: "Page 1" })).toBeNull();
    expect(bodyNames()).toEqual(["beta.pdf", "alpha.md"]);
    expect(screen.getByText("Showing 1–2")).toHaveAttribute("aria-live", "polite");
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();

    // Keyboard: Enter on Next.
    next.focus();
    await user.keyboard("{Enter}");
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(bodyNames()).toEqual(["gamma.txt", "delta.csv"]);
    expect(screen.getByText("Showing 3–4")).toBeInTheDocument();
    expect(previous).toBeEnabled();

    // Last page: Next becomes disabled, so focus moves to Previous instead of being lost.
    await user.keyboard("{Enter}");
    expect(bodyNames()).toEqual(["alpine.png"]);
    expect(next).toBeDisabled();
    expect(previous).toHaveFocus();

    await user.keyboard(" ");
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(bodyNames()).toEqual(["gamma.txt", "delta.csv"]);
  });

  it("ignores clicks while loading", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    render(<CursorTable onNext={onNext} loading />);
    await user.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(onNext).not.toHaveBeenCalled();
    expect(bodyNames()).toEqual(["beta.pdf", "alpha.md"]);
  });

  it("hides the controls when everything fits on one page", () => {
    render(
      <DataTable
        caption="Files"
        columns={columns}
        data={rows}
        cursor={{ hasPrevious: false, hasNext: false, onPrevious: () => {}, onNext: () => {}, label: "Showing 1–5" }}
      />,
    );
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.getByText("Showing 1–5")).toBeInTheDocument();
  });
});

/* ---------------- load more ---------------- */

/** Resolves the in-flight "load more" request (set by InfiniteTable). */
let finishLoad: () => void = () => {};

function InfiniteTable() {
  const [count, setCount] = useState(2);
  const [loading, setLoading] = useState(false);
  return (
    <DataTable
      caption="Files"
      columns={columns}
      data={rows.slice(0, count)}
      getRowId={getRowId}
      loadMore={{
        hasMore: count < rows.length,
        loading,
        label: "Load more files",
        onLoadMore: () => {
          setLoading(true);
          finishLoad = () => {
            setCount((c) => Math.min(c + 2, rows.length));
            setLoading(false);
          };
        },
      }}
    />
  );
}

describe("DataTable load more", () => {
  it("announces new rows, keeps focus while loading and moves it to the table at the end", async () => {
    const user = userEvent.setup();
    const { container } = render(<InfiniteTable />);
    const button = screen.getByRole("button", { name: "Load more files" });
    expect(await axe(container)).toHaveNoViolations();

    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveFocus();
    // Clicks are ignored while the batch loads.
    await user.keyboard("{Enter}");
    act(() => finishLoad());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 more rows loaded."));
    expect(bodyNames()).toHaveLength(4);
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute("aria-busy");

    await user.keyboard("{Enter}");
    act(() => finishLoad());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("1 more row loaded. All rows loaded."));
    expect(bodyNames()).toHaveLength(5);
    // The button is gone; focus lands on the table rather than <body>.
    expect(screen.queryByRole("button", { name: "Load more files" })).toBeNull();
    expect(screen.getByRole("table", { name: "Files" })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("hides the button during the initial load", () => {
    render(<DataTable caption="Files" columns={columns} data={[]} loading loadMore={{ hasMore: true, onLoadMore: () => {} }} />);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });
});

/* ---------------- row actions & CellText ---------------- */

describe("DataTable row actions", () => {
  it("adds a trailing column with a visually hidden, accessible header", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const { container, rerender } = render(
      <DataTable
        caption="Files"
        columns={columns}
        data={rows}
        getRowId={getRowId}
        rowActions={(r) => (
          <button type="button" onClick={() => onEdit(r.id)}>
            Edit {r.name}
          </button>
        )}
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    const actions = screen.getByRole("columnheader", { name: "Actions" });
    expect(headers[headers.length - 1]).toBe(actions);
    expect(within(actions).getByText("Actions")).toHaveClass("sr-only");
    expect(within(actions).queryByRole("button")).toBeNull();
    expect(actions).not.toHaveAttribute("aria-sort");

    await user.click(screen.getByRole("button", { name: "Edit alpha.md" }));
    expect(onEdit).toHaveBeenCalledWith("r2");
    expect(await axe(container)).toHaveNoViolations();

    rerender(<DataTable caption="Files" columns={columns} data={rows} rowActions={() => null} rowActionsLabel="Row actions" />);
    expect(screen.getByRole("columnheader", { name: "Row actions" })).toBeInTheDocument();
  });

  it("CellText renders a primary and a secondary line", async () => {
    type Person = { id: string; name: string; email: string };
    const people: Person[] = [{ id: "p1", name: "Ada Lovelace", email: "ada@example.com" }];
    const { container } = render(
      <DataTable
        caption="People"
        columns={[{ id: "name", header: "Name", accessor: "name", rowHeader: true, cell: (p: Person) => <CellText primary={p.name} secondary={p.email} /> }]}
        data={people}
      />,
    );
    expect(screen.getByRole("rowheader")).toHaveTextContent("Ada Lovelace ada@example.com");
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    render(<CellText primary="Only" />);
    expect(screen.getByText("Only").parentElement?.childElementCount).toBe(1);
    expect(await axe(container)).toHaveNoViolations();
  });
});

/* ---------------- row click ---------------- */

describe("DataTable onRowClick", () => {
  it("opens a row on click or Enter / Space, but not from its own controls", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onEdit = vi.fn();
    const { container } = render(
      <DataTable
        caption="Files"
        columns={columns}
        data={rows.slice(0, 2)}
        getRowId={getRowId}
        onRowClick={(r) => onRowClick(r.id)}
        rowActions={(r) => (
          <button type="button" onClick={() => onEdit(r.id)}>
            Edit {r.name}
          </button>
        )}
      />,
    );
    await user.click(screen.getByRole("cell", { name: "200 KB" }));
    expect(onRowClick).toHaveBeenLastCalledWith("r2");

    // The row's own button keeps its behaviour.
    await user.click(screen.getByRole("button", { name: "Edit beta.pdf" }));
    expect(onEdit).toHaveBeenCalledWith("r1");
    expect(onRowClick).toHaveBeenCalledTimes(1);

    // Rows are in the tab order and open with Enter or Space.
    const row = screen.getByRole("rowheader", { name: "beta.pdf" }).closest("tr")!;
    expect(row).toHaveAttribute("tabindex", "0");
    row.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenLastCalledWith("r1");
    await user.keyboard(" ");
    expect(onRowClick).toHaveBeenCalledTimes(3);

    // Enter on the row's button doesn't also open the row.
    screen.getByRole("button", { name: "Edit alpha.md" }).focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledTimes(3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("leaves rows alone without onRowClick", () => {
    render(<DataTable caption="Files" columns={columns} data={rows.slice(0, 1)} getRowId={getRowId} />);
    const row = screen.getByRole("rowheader", { name: "beta.pdf" }).closest("tr")!;
    expect(row).not.toHaveAttribute("tabindex");
    expect(row).not.toHaveAttribute("data-clickable");
  });
});
