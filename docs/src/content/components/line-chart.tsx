import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
import { type ComponentDoc, examples } from "../types";
import raw from "./line-chart.tsx?raw";

const days = [61, 58, 70, 66, 74, 52, 49, 77, 83, 80, 88, 91, 69, 96].map((answers, i) => ({
  label: `Sep ${i + 1}`,
  values: { answers, conversations: Math.round(answers * 0.42), flagged: i % 5 === 2 ? 3 : 1 },
}));

export function AnswersPerDay() {
  const total = days.reduce((sum, d) => sum + d.values.answers, 0);
  return (
    <LineChart
      data={days}
      series={[
        { key: "answers", label: "Answers" },
        { key: "conversations", label: "Conversations", tone: "info" },
      ]}
      summary={`Answers per day, 1 to 14 September: ${total.toLocaleString()} in total, rising from 61 to 96; conversations follow at about 40%.`}
      dataTable={{ caption: "Answers and conversations per day" }}
    />
  );
}

export function Area() {
  const signIns = [120, 134, 128, 150, 162, 90, 84, 170, 176, 181, 169, 190, 102, 95].map((v, i) => ({ label: `Sep ${i + 1}`, values: { signIns: v } }));
  return (
    <LineChart
      variant="area"
      size="sm"
      data={signIns}
      series={[{ key: "signIns", label: "Sign-ins", tone: "success" }]}
      legend={false}
      summary="Sign-ins per day, 1 to 14 September: weekday peaks up to 190, weekend dips to about 85."
    />
  );
}

export function ThreeSeries() {
  return (
    <LineChart
      size="lg"
      points
      data={days.slice(0, 7)}
      series={[
        { key: "answers", label: "Answers" },
        { key: "conversations", label: "Conversations", tone: "info" },
        { key: "flagged", label: "Flagged by moderation", tone: "danger" },
      ]}
      summary="First week of September: 440 answers, 185 conversations and 9 flagged messages; flagged messages stayed between 1 and 3 a day."
      formatValue={(v) => v.toLocaleString()}
      dataTable={{ caption: "Daily activity, first week of September" }}
    />
  );
}

const doc: ComponentDoc = {
  slug: "line-chart",
  title: "Line chart",
  category: "Display",
  description:
    "An SVG line or area chart for trends: one or more series, a legend with line patterns, a peak line and an optional “Show data” table. One image with a text summary. No chart library.",
  imports: `import { LineChart } from "@/components/ui/line-chart/line-chart";`,
  examples: examples(raw, [
    ["AnswersPerDay", AnswersPerDay, { title: "Two series with a data table", wide: true }],
    ["Area", Area, { title: "Area, one series, small", wide: true }],
    ["ThreeSeries", ThreeSeries, { title: "Three series with points", description: "Series differ by colour and by line pattern (solid, dashed, dotted).", wide: true }],
  ]),
  props: [
    {
      component: "LineChart",
      note: "Same data shape, tones, legend and data table as BarChart (see Chart). The scale runs from 0 to the largest value.",
      rows: [
        { name: "data", type: "{ label: string; values: Record<K, number> }[]", required: true, description: "Points in order (e.g. days)." },
        { name: "series", type: "{ key: K; label; tone?; pattern? }[]", required: true, description: "Lines to draw; pattern defaults to solid, dashed, dotted by position." },
        { name: "summary", type: "string", required: true, description: "Text alternative: range, total, trend and extremes." },
        { name: "variant", type: '"line" | "area"', default: '"line"', description: "Strokes only, or strokes over a soft fill." },
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Plot height (6, 10 or 14rem), as in BarChart." },
        { name: "points", type: "boolean", default: "only with one point", description: "Mark every point with a dot." },
        { name: "formatValue", type: "(n) => string", description: "Peak label, hover titles and table values." },
        { name: "legend / axis", type: "boolean", default: "true", description: "Legend; first/last labels and peak value." },
        { name: "dataTable", type: "{ caption; labelHeader?; defaultOpen? }", description: "Adds a “Show data” disclosure with the values in a table." },
      ],
    },
  ],
  a11y: [
    'The plot is one image (role="img") named by summary; the SVG inside is hidden from assistive technology.',
    "dataTable adds a “Show data” disclosure with every value in a table with row and column headers.",
    "Series colours are >= 3:1 against the background in every theme and also differ by line pattern, which the legend swatches show.",
    "Hovering a column shows that point's values in a title tooltip (mouse only; the table is the accessible route).",
  ],
};

export default doc;
