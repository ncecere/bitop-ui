import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Progress } from "@/registry/bitop/ui/progress/progress";
import { type ComponentDoc, examples } from "../types";
import raw from "./progress.tsx?raw";

export function Bars() {
  return (
    <Stack gap={5}>
      <Progress label="Uploading 3 files" value={64} />
      <Progress label="Build complete" value={100} tone="success" size="sm" />
      <Progress label="Preparing" value={null} showValue={false} />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "progress",
  title: "Progress",
  category: "Feedback",
  description: "A labelled progress bar, determinate or indeterminate, in three tones and two sizes.",
  imports: `import { Progress } from "@/components/ui/progress/progress";`,
  baseUi: { name: "Progress", href: "https://base-ui.com/react/components/progress" },
  examples: examples(raw, [["Bars", Bars, { title: "Determinate and indeterminate", wide: true }]]),
  props: [
    {
      component: "Progress",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label and accessible name." },
        { name: "value", type: "number | null", required: true, description: "0–max, or null for indeterminate." },
        { name: "max", type: "number", default: "100", description: "Maximum." },
        { name: "showValue", type: "boolean", default: "true", description: 'Show the formatted value (e.g. "64%").' },
        { name: "hideLabel", type: "boolean", description: "Visually hide the label." },
        { name: "tone", type: '"primary" | "success" | "danger"', default: '"primary"', description: "Bar colour." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Bar thickness." },
      ],
    },
  ],
  a11y: ['role="progressbar" with aria-valuenow/min/max, labelled by the visible label.', "Indeterminate bars omit aria-valuenow."],
};

export default doc;
