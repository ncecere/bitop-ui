import { useState } from "react";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { Slider } from "@/registry/bitop/ui/slider/slider";
import { type ComponentDoc, examples } from "../types";
import raw from "./slider.tsx?raw";

export function Single() {
  return (
    <Stack gap={6}>
      <Slider label="Temperature" defaultValue={0.7} min={0} max={2} step={0.1} showValue />
      <Slider
        label="Opacity"
        defaultValue={80}
        step={5}
        showValue
        formatValue={(_, values) => `${values[0]}%`}
        getAriaValueText={(_, value) => `${value} percent`}
        size="sm"
      />
      <Slider aria-label="Volume" defaultValue={40} disabled />
    </Stack>
  );
}

export function Range() {
  const [price, setPrice] = useState<number[]>([40, 160]);
  return (
    <Slider
      label="Price"
      value={price}
      onValueChange={(v) => setPrice(v as number[])}
      min={0}
      max={250}
      step={5}
      minStepsBetweenValues={2}
      thumbLabels={["Minimum price", "Maximum price"]}
      showValue
      format={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
    />
  );
}

export function Vertical() {
  return (
    <Inline gap={8} wrap={false}>
      <Slider aria-label="Bass" defaultValue={60} orientation="vertical" />
      <Slider aria-label="Mid" defaultValue={45} orientation="vertical" />
      <Slider aria-label="Treble" defaultValue={70} orientation="vertical" />
    </Inline>
  );
}

const doc: ComponentDoc = {
  slug: "slider",
  title: "Slider",
  category: "Forms",
  description:
    "Pick a number, or a range, by dragging or with the keyboard. Every slider needs a name: a visible label, an aria-label, or one label per thumb.",
  imports: `import { Slider } from "@/components/ui/slider/slider";`,
  baseUi: { name: "Slider", href: "https://base-ui.com/react/components/slider" },
  examples: examples(raw, [
    ["Single", Single, { title: "Labels, value readout and sizes", wide: true }],
    ["Range", Range, { title: "Range with per-thumb names", wide: true }],
    ["Vertical", Vertical, { title: "Vertical" }],
  ]),
  props: [
    {
      component: "Slider",
      note: "Also accepts Base UI Slider.Root props (value, defaultValue, onValueChange, onValueCommitted, min, max, step, largeStep, minStepsBetweenValues, format, name, disabled…). A number is a single slider; an array is a range.",
      rows: [
        { name: "label", type: "ReactNode", description: "Visible label. One of label, aria-label or thumbLabels is required." },
        { name: "aria-label", type: "string", description: "Accessible name when there is no visible label." },
        { name: "thumbLabels", type: "string[]", description: 'One name per thumb, e.g. ["Minimum price", "Maximum price"].' },
        { name: "hideLabel", type: "boolean", description: "Keep the label for assistive technology only." },
        { name: "showValue", type: "boolean", default: "false", description: "Show the current value(s) next to the label." },
        { name: "formatValue", type: "(formatted, values) => ReactNode", description: "Custom readout." },
        { name: "getAriaValueText", type: "(formatted, value, index) => string", description: "Spoken value, e.g. \"40 percent\"." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout and arrow-key direction." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Track and thumb size." },
      ],
    },
  ],
  a11y: [
    'Each thumb is a native <input type="range"> (role="slider") with aria-valuenow, min and max; forms submit it by name.',
    "Arrow keys step, Page Up/Page Down and Shift+Arrow move by largeStep, Home/End jump to min/max.",
    'A visible label names a single thumb; range thumbs get their own names (thumbLabels, or "<label> minimum/maximum").',
    "The track and thumb ring meet 3:1 against the surface; focus adds a separate ring.",
  ],
};

export default doc;
