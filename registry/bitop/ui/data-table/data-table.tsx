"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Checkbox } from "@/registry/bitop/ui/checkbox/checkbox";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Paginator } from "@/registry/bitop/ui/pagination/pagination";
import { Table, Td, Th, Tr, type TableColumn, type TableProps } from "@/registry/bitop/ui/table/table";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./data-table.module.css";

/*
 * DataTable: a typed, dependency-free data grid on top of Table. Sorting,
 * row selection, a text filter and pagination are all optional; each piece
 * of state can be controlled or left to the table.
 *
 *   const columns: DataTableColumn<Invoice>[] = [
 *     { id: "number", header: "Invoice", accessor: "number", sortable: true, rowHeader: true },
 *     { id: "amount", header: "Amount", accessor: "amount", numeric: true, sortable: true,
 *       cell: (r) => formatMoney(r.amount) },
 *   ];
 *   <DataTable caption="Invoices" columns={columns} data={invoices} getRowId={(r) => r.id}
 *     selectable rowLabel={(r) => r.number} filterable pageSize={10} />
 *
 * Accessibility: sortable headers are real buttons inside <th>, and the
 * sorted column carries aria-sort. Selection checkboxes are named after the
 * row ("Select INV-001"); the header checkbox selects every row that passes
 * the filter and shows a mixed state. The filter is a labelled search input
 * and the number of matching rows is announced politely. Pagination is a
 * named navigation landmark with aria-current on the current page.
 *
 * All processing happens in memory. For server-side data, control `sort`,
 * `filter` and `page`, pass the current page's rows as `data` and set
 * `manual` plus `rowCount`.
 */

export type SortDirection = "ascending" | "descending";
export type DataTableSort = { columnId: string; direction: SortDirection };

type Primitive = string | number | boolean | Date | null | undefined;

export type DataTableColumn<T> = {
  /** Unique column id (used for sorting). */
  id: string;
  /** Header text. Keep it plain text for sortable columns (it names the sort button). */
  header: ReactNode;
  /** The value used for sorting, filtering and (without `cell`) display. */
  accessor?: keyof T | ((row: T) => Primitive);
  /** Custom cell content. */
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  /** Custom comparator (ascending). Defaults to comparing accessor values. */
  sortFn?: (a: T, b: T) => number;
  /** Include in the text filter (default: true when there is an accessor). */
  filterable?: boolean;
  /** Right-aligned tabular numbers. */
  numeric?: boolean;
  /** Render cells as row headers (<th scope="row">), usually the name column. */
  rowHeader?: boolean;
  /** Visually hide the header text (still announced). */
  hideHeader?: boolean;
  width?: string;
  /** Muted secondary text. */
  muted?: boolean;
};

export type DataTableProps<T> = Omit<TableProps, "columns" | "children" | "empty"> & {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Stable row id (default: the row index). Needed for selection across sorts and pages. */
  getRowId?: (row: T, index: number) => string;

  sort?: DataTableSort | null;
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort | null) => void;

  /** Adds a checkbox column. */
  selectable?: boolean;
  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Names a row for its checkbox ("Select {rowLabel}"). Defaults to the row id. */
  rowLabel?: (row: T) => string;

  /** Shows a text filter above the table. */
  filterable?: boolean;
  filter?: string;
  defaultFilter?: string;
  onFilterChange?: (filter: string) => void;
  /** Label of the filter input (default "Filter rows"). */
  filterLabel?: string;
  filterPlaceholder?: string;

  /** Rows per page; omit to show every row. */
  pageSize?: number;
  /** Current page (1-based). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;

  /** Data is already sorted, filtered and paged (server-side); only render it. */
  manual?: boolean;
  /** Total rows when `manual` (for the page count and summary). */
  rowCount?: number;

  /** Shown when there are no rows at all. */
  empty?: ReactNode;
  /** Shown when the filter matches nothing (default: "No results for …"). */
  noResults?: ReactNode;
  /** Extra controls next to the filter, e.g. an "Export" button. */
  toolbar?: ReactNode;
  /** Name of the pagination landmark (default: "{caption} pages" if caption is a string). */
  paginationLabel?: string;
};

