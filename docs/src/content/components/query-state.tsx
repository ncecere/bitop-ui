import { FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Card } from "@/registry/bitop/ui/card/card";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { QueryState } from "@/registry/bitop/ui/query-state/query-state";
import { SkeletonText } from "@/registry/bitop/ui/skeleton/skeleton";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { ToggleGroup, ToggleGroupItem } from "@/registry/bitop/ui/toggle-group/toggle-group";
import { type ComponentDoc, examples } from "../types";
import raw from "./query-state.tsx?raw";

export function States() {
  const [state, setState] = useState<string[]>(["data"]);
  const documents = [
    { id: "d1", name: "Onboarding handbook.pdf", size: "1.2 MB" },
    { id: "d2", name: "Security policy.docx", size: "84 kB" },
  ];
  const current = state[0] ?? "data";
  return (
    <Stack gap={4}>
      <ToggleGroup aria-label="Simulated state" value={state} onValueChange={(v) => v.length && setState(v)} variant="outline" size="sm" joined>
        <ToggleGroupItem value="loading">Loading</ToggleGroupItem>
        <ToggleGroupItem value="error">Error</ToggleGroupItem>
        <ToggleGroupItem value="empty">Empty</ToggleGroupItem>
        <ToggleGroupItem value="data">Data</ToggleGroupItem>
      </ToggleGroup>
      <Card title="Documents" flush>
        <QueryState
          loading={current === "loading"}
          error={current === "error" ? Object.assign(new Error("The search index is rebuilding."), { status: 503 }) : undefined}
          empty={current === "empty"}
          onRetry={() => setState(["data"])}
          loadingLabel="Loading documents…"
          emptyIcon={<FileText />}
          emptyTitle="No documents yet"
          emptyDescription="Upload a file or connect a source to start answering questions."
        >
          {() => (
            <Table caption="Documents" columns={["Name", { label: "Size", numeric: true }]}>
              {documents.map((d) => (
                <Tr key={d.id}>
                  <Td>{d.name}</Td>
                  <Td numeric>{d.size}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </QueryState>
      </Card>
    </Stack>
  );
}

export function WithQuery() {
  // The shape of a TanStack Query result; QueryState doesn't import TanStack.
  const [query, setQuery] = useState<{ isPending: boolean; isFetching: boolean; error: unknown; data?: string[] }>({
    isPending: false,
    isFetching: false,
    error: null,
    data: ["gpt-4.1", "claude-sonnet-4.5", "llama-3.3-70b"],
  });
  const refetch = () => {
    // A background refetch keeps the current list on screen: no spinner flash.
    setQuery((q) => ({ ...q, isFetching: true }));
    setTimeout(() => setQuery((q) => ({ ...q, isFetching: false, data: [...(q.data ?? []), "mistral-large"] })), 800);
  };
  return (
    <Card title="Models" actions={<Button size="sm" variant="secondary" loading={query.isFetching} onClick={refetch}>Refresh</Button>}>
      <QueryState query={{ ...query, refetch }} emptyTitle="No models configured">
        {(models) => (
          <ul>
            {models.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </QueryState>
    </Card>
  );
}

export function SkeletonLoading() {
  return (
    <Card title="Activity">
      <QueryState loading loadingLabel="Loading activity…" loadingFallback={<SkeletonText lines={4} />}>
        <p>Activity feed</p>
      </QueryState>
    </Card>
  );
}

const doc: ComponentDoc = {
  slug: "query-state",
  title: "Query state",
  category: "Feedback",
  description:
    "The loading → error → empty → content switch every data view repeats. Pass the states directly or a TanStack-Query-like result; errors get status-aware titles and a retry button.",
  imports: `import { QueryState } from "@/components/ui/query-state/query-state";`,
  examples: examples(raw, [
    ["States", States, { title: "States", description: "Loading shows a labelled spinner, errors an ErrorAlert with retry, empty an EmptyState.", wide: true }],
    [
      "WithQuery",
      WithQuery,
      { title: "From a query result", description: "Loading means pending without data, so refreshing keeps the list visible. A render function only runs once data exists." },
    ],
    ["SkeletonLoading", SkeletonLoading, { title: "Skeleton fallback", description: "loadingLabel is still announced to screen readers." }],
  ]),
  props: [
    {
      component: "QueryState",
      note: "Explicit loading / error / empty / onRetry props win over values derived from query.",
      rows: [
        { name: "children", type: "ReactNode | (data) => ReactNode", required: true, description: "The content; a function is only called when there is data to show." },
        { name: "query", type: "{ isPending?, isLoading?, isFetching?, error?, data?, refetch? }", description: "Derive every state from a query result." },
        { name: "isEmpty", type: "(data) => boolean", default: "null or []", description: "Decides whether query data is empty." },
        { name: "loading", type: "boolean", description: "Show the loading state." },
        { name: "error", type: "unknown", description: "Any truthy value shows an ErrorAlert." },
        { name: "empty", type: "boolean", description: "Show the empty state." },
        { name: "onRetry", type: "() => void", default: "query.refetch", description: "Adds a retry button to the error." },
        { name: "retryLabel", type: "ReactNode", default: '"Try again"', description: "Retry button text." },
        { name: "describeError", type: "(error) => Partial<{ title, message, tone }>", description: "App-specific error mapping (see Alert)." },
        { name: "loadingLabel", type: "ReactNode", default: '"Loading…"', description: "Visible and announced loading text." },
        { name: "loadingFallback", type: "ReactNode", description: "Replaces the spinner, e.g. skeletons." },
        { name: "emptyState", type: "ReactNode", description: "Replaces the default EmptyState." },
        { name: "emptyTitle / emptyDescription / emptyIcon / emptyAction", type: "ReactNode", default: '"Nothing here yet"', description: "Default EmptyState content." },
        { name: "className", type: "string", description: "Class for the loading, error and empty wrappers." },
      ],
    },
  ],
  a11y: [
    'Loading renders a role="status" region with the label, also when a skeleton fallback is used (the fallback container gets aria-busy).',
    'Errors use ErrorAlert: role="alert" for danger, role="status" for warnings such as 429.',
    "Content stays mounted during background refetches, so focus and scroll position are not lost.",
  ],
};

export default doc;
