import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Switch } from "@/registry/bitop/ui/switch/switch";
import { type ComponentDoc, examples } from "../types";
import raw from "./switch.tsx?raw";

export function Settings() {
  return (
    <Stack gap={4}>
      <Switch label="Preview deployments" description="Build every pull request." defaultChecked />
      <Switch label="Settings-row layout" labelPosition="start" />
      <Switch label="Disabled" disabled />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "switch",
  title: "Switch",
  category: "Forms",
  description: "An on/off switch with a required label, an optional description and a settings-row layout.",
  imports: `import { Switch } from "@/components/ui/switch/switch";`,
  baseUi: { name: "Switch", href: "https://base-ui.com/react/components/switch" },
  examples: examples(raw, [["Settings", Settings, { title: "Switches" }]]),
  props: [
    {
      component: "Switch",
      note: "Also accepts Base UI Switch.Root props (checked, defaultChecked, onCheckedChange, name…).",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label and accessible name." },
        { name: "description", type: "ReactNode", description: "Help text (aria-describedby)." },
        { name: "labelPosition", type: '"start" | "end"', default: '"end"', description: "Label before or after the switch." },
      ],
    },
  ],
  a11y: ['role="switch" with aria-checked; Space toggles it.', "The track boundary meets 3:1 in both states."],
};

export default doc;
