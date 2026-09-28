import { Download, MoreHorizontal, Pencil, RefreshCw, Tag, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatBytes } from "@/registry/bitop/lib/bitop-format";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { CellText, DataTable, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { type Facet, type FilterValues, filterValuesFromSearchParams, filterValuesToSearchParams } from "@/registry/bitop/ui/filter-bar/filter-bar";
import { Menu, MenuItem, MenuSeparator } from "@/registry/bitop/ui/menu/menu";
import { Time } from "@/registry/bitop/ui/time/time";
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

export function DocumentsWithFacets() {
  type Doc = { id: string; title: string; path: string; kind: "PDF" | "HTML" | "Markdown"; size: number; status: "ready" | "failed" | "skipped"; updated: Date };
  const kinds = ["PDF", "HTML", "Markdown"] as const;
  const statuses = ["ready", "ready", "ready", "failed", "ready", "skipped"] as const;
  const now = Date.now();
  const docs: Doc[] = Array.from({ length: 58 }, (_, i) => ({
    id: `doc-${i + 1}`,
    title: ["Registration deadlines", "Transcript requests", "FERPA overview", "Graduation checklist", "Residency for tuition"][i % 5]! + (i >= 5 ? ` (${Math.floor(i / 5) + 1})` : ""),
    path: `/records/${["deadlines", "transcripts", "ferpa", "graduation", "residency"][i % 5]}-${i + 1}`,
    kind: kinds[(i + Math.floor(i / 3)) % 3]!,
    size: 12_000 + ((i * 479_909) % 2_400_000),
    status: statuses[i % statuses.length]!,
    updated: new Date(now - i * 31 * 3600_000),
  }));
  const tone = { ready: "success", failed: "danger", skipped: "neutral" } as const;
  const label = { ready: "Ready", failed: "Failed", skipped: "Skipped" } as const;
  const columns: DataTableColumn<Doc>[] = [
    { id: "title", header: "Title", accessor: "title", sortable: true, rowHeader: true, cell: (d) => <CellText primary={d.title} secondary={d.path} /> },
    { id: "kind", header: "Kind · Size", accessor: "kind", label: "Kind and size", cell: (d) => `${d.kind} · ${formatBytes(d.size)}`, muted: true },
    { id: "status", header: "Status", accessor: "status", sortable: true, cell: (d) => <StatusBadge tone={tone[d.status]}>{label[d.status]}</StatusBadge> },
    { id: "updated", header: "Updated", accessor: "updated", sortable: true, muted: true, cell: (d) => <Time value={d.updated} format="relative" /> },
    { id: "id", header: "ID", accessor: "id", defaultHidden: true, muted: true },
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
        { value: "skipped", label: "Skipped" },
      ],
    },
    { id: "kind", label: "Kind", type: "select", multiple: true, placeholder: "Any kind", accessor: (d) => d.kind, options: kinds.map((k) => ({ value: k, label: k })) },
    { id: "updated", label: "Updated", type: "date-range", accessor: (d) => d.updated, pickerProps: { max: new Date() } },
  ];
  // Keep the filters in the URL (here a string; in an app, your router's search params).
  const [search, setSearch] = useState("status=failed");
  const filters = useMemo(() => filterValuesFromSearchParams(facets, search), [search]);
  const setFilters = (next: FilterValues) => setSearch(filterValuesToSearchParams(facets, next, search).toString());
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <>
      <DataTable
        framed
        caption="Documents"
        columns={columns}
        data={docs}
        getRowId={(d) => d.id}
        rowLabel={(d) => d.title}
        defaultSort={{ columnId: "updated", direction: "descending" }}
        facets={facets}
        facetValues={filters}
        onFacetValuesChange={setFilters}
        filterable
        filterLabel="Search documents"
        filterPlaceholder="Search titles…"
        columnsMenu
        columnsStorageKey="docs-example-documents-columns"
        selectable
        selectedIds={selected}
        onSelectionChange={setSelected}
        bulkActions={(ids, clear) => (
          <>
            <Button size="sm" variant="secondary">
              <Tag aria-hidden /> Tag
            </Button>
            <Button size="sm" variant="secondary">
              <RefreshCw aria-hidden /> Re-fetch
            </Button>
            <Button size="sm" variant="danger" onClick={clear}>
              <Trash2 aria-hidden /> Delete {ids.length}
            </Button>
          </>
        )}
        rowActions={(d) => (
          <Menu align="end" trigger={<IconButton size="sm" icon={<MoreHorizontal aria-hidden />} label={`Actions for ${d.title}`} />}>
            <MenuItem>Open</MenuItem>
            <MenuItem>Re-fetch</MenuItem>
            <MenuSeparator />
            <MenuItem tone="danger">Delete</MenuItem>
          </Menu>
        )}
        pageSize={10}
        density="compact"
        stickyHeader
        maxHeight="28rem"
      />
      <p style={{ marginTop: "var(--space-2)", fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
        URL: <code>?{search}</code>
      </p>
    </>
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
    [
      "DocumentsWithFacets",
      DocumentsWithFacets,
      {
        title: "Facets, columns menu and bulk actions",
        description:
          "Faceted filters with counts, chips and Clear all, synced to the URL; a Columns menu persisted in localStorage (ID starts hidden); a bulk bar while rows are selected; a “…” row menu; compact density and a sticky header.",
        wide: true,
      },
    ],
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
          Also accepts Table props (framed, density=&quot;compact&quot;, stickyHeader with maxHeight, showCaption). <strong>What the body shows:</strong> rows to show always
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
        { name: "onRowClick", type: "(row) => void", description: "The row opens the record (e.g. a detail sheet). The row header cell's content (first rowHeader column, else the first column) becomes a button, the row's one tab stop (Enter / Space); a click anywhere else on the row that isn't on a control opens it too. Keep links and buttons out of that cell." },
        { name: "rowClickLabel", type: "(row) => string", description: "Optional accessible name of the row's open button, e.g. (r) => `Open ${r.name}` (default: the cell's content). Include the visible text." },
        { name: "columnsMenu", type: "boolean", default: "false", description: "A “Columns” menu of checkbox items to show and hide hideable columns (at least one stays visible)." },
        { name: "hiddenColumns / defaultHiddenColumns / onHiddenColumnsChange", type: "string[]", description: "Hidden column ids, controlled or not (default: columns with defaultHidden)." },
        { name: "columnsStorageKey", type: "string", description: "Persist hidden columns in localStorage (uncontrolled only). Read after mount, so server and first client render match." },
        { name: "columnsMenuLabel", type: "string", default: '"Columns"', description: "Text of the menu button." },
        {
          name: "facets, facetValues / defaultFacetValues / onFacetValuesChange",
          type: "Facet<T>[], FilterValues",
          description: "A FilterBar under the toolbar; rows are filtered in memory with each facet's accessor (not in manual mode). Control the values to sync them to the URL.",
        },
        { name: "facetCounts", type: "FacetCounts | false", default: "computed from data", description: "Option counts; pass your own for server data (manual) or false to hide them." },
        { name: "facetLabels", type: "Partial<FilterBarLabels>", description: "Translate the filter bar." },
        { name: "bulkActions", type: "(ids, clear) => ReactNode", description: "A bar with “N selected”, your actions and Clear selection, while rows are selected. ids are only the selected rows that pass the facets and text filter (all selected ids with manual); hidden selections are kept but never acted on. clear() clears the whole selection." },
        { name: "selectedLabel", type: "(count) => string", default: '"N selected"', description: "Text of the bulk bar." },
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
        { name: "hideable / defaultHidden / label", type: "boolean / boolean / string", default: "true (false for rowHeader)", description: "Columns menu: can be hidden, starts hidden, name in the menu." },
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
    "With onRowClick, the row header's content is a real button (announced as a button, named after the record or by rowClickLabel): one tab stop per row, opened with Enter or Space, and reachable with screen-reader table navigation. Rows themselves are not tab stops. Clicks on the row's links, buttons, checkboxes, menus and other controls keep their behaviour.",
    "The table wrapper is position: relative, so visually hidden labels in a wide table stay inside its scroll container and never widen the page.",
    "The Columns menu is a Base UI Menu of menuitemcheckbox items that stays open while you toggle; the last visible column can't be hidden.",
    "Facets follow FilterBar: a named group, labelled controls, counts read after options, and removable chips that keep focus in the bar. Filtering announces “N rows match the filters”.",
    "The bulk bar is a group named “Bulk actions”; its count is text (“3 selected”) and Clear selection is a real button.",
  ],
};

export default doc;
