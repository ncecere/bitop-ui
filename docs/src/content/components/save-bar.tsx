import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { SaveBar } from "@/registry/bitop/ui/save-bar/save-bar";
import { type ComponentDoc, examples } from "../types";
import raw from "./save-bar.tsx?raw";

export function Settings() {
  const saved = { name: "Registrar", topK: "8" };
  const [form, setForm] = useState(saved);
  const [base, setBase] = useState(saved);
  const dirty = form.name !== base.name || form.topK !== base.topK;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setBase(form);
      }}
    >
      <Stack gap={4}>
        <Field label="Name">
          <Input value={form.name} onValueChange={(name) => setForm({ ...form, name })} />
        </Field>
        <Field label="Results per query">
          <Input value={form.topK} onValueChange={(topK) => setForm({ ...form, topK })} />
        </Field>
      </Stack>
      <SaveBar open={dirty}>
        <Button variant="ghost" onClick={() => setForm(base)}>
          Discard
        </Button>
        <Button type="submit">Save changes</Button>
      </SaveBar>
    </form>
  );
}

const doc: ComponentDoc = {
  slug: "save-bar",
  title: "Save bar",
  category: "Forms",
  description:
    "The Save and Discard actions of a long form, stuck to the bottom of the scrolling area while there are unsaved changes. Edit a field to show it.",
  imports: `import { SaveBar } from "@/components/ui/save-bar/save-bar";`,
  examples: examples(raw, [["Settings", Settings, { title: "Settings form" }]]),
  props: [
    {
      component: "SaveBar",
      note: "Also accepts <div> props. Place it last inside the form: it is position: sticky.",
      rows: [
        { name: "open", type: "boolean", required: true, description: "Show the bar, usually when the form has unsaved changes." },
        { name: "message", type: "ReactNode", default: "\"Unsaved changes\"", description: "Status text, announced when the bar opens." },
        { name: "children", type: "ReactNode", required: true, description: "The actions, e.g. Discard and Save buttons." },
      ],
    },
  ],
  a11y: [
    "The message is a polite live region (role=\"status\") that stays in the DOM, so screen readers announce “Unsaved changes” when the bar opens.",
    "Closed, the actions are hidden (not only visually), so they leave the tab order.",
    "Being sticky rather than fixed, the bar never covers the end of the form: it comes to rest after the last field.",
    "The entry animation is skipped with prefers-reduced-motion.",
  ],
};

export default doc;
