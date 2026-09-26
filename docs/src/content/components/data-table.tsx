import { Download, Pencil, RefreshCw, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { CellText, DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
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

export function AsyncLoading() {
  type Model = { id: string; name: string; provider: string; latency: number };
  const columns: DataTableColumn<Model>[] = [
    { id: "name", header: "Model", accessor: "name", rowHeader: true },
    { id: "provider", header: "Provider", accessor: "provider", muted: true },
    { id: "latency", header: "p50 latency", accessor: "latency", numeric: true, cell: (m) => `${m.latency} ms` },
  ];
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  function load() {
    setLoading(true);
    // Stand-in for a fetch: rows already on screen stay visible (dimmed) while it runs.
    setTimeout(() => {
      setModels([
        { id: "m1", name: "sonnet-large", provider: "Anthropic", latency: 420 + Math.round(Math.random() * 80) },
        { id: "m2", name: "gpt-mini", provider: "OpenAI", latency: 180 + Math.round(Math.random() * 60) },
        { id: "m3", name: "llama-70b", provider: "Self-hosted", latency: 610 + Math.round(Math.random() * 90) },
      ]);
      setLoading(false);
    }, 1200);
  }
  useEffect(load, []);
  return (
    <DataTable
      framed
      caption="Models"
      columns={columns}
      data={models}
      getRowId={(m) => m.id}
      loading={loading}
      loadingRows={3}
      loadingLabel="Loading models\u2026"
      toolbar={
        <Button size="sm" variant="secondary" onClick={load}>
          <RefreshCw aria-hidden /> Refresh
        </Button>
      }
    />
  );
}

export function ErrorAndRetry() {
  type Job = { id: string; name: string; status: string };
  const columns: DataTableColumn<Job>[] = [
    { id: "name", header: "Job", accessor: "name", rowHeader: true },
    { id: "status", header: "Status", accessor: "status" },
  ];
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<unknown>(new Error("The server took too long to respond."));
  const [loading, setLoading] = useState(false);
  function retry() {
    setLoading(true);
    // The error stays up (Retry shows a spinner) until the retry succeeds.
    setTimeout(() => {
      setJobs([
        { id: "j1", name: "Nightly re-index", status: "Succeeded" },
        { id: "j2", name: "Crawl docs.example.com", status: "Running" },
      ]);
      setError(undefined);
      setLoading(false);
    }, 1000);
  }
  return (
    <DataTable
      framed
      caption="Jobs"
      columns={columns}
      data={jobs}
      getRowId={(j) => j.id}
      filterable
      filterLabel="Filter jobs"
      loading={loading}
      error={error}
      onRetry={retry}
      errorTitle="Couldn't load jobs"
    />
  );
}

export function CursorPaging() {
  type AuditEvent = { id: string; action: string; actor: string };
  const all: AuditEvent[] = Array.from({ length: 23 }, (_, i) => ({
    id: `evt_${String(i + 1).padStart(3, "0")}`,
    action: ["document.created", "member.invited", "key.rotated", "policy.updated"][i % 4]!,
    actor: ["ada@example.com", "grace@example.com", "system"][i % 3]!,
  }));
  const pageSize = 5;
  const columns: DataTableColumn<AuditEvent>[] = [
    { id: "id", header: "Event", accessor: "id", rowHeader: true },
    { id: "action", header: "Action", accessor: "action" },
    { id: "actor", header: "Actor", accessor: "actor", muted: true },
  ];
  // A server returns { items, nextCursor }; keep the cursors seen so far so Previous needs no extra API.
  const [stack, setStack] = useState<number[]>([0]);
  const [loading, setLoading] = useState(false);
  const start = stack[stack.length - 1]!;
  const [rows, setRows] = useState(all.slice(0, pageSize));
  const nextCursor = start + pageSize < all.length ? start + pageSize : null;
  function go(nextStack: number[]) {
    setLoading(true);
    setTimeout(() => {
      const from = nextStack[nextStack.length - 1]!;
      setRows(all.slice(from, from + pageSize));
      setStack(nextStack);
      setLoading(false);
    }, 500);
  }
  return (
    <DataTable
      framed
      caption="Audit events"
      columns={columns}
      data={rows}
      getRowId={(e) => e.id}
      loading={loading}
      cursor={{
        hasPrevious: stack.length > 1,
        hasNext: nextCursor !== null,
        onPrevious: () => go(stack.slice(0, -1)),
        onNext: () => nextCursor !== null && go([...stack, nextCursor]),
        label: `Showing ${start + 1}\u2013${start + rows.length}`,
      }}
    />
  );
}

export function LoadMore() {
  type Message = { id: string; subject: string; from: string };
  const all: Message[] = Array.from({ length: 12 }, (_, i) => ({
    id: `msg-${i + 1}`,
    subject: ["Quarterly report", "Invoice overdue", "Welcome aboard", "Build failed"][i % 4]!,
    from: ["finance@example.com", "billing@example.com", "ci@example.com"][i % 3]!,
  }));
  const columns: DataTableColumn<Message>[] = [
    { id: "subject", header: "Subject", accessor: "subject", rowHeader: true },
    { id: "from", header: "From", accessor: "from", muted: true },
  ];
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  return (
    <DataTable
      framed
      caption="Inbox"
      columns={columns}
      data={all.slice(0, count)}
      getRowId={(m) => m.id}
      loadMore={{
        hasMore: count < all.length,
        loading,
        label: "Load more messages",
        onLoadMore: () => {
          setLoading(true);
          setTimeout(() => {
            setCount((c) => c + 4);
            setLoading(false);
          }, 600);
        },
      }}
    />
  );
}

export function RowActions() {
  type Member = { id: string; name: string; email: string; role: string };
  const [members, setMembers] = useState<Member[]>([
    { id: "u1", name: "Ada Lovelace", email: "ada@example.com", role: "Owner" },
    { id: "u2", name: "Grace Hopper", email: "grace@example.com", role: "Admin" },
    { id: "u3", name: "Alan Turing", email: "alan@example.com", role: "Member" },
  ]);
  const columns: DataTableColumn<Member>[] = [
    {
      id: "name",
      header: "Member",
      accessor: "name",
      sortable: true,
      rowHeader: true,
      cell: (m) => <CellText primary={m.name} secondary={m.email} />,
    },
    { id: "role", header: "Role", accessor: "role" },
  ];
  return (
    <DataTable
      framed
      caption="Members"
      columns={columns}
      data={members}
      getRowId={(m) => m.id}
      rowActions={(m) => (
        <>
          <IconButton size="sm" icon={<Pencil aria-hidden />} label={`Edit ${m.name}`} />
          <IconButton
            size="sm"
            icon={<Trash2 aria-hidden />}
            label={`Remove ${m.name}`}
            onClick={() => setMembers((list) => list.filter((x) => x.id !== m.id))}
          />
        </>
      )}
    />
  );
}

const doc: ComponentDoc = {
  slug: "data-table",
  title: "Data table",
  category: "Display",
  description:
    "A typed data table on top of Table: sortable headers, row selection, a text filter and pagination, each optional and each controllable. No dependencies.",
  imports: `import { CellText, DataTable, type DataTableColumn } from "@/components/ui/data-table/data-table";`,
  examples: examples(raw, [
    ["Invoices", Invoices, { title: "Sort, select, filter and paginate", wide: true }],
    ["Empty", Empty, { title: "Empty state", wide: true }],
    [
      "AsyncLoading",
      AsyncLoading,
      {
        title: "Async loading",
        description: "Skeleton rows while there is nothing to show; on refresh the current rows stay visible, dimmed, with aria-busy on the table.",
        wide: true,
      },
    ],
    [
      "ErrorAndRetry",
      ErrorAndRetry,
      {
        title: "Error and retry",
        description: "With no rows the ErrorAlert replaces the body; the toolbar stays usable. Retry keeps focus and shows a spinner while loading.",
        wide: true,
      },
    ],
    [
      "CursorPaging",
      CursorPaging,
      { title: "Cursor paging", description: "Previous / Next for APIs that return cursors, with a range label. Replaces numbered pagination.", wide: true },
    ],
    ["LoadMore", LoadMore, { title: "Load more", description: "The number of new rows is announced; at the end, focus moves to the table.", wide: true }],
    [
      "RowActions",
      RowActions,
      { title: "Row actions and two-line cells", description: "A trailing actions column and CellText for a name over a subtitle.", wide: true },
    ],
  ]),
  props: [
    {
      component: "DataTable<T>",
      note: (
        <>
          Also accepts Table props (framed, density, stickyHeader, maxHeight, showCaption). <strong>What the body shows:</strong> rows to show always
          render (error adds an alert above the table, loading dims them); with no rows to show, error &gt; loading (skeleton rows) &gt; empty (no
          data) &gt; noResults (the filter matched nothing). The toolbar is always rendered.
        </>
      ),
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
        {
          name: "loading",
          type: "boolean",
          default: "false",
          description: "Sets aria-busy. With no rows to show: skeleton rows and a polite status. With rows: they stay visible, dimmed.",
        },
        { name: "loadingRows / loadingLabel", type: "number / string", default: 'pageSize (max 10) or 5 / "Loading rows\u2026"', description: "Skeleton row count and the announced loading text." },
        {
          name: "error / onRetry / errorTitle",
          type: "unknown / () => void / ReactNode",
          default: '— / — / "Couldn\'t load rows"',
          description: "An ErrorAlert in place of the body (no rows) or above the table (stale rows); onRetry adds a Retry button to its actions.",
        },
        {
          name: "cursor",
          type: "{ hasPrevious, hasNext, onPrevious, onNext, label? }",
          description: "Server-driven Previous / Next with a range label. Mutually exclusive with numbered paging: when set, pageSize and page are ignored. Clicks are ignored while loading.",
        },
        {
          name: "loadMore",
          type: "{ hasMore, loading?, onLoadMore, label? }",
          description: 'A "Load more" button after the table (label default "Load more"). Don\'t combine with pageSize.',
        },
        { name: "rowActions", type: "(row) => ReactNode", description: "Trailing, right-aligned, unsortable actions column." },
        { name: "rowActionsLabel", type: "string", default: '"Actions"', description: "Visually hidden header of the actions column." },
      ],
    },
    {
      component: "CellText",
      note: "A name over a muted subtitle, for cell content. Also accepts span props.",
      rows: [
        { name: "primary", type: "ReactNode", required: true, description: "The main line." },
        { name: "secondary", type: "ReactNode", description: "The smaller, muted second line." },
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
    "While loading the table has aria-busy; skeleton rows are aria-hidden and a polite status says “Loading rows…”. Errors use ErrorAlert (role=alert).",
    "Load more announces how many rows arrived in the same polite status. The Load more and Retry buttons stay focusable while busy (aria-disabled, aria-busy).",
    "If a focused control disappears or becomes disabled (Load more at the end, Next on the last page, Retry after recovery, a removed row), focus moves to the current page, the other step button or the table instead of the page body.",
    "The cursor range label is a polite live region; the Previous/Next controls are a navigation landmark named like numbered pagination.",
    "The row actions column has a visually hidden header (“Actions”), so every action cell has a column name.",
  ],
};

export default doc;
