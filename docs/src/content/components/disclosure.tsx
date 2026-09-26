import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Switch } from "@/registry/bitop/ui/switch/switch";
import { type ComponentDoc, examples } from "../types";
import raw from "./disclosure.tsx?raw";

export function Advanced() {
  return (
    <Disclosure title="Advanced options" summary="Node 22 · 1 GB · caching on">
      <Field label="Memory (MB)" description="Per build container.">
        <Input type="number" defaultValue={1024} />
      </Field>
      <Switch label="Build cache" defaultChecked />
    </Disclosure>
  );
}

const doc: ComponentDoc = {
  slug: "disclosure",
  title: "Disclosure",
  category: "Layout",
  description: "A button that shows and hides a section. The optional summary shows the current values while it is closed.",
  imports: `import { Disclosure } from "@/components/ui/disclosure/disclosure";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["Advanced", Advanced, { title: "Advanced options", wide: true }]]),
  props: [
    {
      component: "Disclosure",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Trigger text and accessible name." },
        { name: "summary", type: "ReactNode", description: "Muted text after the title." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        { name: "keepMounted", type: "boolean", description: "Keep the closed panel in the DOM (find-in-page can reveal it)." },
      ],
    },
  ],
  a11y: ["The trigger is a real button with aria-expanded and aria-controls.", "The chevron is decorative; state is announced by aria-expanded."],
};

export default doc;
