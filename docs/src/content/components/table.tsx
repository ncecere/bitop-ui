import { Activity, KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Menu, MenuItem, MenuSeparator } from "@/registry/bitop/ui/menu/menu";
import { Table, TableActions, Td, Tr } from "@/registry/bitop/ui/table/table";
import { Tab, Tabs, TabsList } from "@/registry/bitop/ui/tabs/tabs";
import { type ComponentDoc, examples } from "../types";
import raw from "./table.tsx?raw";

const rows = [
  { name: "marketing-site", status: "Live", builds: 1284, duration: "42s", updated: "Sep 24, 2026" },
  { name: "docs", status: "Building", builds: 311, duration: "1m 8s", updated: "Sep 25, 2026" },
  { name: "dashboard", status: "Live", builds: 9421, duration: "2m 3s", updated: "Sep 20, 2026" },
  { name: "legacy-api", status: "Failed", builds: 88, duration: "12s", updated: "Sep 18, 2026" },
] as const;
const tone = { Live: "success", Building: "info", Failed: "danger" } as const;

export function Projects() {
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  return (
    <Stack gap={3}>
      <Tabs value={density} onValueChange={(v) => setDensity(v as "comfortable" | "compact")}>
        <TabsList variant="pills" aria-label="Table density">
          <Tab value="comfortable">Comfortable</Tab>
          <Tab value="compact">Compact</Tab>
        </TabsList>
      </Tabs>
      <Table
        framed
        caption="Projects"
        density={density}
        stickyHeader
        maxHeight="20rem"
        columns={["Name", "Status", { label: "Builds", numeric: true }, { label: "Duration", numeric: true }, "Updated", ""]}
      >
        {rows.map((r) => (
          <Tr key={r.name}>
            <Td>{r.name}</Td>
            <Td>
              <StatusBadge tone={tone[r.status]} pulse={r.status === "Building"}>
                {r.status}
              </StatusBadge>
            </Td>
            <Td numeric>{r.builds.toLocaleString("en-US")}</Td>
            <Td numeric>{r.duration}</Td>
            <Td muted nowrap>
              {r.updated}
            </Td>
            <Td>
              <TableActions>
                <Menu align="end" trigger={<IconButton size="sm" icon={<MoreHorizontal aria-hidden />} label={`Actions for ${r.name}`} />}>
                  <MenuItem icon={<Pencil aria-hidden />}>Rename</MenuItem>
                  <MenuItem icon={<Activity aria-hidden />}>Redeploy</MenuItem>
                  <MenuSeparator />
                  <MenuItem tone="danger" icon={<Trash2 aria-hidden />}>
                    Delete
                  </MenuItem>
                </Menu>
              </TableActions>
            </Td>
          </Tr>
        ))}
      </Table>
    </Stack>
  );
}

export function Empty() {
  return (
    <Table
      framed
      caption="API tokens"
      columns={["Name", "Prefix", ""]}
      empty={
        <EmptyState
          size="compact"
          icon={<KeyRound />}
          title="No API tokens yet"
          description="Create a token to call the API from CI."
          action={
            <Button size="sm">
              <Plus aria-hidden /> New token
            </Button>
          }
        />
      }
    />
  );
}

const doc: ComponentDoc = {
  slug: "table",
  title: "Table",
  category: "Display",
  description: "A data table with a required caption, sticky header, row hover, numeric alignment, two densities and an empty state.",
  imports: `import { Table, TableActions, Td, Th, Tr } from "@/components/ui/table/table";`,
  examples: examples(raw, [
    ["Projects", Projects, { title: "Sticky header, density and row actions", wide: true }],
    ["Empty", Empty, { title: "Empty state", wide: true }],
  ]),
  props: [
    {
      component: "Table",
      note: "Also accepts native <table> props.",
      rows: [
        { name: "caption", type: "ReactNode", required: true, description: "Names the table (screen-reader only unless showCaption)." },
        { name: "columns", type: "(string | { label, numeric?, hideLabel?, width?, sort? })[]", required: true, description: 'Headers; an empty string becomes a hidden "Actions" header. sort sets aria-sort on the sorted column (see Data table).' },
        { name: "showCaption", type: "boolean", description: "Show the caption visually." },
        { name: "stickyHeader / maxHeight", type: "boolean / string", description: "Scroll the body under a fixed header." },
        { name: "density", type: '"comfortable" | "compact"', default: '"comfortable"', description: "Row height." },
        { name: "empty", type: "ReactNode", description: "Shown in a full-width row instead of children." },
        { name: "framed", type: "boolean", description: "Card-like ring and radius." },
      ],
    },
    {
      component: "Td",
      rows: [
        { name: "numeric", type: "boolean", description: "Right-align with tabular figures." },
        { name: "muted", type: "boolean", description: "Secondary text colour." },
        { name: "nowrap", type: "boolean", description: "Keep on one line." },
      ],
    },
    { component: "Tr", rows: [{ name: "selected", type: "boolean", description: "Selected row styling." }] },
  ],
  a11y: [
    "caption is required by the type, so every table has an accessible name.",
    'Headers are <th scope="col">; an empty column label becomes a visually hidden "Actions".',
    "Whenever the table overflows (too wide for the screen, or taller than maxHeight) the scroll area becomes a focusable region named by the caption, so keyboard users can scroll it; a table that fits is not a tab stop.",
    "While columns are hidden to the side, a shadow on that edge shows the table scrolls (decorative, aria-hidden).",
    "Row action buttons need specific names, e.g. “Actions for marketing-site”.",
  ],
};

export default doc;
