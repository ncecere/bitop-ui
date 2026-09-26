import { Bold, Eye, Italic, Pin, Underline } from "lucide-react";
import { useState } from "react";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { Toggle } from "@/registry/bitop/ui/toggle/toggle";
import { type ComponentDoc, examples } from "../types";
import raw from "./toggle.tsx?raw";

export function Variants() {
  return (
    <Stack gap={4}>
      <Inline gap={2}>
        <Toggle iconOnly aria-label="Bold" defaultPressed>
          <Bold aria-hidden />
        </Toggle>
        <Toggle iconOnly aria-label="Italic">
          <Italic aria-hidden />
        </Toggle>
        <Toggle iconOnly aria-label="Underline" disabled>
          <Underline aria-hidden />
        </Toggle>
      </Inline>
      <Inline gap={2}>
        <Toggle variant="outline">
          <Eye aria-hidden />
          Preview
        </Toggle>
        <Toggle variant="outline" size="sm" defaultPressed>
          Word wrap
        </Toggle>
      </Inline>
    </Stack>
  );
}

export function Controlled() {
  const [pinned, setPinned] = useState(false);
  return (
    <Inline gap={3}>
      <Toggle variant="outline" pressed={pinned} onPressedChange={setPinned}>
        <Pin aria-hidden />
        Pin to sidebar
      </Toggle>
      <span>{pinned ? "Shown in the sidebar." : "Not in the sidebar."}</span>
    </Inline>
  );
}

const doc: ComponentDoc = {
  slug: "toggle",
  title: "Toggle",
  category: "Actions",
  description: "A two-state button for an on/off option that applies immediately, such as bold text or a preview pane. Same sizes and focus ring as Button.",
  imports: `import { Toggle } from "@/components/ui/toggle/toggle";`,
  baseUi: { name: "Toggle", href: "https://base-ui.com/react/components/toggle" },
  examples: examples(raw, [
    ["Variants", Variants, { title: "Ghost, outline, icon-only and sizes" }],
    ["Controlled", Controlled, { title: "Controlled" }],
  ]),
  props: [
    {
      component: "Toggle",
      note: "Also accepts Base UI Toggle props (pressed, defaultPressed, onPressedChange, disabled, value, render…) and native button props.",
      rows: [
        { name: "variant", type: '"ghost" | "outline"', default: '"ghost"', description: "Transparent until pressed, or with a control boundary." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Height (32 or 36px), as Button." },
        { name: "iconOnly", type: "boolean", description: "Square icon toggle; the type then requires aria-label." },
      ],
    },
  ],
  a11y: [
    "Renders a native <button> with aria-pressed; Space and Enter toggle it.",
    "Icon-only toggles must have an aria-label (enforced by the type). Keep the label stable; the pressed state is announced separately.",
    "Pressed is shown by a tint and an inset ring, not by fill colour alone; the outline boundary meets 3:1.",
  ],
};

export default doc;
