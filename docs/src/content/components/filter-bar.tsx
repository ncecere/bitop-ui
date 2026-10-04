import { useMemo, useState } from "react";
import {
  type Facet,
  FilterBar,
  type FilterValues,
  facetCounts,
  filterRows,
  filterValuesFromSearchParams,
  filterValuesToSearchParams,
} from "@/registry/bitop/ui/filter-bar/filter-bar";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./filter-bar.tsx?raw";

export function AuditLogFilters() {
  type Entry = { id: number; action: string; actor: string; channel: string; at: Date };
  const people = ["Alex Dev", "Sam Admin", "Riley Editor", "Jordan Owner"];
  const actions = ["agent.publish", "source.sync", "member.add", "key.create", "auth.login"];
  const entries: Entry[] = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    action: actions[(i * 3) % actions.length]!,
    actor: people[i % people.length]!,
    channel: i % 4 === 0 ? "api" : "web",
    at: new Date(Date.now() - i * 20 * 3600_000),
  }));
  const facets: Facet<Entry>[] = [
    {
      id: "channel",
      label: "Channel",
      type: "toggle",
      allLabel: "All",
      accessor: (e) => e.channel,
      options: [
        { value: "web", label: "Web" },
        { value: "api", label: "API" },
      ],
    },
    { id: "actor", label: "Person", type: "select", placeholder: "Anyone", accessor: (e) => e.actor, options: people.map((p) => ({ value: p, label: p })) },
    {
      id: "action",
      label: "Action",
      type: "select",
      multiple: true,
      accessor: (e) => e.action,
      options: actions.map((a) => ({ value: a, label: a, group: a.split(".")[0] })),
    },
    { id: "at", label: "When", type: "date-range", accessor: (e) => e.at, pickerProps: { max: new Date() } },
  ];
  // The filters live in the URL: read them once, write them on every change.
  const [query, setQuery] = useState("channel=web&at=30d");
  const filters = useMemo(() => filterValuesFromSearchParams(facets, query), [query]);
  const setFilters = (next: FilterValues) => setQuery(filterValuesToSearchParams(facets, next, query).toString());
  const shown = filterRows(entries, facets, filters);
  return (
    <Stack gap={3}>
      <FilterBar facets={facets} value={filters} onValueChange={setFilters} counts={facetCounts(entries, facets, filters)} />
      <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-muted)" }}>
        {shown.length} of {entries.length} entries · URL: <code>?{query}</code>
      </p>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "filter-bar",
  title: "Filter bar",
  category: "Forms",
  description:
    "Faceted filters above a list: toggle groups, comboboxes and date-range presets, with option counts, active-filter chips and Clear all. Facets are data, with helpers to filter, count and sync to the URL.",
  imports: `import { FilterBar, type Facet, facetCounts, filterRows, filterValuesFromSearchParams, filterValuesToSearchParams } from "@/components/ui/filter-bar/filter-bar";`,
  examples: examples(raw, [
    [
      "AuditLogFilters",
      AuditLogFilters,
      {
        title: "Audit log filters, kept in the URL",
        description: "DataTable takes the same facets (see Data table); this is the standalone bar for other lists. Channel, a single-choice toggle, has no chip: its pressed item shows the choice.",
        wide: true,
      },
    ],
  ]),
  props: [
    {
      component: "FilterBar<T>",
      rows: [
        { name: "facets", type: "Facet<T>[]", required: true, description: "Toggle, select or date-range facets (below)." },
        { name: "value / defaultValue / onValueChange", type: "FilterValues", description: "{ [facetId]: string[] | { preset, range } }; missing or empty = no filter." },
        { name: "counts", type: "{ [facetId]: { [option]: number } }", description: "Shown in toggles (“Failed 3”) and as combobox hints. facetCounts() computes them in memory." },
        { name: "start / end", type: "ReactNode", description: "Content before / after the facets (e.g. search, Export)." },
        { name: "chips", type: "boolean", default: "true", description: "Active-filter chips and Clear all (per facet, see chip below)." },
        { name: "search", type: "{ value, onClear, label? }", description: 'The text of a search box in start: a chip ("Search: wifi") while not empty, cleared by its chip and by Clear all. DataTable passes it.' },
        { name: "size", type: '"sm" | "md"', default: '"sm"', description: "Control size." },
        { name: "labels", type: "Partial<FilterBarLabels>", description: "Translate the group name, chip text and Clear all." },
      ],
    },
    {
      component: "Facet<T>",
      rows: [
        { name: "{ id, label }", type: "string", required: true, description: "Key in the value (and URL parameter name) and visible label." },
        { name: 'type: "toggle"', type: "options, multiple?, allLabel?, accessor?", description: "A joined ToggleGroup; allLabel adds an “All” item that clears the facet." },
        { name: 'type: "select"', type: "options, multiple?, placeholder?, accessor?", description: "A Combobox for long lists (people, agents); options may have a group." },
        { name: 'type: "date-range"', type: "presets?, allowCustom?, pickerProps?, accessor?", description: "DateRangePresets: Today / 7 / 30 / 90 days / Custom. Custom opens a range picker; it filters once a range is picked. Ranges cover whole local days." },
        { name: "accessor", type: "(row) => value(s) or date", description: "Used by filterRows and facetCounts (and DataTable's in-memory filtering)." },
        {
          name: "chip",
          type: "boolean",
          default: "true, except single-choice toggles",
          description: "A chip while the facet is active. A single-choice toggle has none by default: its pressed item already shows the choice (“All” clears it).",
        },
      ],
    },
    {
      component: "Helpers",
      rows: [
        { name: "filterRows(rows, facets, values)", type: "T[]", description: "Rows passing every active facet." },
        { name: "facetCounts(rows, facets, values)", type: "FacetCounts", description: "Per option, rows matching the other facets." },
        { name: "filterValuesToSearchParams(facets, values, params?)", type: "URLSearchParams", description: "Repeated params per option, a date range as its preset id or from/to; keeps other params." },
        { name: "filterValuesFromSearchParams(facets, params)", type: "FilterValues", description: "Reads them back; unknown options and bad dates are dropped." },
        { name: "activeFilterCount(values) / isFacetActive(value)", type: "number / boolean", description: "For badges such as “Filters (2)”." },
      ],
    },
  ],
  a11y: [
    "The bar is a group named “Filters”. Each facet is labelled by its visible label (toggle groups via aria-labelledby).",
    "Counts are read after the option with a pause (“Failed, 3”).",
    "Active filters are a list of buttons named “Remove filter Person: Alex Dev”. After removing one, focus moves to the next chip, then Clear all, then the first control, never to the page body.",
    "Announce the result count in the list or table (DataTable does this politely).",
  ],
};

export default doc;
