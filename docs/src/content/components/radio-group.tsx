import { useState } from "react";
import { RadioGroup } from "@/registry/bitop/ui/radio-group/radio-group";
import { type ComponentDoc, examples } from "../types";
import raw from "./radio-group.tsx?raw";

export function Default() {
  return (
    <RadioGroup
      legend="Build strategy"
      defaultValue="incremental"
      options={[
        { value: "incremental", label: "Incremental", description: "Reuse the cache from the last build." },
        { value: "clean", label: "Clean", description: "Start from an empty cache." },
        { value: "manual", label: "Manual", disabled: true },
      ]}
    />
  );
}

export function Cards() {
  const [plan, setPlan] = useState("pro");
  return (
    <RadioGroup
      legend="Plan"
      variant="card"
      value={plan}
      onValueChange={setPlan}
      options={[
        { value: "hobby", label: "Hobby", description: "For personal projects." },
        { value: "pro", label: "Pro", description: "For teams shipping to production." },
      ]}
    />
  );
}

const doc: ComponentDoc = {
  slug: "radio-group",
  title: "Radio group",
  category: "Forms",
  description: "A labelled group of radio buttons with descriptions, in a default list or selectable cards.",
  imports: `import { RadioGroup } from "@/components/ui/radio-group/radio-group";`,
  baseUi: { name: "Radio Group", href: "https://base-ui.com/react/components/radio" },
  examples: examples(raw, [
    ["Default", Default, { title: "Default" }],
    ["Cards", Cards, { title: "Cards" }],
  ]),
  props: [
    {
      component: "RadioGroup",
      note: "Also accepts Base UI RadioGroup props (value, defaultValue, name, disabled…).",
      rows: [
        { name: "legend", type: "ReactNode", required: true, description: "Group label." },
        { name: "options", type: "{ value, label, description?, disabled? }[]", required: true, description: "The choices." },
        { name: "onValueChange", type: "(value: V) => void", description: "Called with the new value." },
        { name: "description / error", type: "ReactNode", description: "Help text / error (marks the group invalid)." },
        { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Layout." },
        { name: "variant", type: '"default" | "card"', default: '"default"', description: "Card renders selectable tiles." },
      ],
    },
  ],
  a11y: [
    "A fieldset with a legend and role=\"radiogroup\"; arrow keys move the selection, Tab leaves the group.",
    "Each option's description is attached with aria-describedby.",
    "The radio ring meets 3:1 against its background.",
  ],
};

export default doc;