function useControllable<V>(value: V | undefined, defaultValue: V, onChange?: (v: V) => void): [V, (v: V) => void] {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  return [
    controlled ? value : inner,
    (v: V) => {
      if (!controlled) setInner(v);
      onChange?.(v);
    },
  ];
}

function valueOf<T>(row: T, column: DataTableColumn<T>): Primitive {
  const { accessor } = column;
  if (accessor === undefined) return undefined;
  if (typeof accessor === "function") return accessor(row);
  return row[accessor] as Primitive;
}

const collator = typeof Intl !== "undefined" ? new Intl.Collator(undefined, { numeric: true, sensitivity: "base" }) : null;

/** Ascending comparison of accessor values; empty values sort last. */
export function compareValues(a: Primitive, b: Primitive): number {
  const emptyA = a === null || a === undefined || a === "";
  const emptyB = b === null || b === undefined || b === "";
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  return collator ? collator.compare(sa, sb) : sa < sb ? -1 : sa > sb ? 1 : 0;
}

function textOf(v: Primitive): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v);
}

export function DataTable<T>({
  columns,
  data,
  getRowId = (_row, index) => String(index),
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selectedIds: selectedProp,
  defaultSelectedIds = [],
  onSelectionChange,
  rowLabel,
  filterable = false,
  filter: filterProp,
  defaultFilter = "",
  onFilterChange,
  filterLabel = "Filter rows",
  filterPlaceholder = "Filter…",
  pageSize,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  manual = false,
  rowCount,
  empty,
  noResults,
  toolbar,
  paginationLabel,
  caption,
  className,
  ...tableProps
}: DataTableProps<T>) {
  const [sort, setSort] = useControllable<DataTableSort | null>(sortProp, defaultSort, onSortChange);
  const [selected, setSelected] = useControllable<string[]>(selectedProp, defaultSelectedIds, onSelectionChange);
  const [filter, setFilterValue] = useControllable<string>(filterProp, defaultFilter, onFilterChange);
  const [page, setPage] = useControllable<number>(pageProp, defaultPage, onPageChange);

  const rows = useMemo(() => data.map((row, index) => ({ row, id: getRowId(row, index) })), [data, getRowId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase();
    if (manual || !q) return rows;
    const searchable = columns.filter((c) => c.filterable ?? c.accessor !== undefined);
    return rows.filter(({ row }) => searchable.some((c) => textOf(valueOf(row, c)).toLocaleLowerCase().includes(q)));
  }, [rows, filter, columns, manual]);

  const sorted = useMemo(() => {
    if (manual || !sort) return filtered;
    const column = columns.find((c) => c.id === sort.columnId);
    if (!column) return filtered;
    const cmp = column.sortFn ?? ((a: T, b: T) => compareValues(valueOf(a, column), valueOf(b, column)));
    const dir = sort.direction === "ascending" ? 1 : -1;
    // Stable: ties keep their original order.
    return filtered
      .map((r, i) => ({ r, i }))
      .sort((x, y) => cmp(x.r.row, y.r.row) * dir || x.i - y.i)
      .map(({ r }) => r);
  }, [filtered, sort, columns, manual]);

  const total = manual ? (rowCount ?? data.length) : sorted.length;
  const pageCount = pageSize ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const visible = !pageSize || manual ? sorted : sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectedSet = new Set(selected);
  const filteredIds = filtered.map((r) => r.id);
  const selectedInView = filteredIds.filter((id) => selectedSet.has(id)).length;
  const allSelected = filteredIds.length > 0 && selectedInView === filteredIds.length;
  const someSelected = selectedInView > 0 && !allSelected;

  function toggleSort(columnId: string) {
    const next: DataTableSort | null =
      sort?.columnId !== columnId
        ? { columnId, direction: "ascending" }
        : sort.direction === "ascending"
          ? { columnId, direction: "descending" }
          : null;
    setSort(next);
    if (pageSize && currentPage !== 1) setPage(1);
  }

  function setFilter(value: string) {
    setFilterValue(value);
    if (pageSize && currentPage !== 1) setPage(1);
  }

  function toggleRow(id: string, checked: boolean) {
    setSelected(checked ? [...selected.filter((s) => s !== id), id] : selected.filter((s) => s !== id));
  }

  function toggleAll(checked: boolean) {
    const inView = new Set(filteredIds);
    setSelected(checked ? [...selected.filter((s) => !inView.has(s)), ...filteredIds] : selected.filter((s) => !inView.has(s)));
  }

  const headerColumns: TableColumn[] = [
    ...(selectable
      ? [
          {
            label: (
              <Checkbox
                label={<span className="sr-only">Select all rows</span>}
                checked={allSelected}
                indeterminate={someSelected}
                disabled={filteredIds.length === 0}
                onCheckedChange={(checked) => toggleAll(checked)}
                className={styles.check}
              />
            ),
            width: "2.5rem",
          },
        ]
      : []),
    ...columns.map((c) => {
      const active = sort?.columnId === c.id ? sort.direction : undefined;
      const label = c.sortable ? (
        <button type="button" className={styles.sort} data-active={active ? "" : undefined} onClick={() => toggleSort(c.id)}>
          <span className={c.hideHeader ? "sr-only" : undefined}>{c.header}</span>
          {active === "ascending" ? (
            <ArrowUp aria-hidden className={styles.sortIcon} />
          ) : active === "descending" ? (
            <ArrowDown aria-hidden className={styles.sortIcon} />
          ) : (
            <ChevronsUpDown aria-hidden className={styles.sortIcon} />
          )}
        </button>
      ) : (
        c.header
      );
      return {
        label,
        numeric: c.numeric,
        hideLabel: !c.sortable && c.hideHeader,
        width: c.width,
        sort: active,
      };
    }),
  ];

  const filtering = filter.trim() !== "";
  const noRows = data.length === 0 && !filtering;
  const emptyContent =
    visible.length > 0
      ? undefined
      : noRows
        ? (empty ?? <p className={styles.message}>No rows.</p>)
        : (noResults ?? <p className={styles.message}>No results for “{filter.trim()}”.</p>);

  const selectedCount = selected.length;
  const firstRow = total === 0 ? 0 : pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const lastRow = pageSize ? Math.min(total, currentPage * pageSize) : total;
  const navLabel = paginationLabel ?? (typeof caption === "string" ? `${caption} pages` : "Table pages");

  return (
    <div className={cx(styles.root, className)}>
      {(filterable || toolbar) && (
        <div className={styles.toolbar}>
          {filterable && (
            <div className={styles.filter}>
              <Field label={filterLabel} hideLabel>
                <Input
                type="search"
                size="sm"
                value={filter}
                placeholder={filterPlaceholder}
                startIcon={<Search />}
                onValueChange={setFilter}
                />
              </Field>
            </div>
          )}
          {toolbar && <div className={styles.actions}>{toolbar}</div>}
        </div>
      )}
      <Table {...tableProps} caption={caption} columns={headerColumns} empty={emptyContent}>
        {visible.map(({ row, id }) => {
          const isSelected = selectedSet.has(id);
          return (
            <Tr key={id} selected={isSelected}>
              {selectable && (
                <Td>
                  <Checkbox
                    label={<span className="sr-only">Select {rowLabel ? rowLabel(row) : id}</span>}
                    checked={isSelected}
                    onCheckedChange={(checked) => toggleRow(id, checked)}
                    className={styles.check}
                  />
                </Td>
              )}
              {columns.map((c) => {
                const content = c.cell ? c.cell(row) : textOf(valueOf(row, c));
                return c.rowHeader ? (
                  <Th key={c.id}>{content}</Th>
                ) : (
                  <Td key={c.id} numeric={c.numeric} muted={c.muted}>
                    {content}
                  </Td>
                );
              })}
            </Tr>
          );
        })}
      </Table>
      {(selectable || pageSize) && (
        <div className={styles.footer}>
          <p className={styles.summary}>
            {[selectable && `${selectedCount} of ${manual ? total : data.length} selected`, pageSize && `Rows ${firstRow}–${lastRow} of ${total}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {pageSize !== undefined && pageCount > 1 && (
            <Paginator page={currentPage} pageCount={pageCount} onPageChange={setPage} size="sm" label={navLabel} compact />
          )}
        </div>
      )}
      <p role="status" className="sr-only">
        {filtering ? `${total} ${total === 1 ? "row matches" : "rows match"} the filter` : ""}
      </p>
    </div>
  );
}
