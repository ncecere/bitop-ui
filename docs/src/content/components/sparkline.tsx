import { FileText, MessagesSquare, ShieldAlert } from "lucide-react";
import { Sparkline } from "@/registry/bitop/ui/sparkline/sparkline";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";
import { Table, Td, Th, Tr } from "@/registry/bitop/ui/table/table";
import { type ComponentDoc, examples } from "../types";
import raw from "./sparkline.tsx?raw";

const answers = [61, 58, 70, 66, 74, 52, 49, 77, 83, 80, 88, 91, 69, 96];

export function InStatCards() {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
      <StatCard
        label="Answers"
        value="1,014"
        icon={<MessagesSquare />}
        delta={{ value: "18%", trend: "up", label: "vs last 14 days" }}
        chart={<Sparkline values={answers} variant="area" label="Answers per day, last 14 days: rising from 61 to 96" />}
      />
      <StatCard
        label="Documents"
        value="3,210"
        icon={<FileText />}
        chart={<Sparkline values={[3020, 3050, 3090, 3100, 3150, 3190, 3210]} tone="info" label="Documents over the last 7 days: up from 3,020 to 3,210" />}
      />
      <StatCard
        label="Flagged messages"
        value="9"
        icon={<ShieldAlert />}
        delta={{ value: "3", trend: "up", sentiment: "negative" }}
        chart={<Sparkline values={[1, 0, 2, 1, 1, 3, 1]} tone="danger" label="Flagged messages per day, last 7 days: between 0 and 3" />}
      />
    </div>
  );
}

export function InATable() {
  const agents = [
    { name: "Support agent", trend: [12, 18, 15, 22, 30, 28, 35], total: 160 },
    { name: "Registrar FAQ", trend: [40, 38, 35, 30, 26, 22, 20], total: 211 },
    { name: "Library helper", trend: [5, 6, 5, 7, 6, 6, 7], total: 42 },
  ];
  return (
    <Table caption="Answers per agent, last 7 days" columns={["Agent", "Trend", { label: "Answers", numeric: true }]}>
      {agents.map((a) => (
        <Tr key={a.name}>
          <Th>{a.name}</Th>
          <Td style={{ width: "9rem" }}>
            <Sparkline values={a.trend} size="sm" baseline="min" label={`${a.name}: from ${a.trend[0]} to ${a.trend[a.trend.length - 1]} a day`} />
          </Td>
          <Td numeric>{a.total}</Td>
        </Tr>
      ))}
    </Table>
  );
}

const doc: ComponentDoc = {
  slug: "sparkline",
  title: "Sparkline",
  category: "Display",
  description: "A tiny inline SVG trend with no axes, for stat cards and table cells. One image named by its label; same colours as the charts.",
  imports: `import { Sparkline } from "@/components/ui/sparkline/sparkline";`,
  examples: examples(raw, [
    ["InStatCards", InStatCards, { title: "In stat cards (the chart slot)", wide: true }],
    ["InATable", InATable, { title: "In a table", description: "baseline=\"min\" exaggerates small changes; say so in the numbers next to it.", wide: true }],
  ]),
  props: [
    {
      component: "Sparkline",
      note: "Also accepts <span> props. Width follows the container.",
      rows: [
        { name: "values", type: "number[]", required: true, description: "Values in order, oldest first. NaN / ±Infinity leave a gap and are left out of the scale." },
        { name: "label", type: "string", required: true, description: "Text alternative: what the trend is. Omit only with decorative." },
        { name: "decorative", type: "boolean", description: "Hide from assistive technology when the trend is written out next to it." },
        { name: "variant", type: '"line" | "area"', default: '"line"', description: "Stroke, or stroke over a soft fill." },
        { name: "tone", type: '"primary" | "info" | "success" | "warning" | "danger" | "neutral"', default: '"primary"', description: "Colour (the --color-chart-* tokens)." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "1.5rem or 2.5rem tall." },
        { name: "showLast", type: "boolean", default: "true", description: "Mark the last point." },
        { name: "baseline", type: '"zero" | "min"', default: '"zero"', description: "Scale from 0 or from the smallest value." },
      ],
    },
  ],
  a11y: [
    'role="img" named by label (required unless decorative); the SVG is hidden.',
    "The line colour is >= 3:1 against the background in every theme.",
    "In a StatCard's chart slot the sparkline is part of the card's <dl>, after the value.",
  ],
};

export default doc;
