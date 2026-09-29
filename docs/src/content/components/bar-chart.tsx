import { BarChart } from "@/registry/bitop/ui/bar-chart/bar-chart";
import { type ComponentDoc, examples } from "../types";
import raw from "./bar-chart.tsx?raw";

const visits = [42, 58, 51, 77, 96, 64, 38, 45, 70, 88, 91, 73, 40, 36].map((views, i) => ({
  label: `2026-09-${String(i + 1).padStart(2, "0")}`,
  values: { views, signups: Math.round(views * 0.3) },
}));

export function Daily() {
  const total = visits.reduce((sum, d) => sum + d.values.views, 0);
  return (
    <BarChart
      data={visits}
      series={[
        { key: "views", label: "Views", tone: "info" },
        { key: "signups", label: "Sign-ups" },
      ]}
      summary={`Views per day, 1 to 14 September: ${total} in total, most on 5 September (96).`}
      dataTable={{ caption: "Views and sign-ups per day", labelHeader: "Day" }}
    />
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
  description: "A lightweight bar chart drawn with CSS, for dashboards: overlapping or stacked series, a legend, a peak line and a “Show data” table. Shares colours and legend with Line chart. No chart library.",
  imports: `import { BarChart } from "@/components/ui/bar-chart/bar-chart";`,
  examples: examples(raw, [
    ["Daily", Daily, { title: "Daily series with a data table", description: "dataTable adds a “Show data” disclosure with the numbers.", wide: true }],
    ["Stacked", Stacked, { title: "Stacked series", wide: true }],
  ]),
  props: [
    {
      component: "BarChart",
      rows: [
        { name: "data", type: "{ label: string; values: Record<K, number> }[]", required: true, description: "One point per bar slot, in order. Negative values draw as 0; NaN / ±Infinity are no data (empty slot, left out of the scale). Labels may repeat." },
        { name: "series", type: "{ key: K; label: ReactNode; tone? }[]", required: true, description: "The series to draw; tone is primary, info, success, warning, danger or neutral." },
        { name: "summary", type: "string", required: true, description: "The chart's text alternative: what it shows and its main finding." },
        { name: "layout", type: '"overlap" | "stack"', default: '"overlap"', description: "Overlap draws series back to front (largest first); stack adds them up." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Plot height." },
        { name: "formatValue", type: "(value: number) => string", description: "Formats the peak label and hover titles." },
        { name: "legend", type: "boolean", default: "true", description: "Show the legend." },
        { name: "axis", type: "boolean", default: "true", description: "Show the first and last labels and the peak value." },
        { name: "domain", type: "{ max?: number }", description: "Fixes the top of the scale (e.g. 100 for a percentage); values above it draw full height, stacks are cut there." },
        { name: "dataTable", type: "{ caption; labelHeader?; defaultOpen? }", description: "Adds a “Show data” disclosure with the values in a table (ChartData from chart)." },
      ],
      note: "Series colours come from the --color-chart-* tokens and the legend from chart, shared with LineChart and Sparkline.",
    },
  ],
  a11y: [
    'The plot is one image (role="img") named by summary; bars are not announced one by one.',
    "dataTable adds a “Show data” disclosure with every value in a real table (or render your own table next to the chart).",
    "The legend is a plain list, so series names are readable; series colours are >= 3:1 against the background in every theme, and the data table names every value.",
    "In the overlap layout the back series is drawn in a paler token (--color-chart-*-soft), not with opacity, so it stays >= 3:1 and differs from the front series by lightness as well as hue.",
  ],
};

export default doc;
