import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Checkbox } from "@/registry/bitop/ui/checkbox/checkbox";
import { Field, Fieldset } from "@/registry/bitop/ui/field/field";
import { Input, NativeSelect } from "@/registry/bitop/ui/input/input";
import { Sheet, SheetClose } from "@/registry/bitop/ui/sheet/sheet";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./sheet.tsx?raw";

export function Filters() {
  return (
    <Sheet
      trigger={<Button variant="secondary">Filters</Button>}
      title="Filter deployments"
      description="Only deployments that match every filter are shown."
      footer={
        <>
          <SheetClose>Cancel</SheetClose>
          <SheetClose variant="primary" onClick={() => toast.success("Filters applied")}>
            Apply filters
          </SheetClose>
        </>
      }
    >
      <Field label="Branch">
        <Input placeholder="main" />
      </Field>
      <Field label="Environment">
        <NativeSelect defaultValue="all">
          <option value="all">All environments</option>
          <option value="production">Production</option>
          <option value="preview">Preview</option>
        </NativeSelect>
      </Field>
      <Fieldset legend="Status">
        <Checkbox label="Ready" defaultChecked />
        <Checkbox label="Building" defaultChecked />
        <Checkbox label="Failed" />
      </Fieldset>
    </Sheet>
  );
}

export function Sides() {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <>
      {sides.map((side) => (
        <Sheet
          key={side}
          side={side}
          trigger={<Button variant="secondary">{side[0]!.toUpperCase() + side.slice(1)}</Button>}
          title="Keyboard shortcuts"
          description={`This sheet slides in from the ${side}.`}
        >
          <p>Press Escape or click the backdrop to close it.</p>
        </Sheet>
      ))}
    </>
  );
}

export function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Edit profile"
        description="Changes are visible to everyone in your team."
        footer={
          <>
            <SheetClose>Cancel</SheetClose>
            <Button
              onClick={() => {
                setOpen(false);
                toast.success("Profile saved");
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        <Field label="Name">
          <Input defaultValue="Ada Lovelace" />
        </Field>
        <Field label="Username">
          <Input defaultValue="@ada" />
        </Field>
      </Sheet>
    </>
  );
}

const doc: ComponentDoc = {
  slug: "sheet",
  title: "Sheet",
  category: "Overlays",
  description:
    "A modal dialog that slides in from an edge of the screen for secondary tasks such as filters, details and settings. Same conventions as Dialog: title, description, footer and a close button.",
  imports: `import { Sheet, SheetClose } from "@/components/ui/sheet/sheet";`,
  baseUi: { name: "Dialog", href: "https://base-ui.com/react/components/dialog" },
  examples: examples(raw, [
    ["Filters", Filters, { title: "Filters panel" }],
    ["Sides", Sides, { title: "Sides" }],
    ["Controlled", Controlled, { title: "Controlled", description: "open / onOpenChange with a wider size." }],
  ]),
  props: [
    {
      component: "Sheet",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Heading; names the sheet." },
        { name: "description", type: "ReactNode", required: true, description: "Describes the sheet's purpose." },
        { name: "side", type: '"right" | "left" | "top" | "bottom"', default: '"right"', description: "Edge it slides in from." },
        { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "Width of left/right sheets (20–42rem)." },
        { name: "trigger", type: "ReactElement", description: "Element that opens it, e.g. <Button />." },
        { name: "footer", type: "ReactNode", description: "Footer pinned to the bottom (use SheetClose for Cancel)." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        { name: "hideClose", type: "boolean", description: "Hide the × button (Escape still closes)." },
        { name: "initialFocus / finalFocus", type: "Ref | function", description: "Where focus goes on open / close." },
      ],
    },
    { component: "SheetClose", note: "A Button (secondary by default) that closes the surrounding sheet; takes Button props.", rows: [] },
  ],
  a11y: [
    'A modal dialog (role="dialog"): the title labels it and the description describes it, so both are required.',
    "Focus is trapped inside and returns to the trigger on close; Escape and the backdrop close it.",
    "The × button is last in the DOM so initial focus lands on the first field.",
    "The slide transition is switched off under prefers-reduced-motion.",
    "Use Drawer instead when you need swipe-to-dismiss or snap points.",
  ],
};

export default doc;
