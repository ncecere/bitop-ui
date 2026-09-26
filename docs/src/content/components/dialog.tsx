import { useState } from "react";
import { AlertDialog, Dialog, DialogClose } from "@/registry/bitop/ui/dialog/dialog";
import { Button } from "@/registry/bitop/ui/button/button";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input, Textarea } from "@/registry/bitop/ui/input/input";
import { SkeletonText } from "@/registry/bitop/ui/skeleton/skeleton";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./dialog.tsx?raw";

export function Basic() {
  return (
    <Dialog
      trigger={<Button>New project</Button>}
      title="New project"
      description="Projects group deployments, domains and environment variables."
      footer={
        <>
          <DialogClose>Cancel</DialogClose>
          <Button onClick={() => toast.success("Project created")}>Create</Button>
        </>
      }
    >
      <Field label="Name">
        <Input placeholder="marketing-site" />
      </Field>
      <Field label="Description" labelHint="Optional">
        <Textarea />
      </Field>
    </Dialog>
  );
}

export function Sizes() {
  return (
    <>
      <Dialog trigger={<Button variant="secondary">Small</Button>} size="sm" title="Small dialog" description="For short confirmations or single inputs.">
        <p>Sizes: sm, md, lg, xl.</p>
      </Dialog>
      <Dialog trigger={<Button variant="secondary">Large</Button>} size="lg" title="Large dialog" description="Room for tables and multi-column forms.">
        <SkeletonText lines={5} />
      </Dialog>
    </>
  );
}

export function Confirm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Delete project…
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete “marketing-site”?"
        description="Its 42 deployments and 3 domains will be removed. This can't be undone."
        confirmLabel="Delete project"
        busy={busy}
        error={error}
        onConfirm={() => {
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            setError(new Error("The project still has an active production domain. Remove it first."));
          }, 900);
        }}
      />
    </>
  );
}

const doc: ComponentDoc = {
  slug: "dialog",
  title: "Dialog",
  category: "Overlays",
  description: "Modal Dialog with a title, description, sticky footer and four sizes, plus AlertDialog for confirming consequential actions with busy and error states.",
  imports: `import { AlertDialog, Dialog, DialogClose } from "@/components/ui/dialog/dialog";`,
  baseUi: { name: "Dialog", href: "https://base-ui.com/react/components/dialog" },
  examples: examples(raw, [
    ["Basic", Basic, { title: "Dialog" }],
    ["Sizes", Sizes, { title: "Sizes" }],
    ["Confirm", Confirm, { title: "Alert dialog", description: "Initial focus is on Cancel; clicking outside doesn't dismiss it." }],
  ]),
  props: [
    {
      component: "Dialog",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Heading; names the dialog." },
        { name: "description", type: "ReactNode", description: "Describes the dialog." },
        { name: "trigger", type: "ReactElement", description: "Element that opens it, e.g. <Button />." },
        { name: "footer", type: "ReactNode", description: "Sticky footer (use DialogClose for Cancel)." },
        { name: "size", type: '"sm" | "md" | "lg" | "xl"', default: '"md"', description: "Max width." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        { name: "hideClose", type: "boolean", description: "Hide the × button (Escape still closes)." },
        { name: "initialFocus", type: "Ref | function", description: "Element to focus when opened." },
      ],
    },
    {
      component: "AlertDialog",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Heading." },
        { name: "description", type: "ReactNode", required: true, description: "What will happen." },
        { name: "confirmLabel", type: "ReactNode", required: true, description: 'Specific verb, e.g. "Delete project".' },
        { name: "onConfirm", type: "() => void", required: true, description: "Runs the action." },
        { name: "busy", type: "boolean", description: "Spinner on the confirm button." },
        { name: "error", type: "unknown", description: "Shown as a danger alert." },
        { name: "tone", type: '"danger" | "primary"', default: '"danger"', description: "Confirm button variant." },
        { name: "cancelLabel", type: "ReactNode", default: '"Cancel"', description: "Cancel text." },
      ],
    },
    { component: "DialogClose", note: "A Button (secondary by default) that closes the surrounding dialog; takes Button props.", rows: [] },
  ],
  a11y: [
    "Focus is trapped inside and returns to the trigger on close; Escape closes.",
    "The title labels the dialog and the description describes it.",
    'AlertDialog uses role="alertdialog", puts initial focus on Cancel and ignores outside clicks, so Enter never confirms a destructive action by accident.',
    "The × button is last in the DOM so initial focus lands on the first field.",
  ],
};

export default doc;
