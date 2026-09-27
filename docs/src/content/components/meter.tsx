import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Meter } from "@/registry/bitop/ui/meter/meter";
import { type ComponentDoc, examples } from "../types";
import raw from "./meter.tsx?raw";

export function TeamUsage() {
  const usage = [
    { label: "Storage", value: 9.4, max: 10, format: (v: number) => `${v.toLocaleString()} GB` },
    { label: "Documents", value: 4_120, max: 5_000 },
    { label: "Queries today", value: 1_020, max: 1_000, description: "Resets at midnight UTC." },
    { label: "Knowledge bases", value: 3, max: 20 },
  ];
  // Sort by % used so what needs attention comes first.
  const sorted = [...usage].sort((a, b) => b.value / b.max - a.value / a.max);
  return (
    <Stack gap={5}>
      {sorted.map((u) => (
        <Meter key={u.label} label={u.label} value={u.value} max={u.max} formatValue={u.format} description={u.description} />
      ))}
    </Stack>
  );
}

export function LimitMarker() {
  return (
    <Stack gap={5}>
      <Meter
        label="Pages crawled this month"
        value={3_400}
        max={10_000}
        marker={{ value: 5_000, label: "Team limit" }}
        description="The platform ceiling is 10,000."
      />
      <Meter label="Agents" value={12} max={null} />
    </Stack>
  );
}

export function CustomThresholds() {
  return (
    <Stack gap={5}>
      <Meter label="Tokens today (warn at 50%)" value={620_000} max={1_000_000} warningAt={0.5} criticalAt={0.9} size="sm" />
      <Meter label="Seats" value={18} max={25} valueText="18 of 25 seats" size="sm" />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "meter",
  title: "Meter",
  category: "Feedback",
  description:
    "Usage against a limit (role=meter): “X of Y” text, warning and critical tones at 80% and 100% (configurable) that are also spelled out, and an optional limit marker.",
  imports: `import { Meter } from "@/components/ui/meter/meter";`,
  baseUi: { name: "Meter", href: "https://base-ui.com/react/components/meter" },
  examples: examples(raw, [
    ["TeamUsage", TeamUsage, { title: "Usage and limits, sorted by % used", wide: true }],
    ["LimitMarker", LimitMarker, { title: "Limit marker and no limit", wide: true }],
    ["CustomThresholds", CustomThresholds, { title: "Custom thresholds and text", wide: true }],
  ]),
  props: [
    {
      component: "Meter",
      note: "Use Progress for a task that completes; Meter for an amount within a range. meterLevel(value, max, warningAt, criticalAt) is exported for sorting and badges.",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label and accessible name." },
        { name: "value", type: "number", required: true, description: "Current usage (may exceed max)." },
        { name: "max", type: "number | null", required: true, description: "The limit; null shows “No limit” and no bar." },
        { name: "min", type: "number", default: "0", description: "Start of the range." },
        { name: "warningAt / criticalAt", type: "number", default: "0.8 / 1", description: "Fractions of max where the warning and critical tones start." },
        { name: "marker", type: "{ value, label }", description: "A tick on the track, described under the bar (“Team limit: 5,000”)." },
        { name: "formatValue", type: "(n) => string", default: "toLocaleString", description: "Formats value, max and marker." },
        { name: "valueText", type: "string", description: "Replaces “X of Y”, visible and announced." },
        { name: "showStatus", type: "boolean", default: "true", description: "Show “Near limit” / “At limit” / “Over limit” with an icon." },
        { name: "description", type: "ReactNode", description: "Muted text under the bar." },
        { name: "hideLabel / size", type: 'boolean / "sm" | "md"', description: "Visually hide the label / bar thickness." },
        { name: "labels", type: "Partial<MeterLabels>", description: "Translate “of”, the status words and “No limit”." },
      ],
    },
  ],
  a11y: [
    'role="meter" (Base UI Meter) with aria-valuemin/max/now, named by the visible label.',
    "aria-valuetext carries the real numbers and the status (“1,020 of 1,000, over limit”), even though the bar stops at full.",
    "Tones are never colour-only: the status word and an icon appear at warning and above.",
    "The limit marker is decorative; its meaning is written under the bar and linked with aria-describedby.",
  ],
};

export default doc;
