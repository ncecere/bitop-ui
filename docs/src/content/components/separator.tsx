import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { Separator } from "@/registry/bitop/ui/separator/separator";
import { type ComponentDoc, examples } from "../types";
import raw from "./separator.tsx?raw";

export function Variants() {
  return (
    <Stack gap={0} style={{ width: "100%" }}>
      <p>Above the line</p>
      <Separator />
      <p>Below the line</p>
      <Separator label="or" />
      <Inline gap={3}>
        <span>Docs</span>
        <Separator orientation="vertical" spacing="none" />
        <span>Changelog</span>
      </Inline>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "separator",
  title: "Separator",
  category: "Layout",
  description: "A horizontal or vertical rule, optionally with a centred label such as “or”.",
  imports: `import { Separator } from "@/components/ui/separator/separator";`,
  baseUi: { name: "Separator", href: "https://base-ui.com/react/components/separator" },
  examples: examples(raw, [["Variants", Variants, { title: "Horizontal, labelled and vertical", wide: true }]]),
  props: [
    {
      component: "Separator",
      rows: [
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Direction." },
        { name: "label", type: "ReactNode", description: "Centred text between two rules (horizontal only)." },
        { name: "spacing", type: '"none" | "sm" | "md" | "lg"', default: '"md"', description: "Margin around the rule." },
      ],
    },
  ],
  a11y: ['Renders role="separator" with aria-orientation.', "With a label, two rules flank the visible text, which is read as normal content."],
};

export default doc;
