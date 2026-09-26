import { CopyField } from "@/registry/bitop/ui/copy-field/copy-field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./copy-field.tsx?raw";

export function Secret() {
  return (
    <Stack gap={5}>
      <CopyField label="API token" value="sk_live_4f9c2e7b1d8a6f0e3c5b" description="It won't be shown again. Store it somewhere safe." />
      <CopyField
        label="Example request"
        name="example request"
        multiline
        value={`curl -H "Authorization: Bearer $ACME_TOKEN" \\\n  https://api.example.com/v1/projects`}
      />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "copy-field",
  title: "Copy field",
  category: "Display",
  description: "A read-only value (token, URL, snippet) with a copy button that confirms and announces the result.",
  imports: `import { CopyField } from "@/components/ui/copy-field/copy-field";`,
  examples: examples(raw, [["Secret", Secret, { title: "Single-line and multiline", wide: true }]]),
  props: [
    {
      component: "CopyField",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Group label." },
        { name: "value", type: "string", required: true, description: "Text to show and copy." },
        { name: "name", type: "string", description: 'Plain-text name for the button ("Copy API token"); defaults to label.' },
        { name: "description", type: "ReactNode", description: "Help text." },
        { name: "multiline", type: "boolean", default: "false", description: "Wrap long values (code)." },
        { name: "mono", type: "boolean", default: "true", description: "Monospace value." },
      ],
    },
  ],
  a11y: [
    'The field is a labelled group; the button is named "Copy <name>" and changes to "Copied <name>".',
    'Success or failure is announced through role="status".',
    "Falls back to execCommand when the async Clipboard API is unavailable.",
  ],
};

export default doc;
