import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Field, Fieldset, Form, FormActions } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./field.tsx?raw";

export function Validation() {
  const [url, setUrl] = useState("http://example");
  return (
    <Stack gap={5}>
      <Field label="Project name" description="Shown to everyone in the workspace.">
        <Input defaultValue="Marketing site" />
      </Field>
      <Field label="Webhook URL" description="Must use HTTPS." error={url.startsWith("https://") ? undefined : "Enter a URL that starts with https://."}>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} />
      </Field>
    </Stack>
  );
}

export function FullForm() {
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Webhook saved", "We'll send a test event in a moment.");
      }}
    >
      <Fieldset legend="Webhook" description="We POST a JSON payload for every deployment.">
        <Field label="Name" name="name">
          <Input required placeholder="Production alerts" />
        </Field>
        <Field label="Endpoint" name="endpoint">
          <Input required type="url" placeholder="https://hooks.example.com/deploys" />
        </Field>
      </Fieldset>
      <FormActions>
        <Button variant="secondary" type="reset">
          Reset
        </Button>
        <Button type="submit">Save webhook</Button>
      </FormActions>
    </Form>
  );
}

const doc: ComponentDoc = {
  slug: "field",
  title: "Field",
  category: "Forms",
  description: "Field wires a label, description and error to its control. Fieldset groups fields under a legend; Form and FormActions handle layout.",
  imports: `import { Field, Fieldset, Form, FormActions } from "@/components/ui/field/field";`,
  baseUi: { name: "Field", href: "https://base-ui.com/react/components/field" },
  examples: examples(raw, [
    ["Validation", Validation, { title: "Description and error", wide: true }],
    ["FullForm", FullForm, { title: "Form with fieldset and actions", wide: true }],
  ]),
  props: [
    {
      component: "Field",
      note: "Also accepts Base UI Field.Root props (name, disabled, invalid, validate…). Lower-level parts: FieldRoot, FieldLabel, FieldDescription, FieldError.",
      rows: [
        { name: "label", type: "ReactNode", description: "Visible label." },
        { name: "hideLabel", type: "boolean", description: "Keep the label for assistive tech only." },
        { name: "labelHint", type: "ReactNode", description: 'Muted text after the label, e.g. "Optional".' },
        { name: "description", type: "ReactNode", description: "Help text (aria-describedby)." },
        { name: "error", type: "ReactNode", description: "Marks the control invalid and announces the message." },
        {
          name: "validate",
          type: "(value) => string | string[] | null",
          description:
            "Base UI validation. Without `error`, the field shows this message (or the browser's constraint message for required, type, min, pattern…) once it is validated, on submit inside a Form, so an invalid field never shows only a red border.",
        },
      ],
    },
    {
      component: "Fieldset",
      rows: [
        { name: "legend", type: "ReactNode", required: true, description: "Group name." },
        { name: "description", type: "ReactNode", description: "Help text for the group." },
        { name: "hideLegend", type: "boolean", description: "Visually hide the legend." },
      ],
    },
    { component: "Form", note: "Base UI Form props plus:", rows: [{ name: "gap", type: '"sm" | "md" | "lg"', default: '"md"', description: "Vertical gap between fields." }] },
    { component: "FormActions", rows: [{ name: "align", type: '"start" | "end" | "between"', default: '"end"', description: "Button alignment." }] },
  ],
  a11y: [
    "The label is associated with the control, and description and error are added to aria-describedby.",
    'An error sets aria-invalid="true" on the control.',
    "Errors are not conveyed by colour alone: they include an icon and text.",
  ],
};

export default doc;
