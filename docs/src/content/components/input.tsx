import { Search } from "lucide-react";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input, NativeSelect, Textarea } from "@/registry/bitop/ui/input/input";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./input.tsx?raw";

export function Controls() {
  return (
    <Stack gap={5}>
      <Field label="Search" hideLabel>
        <Input startIcon={<Search />} placeholder="Search projects…" type="search" />
      </Field>
      <Field label="Notes" labelHint="Optional">
        <Textarea placeholder="Anything reviewers should know?" />
      </Field>
      <Field label="Region" description="A native select: the best choice for forms.">
        <NativeSelect defaultValue="fra">
          <option value="iad">Washington, D.C. (iad1)</option>
          <option value="fra">Frankfurt (fra1)</option>
          <option value="hnd">Tokyo (hnd1)</option>
        </NativeSelect>
      </Field>
      <Inline gap={3} wrap={false} align="start">
        <Field label="Small" style={{ flex: 1 }}>
          <Input size="sm" placeholder="32px" />
        </Field>
        <Field label="Disabled" style={{ flex: 1 }} disabled>
          <Input value="Read-only value" readOnly />
        </Field>
      </Inline>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "input",
  title: "Input",
  category: "Forms",
  description: "Text Input (with an optional start icon), Textarea and NativeSelect. Put them in a Field for labels and errors.",
  imports: `import { Input, NativeSelect, Textarea } from "@/components/ui/input/input";`,
  baseUi: { name: "Input", href: "https://base-ui.com/react/components/input" },
  examples: examples(raw, [["Controls", Controls, { title: "Inputs, textarea and native select", wide: true }]]),
  props: [
    {
      component: "Input",
      note: "Also accepts native <input> props and ref.",
      rows: [
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Control height (32 or 36px)." },
        { name: "startIcon", type: "ReactNode", description: "Decorative icon inside the start of the input." },
        { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value." },
      ],
    },
    { component: "Textarea", note: "Native <textarea> props; rows defaults to 3.", rows: [] },
    { component: "NativeSelect", note: "Native <select> props; size is sm | md.", rows: [] },
  ],
  a11y: [
    "Controls get their name, description and invalid state from the surrounding Field.",
    "Control boundaries meet 3:1 against the page (WCAG 1.4.11).",
    "Prefer NativeSelect in forms: it keeps native keyboard and mobile behaviour.",
  ],
};

export default doc;
