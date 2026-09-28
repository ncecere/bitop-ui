import { ChartData, ChartLegend, type ChartTone } from "@/registry/bitop/ui/chart/chart";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./chart.tsx?raw";

export function Tones() {
  const tones: ChartTone[] = ["primary", "info", "success", "warning", "danger", "neutral"];
  return (
    <Stack gap={3}>
      <ChartLegend series={tones.map((t) => ({ key: t, label: t, tone: t }))} />
      <ChartLegend swatch="line" series={tones.slice(0, 3).map((t) => ({ key: t, label: `${t} line`, tone: t }))} />
    </Stack>
  );
}

export function ShowData() {
  const days = [
    { label: "Sep 1", values: { answers: 61, conversations: 26 } },
    { label: "Sep 2", values: { answers: 58, conversations: 24 } },
    { label: "Sep 3", values: { answers: 70, conversations: 29 } },
  ];
  return (
    <ChartData
      caption="Answers and conversations per day"
      series={[
        { key: "answers", label: "Answers" },
        { key: "conversations", label: "Conversations" },
      ]}
      data={days}
      defaultOpen
    />
  );
}

const doc: ComponentDoc = {
  slug: "chart",
  title: "Chart",
  category: "Display",
  description:
    "The pieces Bar chart, Line chart and Sparkline share: series colours from the --color-chart-* tokens, a legend with line patterns, and a “Show data” table disclosure. Use them to build other charts.",
  imports: `import { ChartData, ChartLegend, chartToneClass, seriesTone } from "@/components/ui/chart/chart";`,
  examples: examples(raw, [
    ["Tones", Tones, { title: "Series tones and legend swatches", wide: true }],
    ["ShowData", ShowData, { title: "“Show data” table", wide: true }],
  ]),
  props: [
    {
      component: "ChartLegend",
      rows: [
        { name: "series", type: "{ key; label; tone?; pattern? }[]", required: true, description: "Series in order; tones default to primary, info, success…" },
        { name: "swatch", type: '"square" | "line"', default: '"square"', description: "Square (bars, areas) or a short stroke in the series' pattern (lines)." },
      ],
    },
    {
      component: "ChartData",
      rows: [
        { name: "caption", type: "string", required: true, description: "Names the table." },
        { name: "series / data", type: "ChartSeries[] / ChartPoint[]", required: true, description: "Same shapes as the charts." },
        { name: "labelHeader", type: "ReactNode", default: '"Date"', description: "Header of the label column." },
        { name: "formatValue", type: "(n) => string", description: "Formats the numbers." },
        { name: "toggleLabel", type: "ReactNode", default: '"Show data"', description: "Disclosure text." },
        { name: "missingLabel", type: "string", default: '"No data"', description: "Cell text for NaN / ±Infinity values." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean", description: "Controlled or uncontrolled." },
      ],
    },
    {
      component: "Helpers",
      rows: [
        { name: "chartToneClass", type: "string", description: "Class that sets --chart-color from data-tone on the same element." },
        { name: "seriesTone(series, i) / seriesPattern(series, i)", type: "ChartTone / ChartPattern", description: "A series' tone and line pattern, with defaults by position." },
        { name: "chartTones", type: "ChartTone[]", description: "Default tone order." },
        { name: "chartValue(point, key) / chartRuns(values)", type: "number | null / [index, value][][]", description: "A point's value (null for NaN / ±Infinity, 0 for a missing key), and the runs of points with data (one line per run)." },
      ],
    },
  ],
  a11y: [
    "Tokens --color-chart-primary … --color-chart-neutral are >= 3:1 on surface and background in light and dark mode (tests/contrast.test.ts). In the uf theme the first two series are UF blue and orange.",
    "Line swatches repeat the series' dash pattern, so series differ by more than hue.",
    "ChartData is a Disclosure (button with aria-expanded) around a captioned table with row headers.",
  ],
};

export default doc;
