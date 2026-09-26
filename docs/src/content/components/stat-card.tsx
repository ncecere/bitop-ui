import { Activity, Globe, Rocket, Timer } from "lucide-react";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";
import { type ComponentDoc, examples } from "../types";
import raw from "./stat-card.tsx?raw";

export function Metrics() {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
      <StatCard label="Deployments" value="1,284" icon={<Rocket />} delta={{ value: "12%", trend: "up", label: "vs last week" }} />
      <StatCard label="Visitors" value="94.2K" icon={<Globe />} delta={{ value: "3.1%", trend: "up" }} />
      <StatCard label="Failed builds" value="7" icon={<Activity />} delta={{ value: "2", trend: "down", sentiment: "positive", label: "fewer" }} />
      <StatCard label="p95 latency" value="182 ms" icon={<Timer />} hint="Edge, last 24h" />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "stat-card",
  title: "Stat card",
  category: "Display",
  description: "A metric with an icon, a change indicator and a footnote. Numbers use tabular figures.",
  imports: `import { StatCard } from "@/components/ui/stat-card/stat-card";`,
  examples: examples(raw, [["Metrics", Metrics, { title: "Dashboard metrics", wide: true }]]),
  props: [
    {
      component: "StatCard",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "What is measured." },
        { name: "value", type: "ReactNode", required: true, description: "The headline number." },
        { name: "delta", type: "{ value, trend: up|down|flat, sentiment?, label? }", description: "Change indicator; up is positive unless sentiment says otherwise." },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
        { name: "hint", type: "ReactNode", description: "Muted footnote." },
      ],
    },
  ],
  a11y: ["Uses <dl> semantics: the label is the term and the value its description.", "The trend is spelled out for screen readers (“Increased by 12% vs last week”), not only shown by arrow and colour."],
};

export default doc;
