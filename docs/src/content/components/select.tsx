import { Cpu } from "lucide-react";
import { Select } from "@/registry/bitop/ui/select/select";
import { type ComponentDoc, examples } from "../types";
import raw from "./select.tsx?raw";

export function Rich() {
  return (
    <Select
      label="Machine"
      defaultValue="standard"
      items={[
        { value: "standard", label: "Standard", hint: "2 vCPU", icon: <Cpu aria-hidden /> },
        { value: "performance", label: "Performance", hint: "4 vCPU", icon: <Cpu aria-hidden /> },
        { value: "turbo", label: "Turbo", hint: "8 vCPU", icon: <Cpu aria-hidden />, disabled: true },
      ]}
    />
  );
}

const doc: ComponentDoc = {
  slug: "select",
  title: "Select",
  category: "Forms",
  description: "A custom select for options with icons and hints. For plain form fields prefer NativeSelect from Input.",
  imports: `import { Select } from "@/components/ui/select/select";`,
  baseUi: { name: "Select", href: "https://base-ui.com/react/components/select" },
  examples: examples(raw, [["Rich", Rich, { title: "With icons and hints" }]]),
  props: [
    {
      component: "Select",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label; names the trigger." },
        { name: "items", type: "{ value, label, icon?, hint?, disabled? }[]", required: true, description: "Options." },
        { name: "value / defaultValue / onValueChange", type: "V | null / V | null / (value) => void", description: "Controlled or uncontrolled value." },
        { name: "placeholder", type: "ReactNode", default: '"Select…"', description: "Shown with no value." },
        { name: "hideLabel", type: "boolean", description: "Visually hide the label." },
        { name: "name / required / disabled", type: "string / boolean / boolean", description: "Form integration." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Trigger height." },
      ],
    },
  ],
  a11y: [
    "The trigger is a combobox button named by the label; the list is a listbox with the selected option marked.",
    "Arrow keys, Home/End and typeahead move through options; Escape closes and returns focus.",
  ],
};

export default doc;
