import { Activity, FileText, Globe, Rocket, Timer } from "lucide-react";
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

export function Linked() {
  return (
    <div style={{ display: "grid", gap: "var(--space-4)", gridTemplateColumns: "repeat(auto-fit, minmax(13rem, 1fr))" }}>
      <StatCard label="Deployments" value="1,284" icon={<Rocket />} href="#deployments" hint="Open the deployment list" />
      <StatCard
        label="Documents"
        value="3,210"
        icon={<FileText />}
        href="#documents"
        details={
          <ul style={{ margin: 0, paddingInlineStart: "var(--space-4)" }}>
            <li>3,150 ready</li>
            <li>48 in progress</li>
            <li>12 failed</li>
          </ul>
        }
      />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "stat-card",
  title: "Stat card",
  category: "Display",
  description: "A metric with an icon, a change indicator and a footnote. Numbers use tabular figures.",
  imports: `import { StatCard } from "@/components/ui/stat-card/stat-card";`,
  examples: examples(raw, [
    ["Metrics", Metrics, { title: "Dashboard metrics", wide: true }],
    ["Linked", Linked, { title: "Linked cards with details", wide: true }],
  ]),
  props: [
    {
      component: "StatCard",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "What is measured." },
        { name: "value", type: "ReactNode", required: true, description: "The headline number." },
        { name: "delta", type: "{ value, trend: up|down|flat, sentiment?, label? }", description: "Change indicator; up is positive unless sentiment says otherwise." },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
        { name: "hint", type: "ReactNode", description: "Muted footnote." },
        { name: "details", type: "ReactNode", description: "Block content under the value, such as a breakdown list." },
        { name: "href", type: "string", description: "Makes the whole card a link to this URL." },
        { name: "render", type: "useRender.RenderProp", description: "Makes the whole card a link rendered by another element, e.g. a router <Link>." },
      ],
    },
  ],
  a11y: [
    "Uses <dl> semantics: the label is the term and the value its description.",
    "A linked card is one link named by its label; its hit area is stretched over the card (the <dl> is never nested in the link), and the card shows a focus ring when the link has keyboard focus.", "The trend is spelled out for screen readers (“Increased by 12% vs last week”), not only shown by arrow and colour."],
};

export default doc;
