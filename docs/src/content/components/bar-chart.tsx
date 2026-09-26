import { BarChart } from "@/registry/bitop/ui/bar-chart/bar-chart";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { type ComponentDoc, examples } from "../types";
import raw from "./bar-chart.tsx?raw";

const visits = [42, 58, 51, 77, 96, 64, 38, 45, 70, 88, 91, 73, 40, 36].map((views, i) => ({
  label: `2026-09-${String(i + 1).padStart(2, "0")}`,
  values: { views, signups: Math.round(views * 0.3) },
}));

export function Daily() {
  const total = visits.reduce((sum, d) => sum + d.values.views, 0);
  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <BarChart
        data={visits}
        series={[
          { key: "views", label: "Views", tone: "info" },
          { key: "signups", label: "Sign-ups" },
        ]}
        summary={`Views per day, 1 to 14 September: ${total} in total, most on 5 September (96).`}
      />
      <Table caption="Views and sign-ups per day" columns={["Day", { label: "Views", numeric: true }, { label: "Sign-ups", numeric: true }]} maxHeight="10rem" stickyHeader>
        {visits.map((d) => (
          <Tr key={d.label}>
            <Td>{d.label}</Td>
            <Td numeric>{d.values.views}</Td>
            <Td numeric>{d.values.signups}</Td>
          </Tr>
        ))}
      </Table>
    </div>
  );
}

export function Stacked() {
  const weeks = [
    { label: "Week 36", values: { web: 310, api: 120, widget: 40 } },
    { label: "Week 37", values: { web: 280, api: 160, widget: 75 } },
    { label: "Week 38", values: { web: 350, api: 150, widget: 110 } },
    { label: "Week 39", values: { web: 330, api: 190, widget: 160 } },
  ];
  return (
    <BarChart
      layout="stack"
      size="sm"
      data={weeks}
      series={[
        { key: "web", label: "Web" },
        { key: "api", label: "API", tone: "info" },
        { key: "widget", label: "Widget", tone: "success" },
      ]}
      summary="Requests per week by channel: widget use grew from 40 to 160 while web stayed near 300."
    />
  );
}

const doc: ComponentDoc = {
  slug: "bar-chart",
  title: "Bar chart",
  category: "Display",
  description: "A lightweight bar chart drawn with CSS, for dashboards: overlapping or stacked series, a legend and a peak line. No chart library.",
  imports: `import { BarChart } from "@/components/ui/bar-chart/bar-chart";`,
  examples: examples(raw, [
    ["Daily", Daily, { title: "Daily series with a data table", wide: true }],
    ["Stacked", Stacked, { title: "Stacked series", wide: true }],
  ]),
  props: [
    {
      component: "BarChart",
      rows: [
        { name: "data", type: "{ label: string; values: Record<K, number> }[]", required: true, description: "One point per bar slot, in order." },
        { name: "series", type: "{ key: K; label: ReactNode; tone? }[]", required: true, description: "The series to draw; tone is primary, info, success, warning, danger or neutral." },
        { name: "summary", type: "string", required: true, description: "The chart's text alternative: what it shows and its main finding." },
        { name: "layout", type: '"overlap" | "stack"', default: '"overlap"', description: "Overlap draws series back to front (largest first); stack adds them up." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Plot height." },
        { name: "formatValue", type: "(value: number) => string", description: "Formats the peak label and hover titles." },
        { name: "legend", type: "boolean", default: "true", description: "Show the legend." },
        { name: "axis", type: "boolean", default: "true", description: "Show the first and last labels and the peak value." },
      ],
    },
  ],
  a11y: [
    'The plot is one image (role="img") named by summary; bars are not announced one by one.',
    "Pair the chart with a table of the same data (as in the first example) so every value is available as text.",
    "The legend is a plain list, so series names are readable; colours are never the only way to tell series apart when a table is present.",
  ],
};

export default doc;
