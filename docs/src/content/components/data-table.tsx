import { Download, Users } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button } from "@/registry/bitop/ui/button/button";
import { DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { type ComponentDoc, examples } from "../types";
import raw from "./data-table.tsx?raw";

export function Invoices() {
  type Invoice = { id: string; customer: string; status: "Paid" | "Pending" | "Overdue"; amount: number; issued: Date };
  const customers = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark", "Wayne", "Wonka"];
  const statuses = ["Paid", "Pending", "Overdue"] as const;
  const invoices: Invoice[] = Array.from({ length: 23 }, (_, i) => ({
    id: `INV-${String(i + 1).padStart(3, "0")}`,
    customer: customers[i % customers.length]!,
    status: statuses[(i * 7) % 3]!,
    amount: 120 + ((i * 379) % 2400),
    issued: new Date(2026, 8, 1 + i),
  }));
  const tone = { Paid: "success", Pending: "info", Overdue: "danger" } as const;
  const columns: DataTableColumn<Invoice>[] = [
    { id: "id", header: "Invoice", accessor: "id", sortable: true, rowHeader: true },
    { id: "customer", header: "Customer", accessor: "customer", sortable: true },
    {
      id: "status",
      header: "Status",
      accessor: "status",
      sortable: true,
      cell: (r) => <StatusBadge tone={tone[r.status]}>{r.status}</StatusBadge>,
    },
    {
      id: "amount",
      header: "Amount",
      accessor: "amount",
      sortable: true,
      numeric: true,
      cell: (r) => r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" }),
    },
    {
      id: "issued",
      header: "Issued",
      accessor: "issued",
      sortable: true,
      muted: true,
      cell: (r) => r.issued.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    },
  ];
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <DataTable
      framed
      caption="Invoices"
      columns={columns}
      data={invoices}
      getRowId={(r) => r.id}
      defaultSort={{ columnId: "issued", direction: "descending" }}
      selectable
      selectedIds={selected}
      onSelectionChange={setSelected}
      rowLabel={(r) => r.id}
      filterable
      filterLabel="Filter invoices"
      filterPlaceholder="Filter invoices…"
      pageSize={8}
      toolbar={
        <Button size="sm" variant="secondary" disabled={selected.length === 0}>
          <Download aria-hidden /> Export {selected.length || ""}
        </Button>
      }
    />
  );
}

export function Empty() {
  type Member = { email: string; role: string };
  const columns: DataTableColumn<Member>[] = [
    { id: "email", header: "Email", accessor: "email", sortable: true },
    { id: "role", header: "Role", accessor: "role" },
  ];
  return (
    <DataTable
      framed
      caption="Members"
      columns={columns}
      data={[]}
      empty={<EmptyState size="compact" icon={<Users />} title="No members yet" description="Invite people to collaborate on this project." />}
    />
  );
}

const doc: ComponentDoc = {
  slug: "data-table",
  title: "Data table",
  category: "Display",
  description:
    "A typed data table on top of Table: sortable headers, row selection, a text filter and pagination, each optional and each controllable. No dependencies.",
  imports: `import { DataTable, type DataTableColumn } from "@/components/ui/data-table/data-table";`,
  examples: examples(raw, [
    ["Invoices", Invoices, { title: "Sort, select, filter and paginate", wide: true }],
    ["Empty", Empty, { title: "Empty state", wide: true }],
  ]),
  props: [
    {
      component: "DataTable<T>",
      note: "Also accepts Table props (framed, density, stickyHeader, maxHeight, showCaption).",
      rows: [
        { name: "caption", type: "ReactNode", required: true, description: "Names the table." },
        { name: "columns", type: "DataTableColumn<T>[]", required: true, description: "Column definitions (see below)." },
        { name: "data", type: "T[]", required: true, description: "Rows." },
        { name: "getRowId", type: "(row, index) => string", default: "index", description: "Stable id; needed for selection across sorts and pages." },
        { name: "sort / defaultSort / onSortChange", type: "{ columnId, direction } | null", description: "Header clicks cycle ascending → descending → unsorted." },
        { name: "selectable, selectedIds / defaultSelectedIds / onSelectionChange", type: "boolean, string[]", description: "Checkbox column with a select-all header." },
        { name: "rowLabel", type: "(row) => string", description: 'Names each row checkbox ("Select INV-001").' },
        { name: "filterable, filter / defaultFilter / onFilterChange", type: "boolean, string", description: "Case-insensitive text filter over filterable columns." },
        { name: "filterLabel / filterPlaceholder", type: "string", default: '"Filter rows"', description: "Filter input label (visually hidden) and placeholder." },
        { name: "pageSize, page / defaultPage / onPageChange", type: "number", description: "Paginate with the Paginator from pagination." },
        { name: "manual / rowCount", type: "boolean / number", description: "Server-side mode: render data as given; rowCount drives the page count." },
        { name: "empty / noResults", type: "ReactNode", description: "No rows at all / the filter matched nothing." },
        { name: "toolbar", type: "ReactNode", description: "Controls next to the filter." },
        { name: "paginationLabel", type: "string", default: '"{caption} pages"', description: "Name of the pagination landmark." },
      ],
    },
    {
      component: "DataTableColumn<T>",
      rows: [
        { name: "id / header", type: "string / ReactNode", required: true, description: "Identity and header content (plain text for sortable columns)." },
        { name: "accessor", type: "keyof T | (row) => value", description: "Value for sorting, filtering and default display." },
        { name: "cell", type: "(row) => ReactNode", description: "Custom cell content." },
        { name: "sortable / sortFn", type: "boolean / (a, b) => number", description: "Enable sorting; custom ascending comparator." },
        { name: "filterable", type: "boolean", default: "true with an accessor", description: "Include in the text filter." },
        { name: "numeric / muted / rowHeader / hideHeader / width", type: "boolean / … / string", description: 'Alignment, secondary text, <th scope="row"> cells, hidden header text, width.' },
      ],
    },
  ],
  a11y: [
    "Sortable headers are buttons inside <th>; the sorted column has aria-sort (ascending or descending). Direction icons are decorative.",
    "Row checkboxes are named after the row; the header checkbox (“Select all rows”) shows a mixed state and acts on every row that passes the filter.",
    "The filter is a labelled search input, and the number of matching rows is announced in a polite live region.",
    "Pagination is a named navigation landmark with the current page marked aria-current; sorting and filtering return to page 1.",
    "Selection is also shown by the row tint and the checkbox, never by colour alone.",
  ],
};

export default doc;
