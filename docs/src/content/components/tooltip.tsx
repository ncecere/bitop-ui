import { Bell, Copy } from "lucide-react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { type ComponentDoc, examples } from "../types";
import raw from "./tooltip.tsx?raw";

export function Basic() {
  return (
    <>
      <Tooltip content="Notifications" side="bottom">
        <IconButton icon={<Bell aria-hidden />} label="Notifications" variant="secondary" />
      </Tooltip>
      <Tooltip content="Copy link" shortcut="⌘C">
        <IconButton icon={<Copy aria-hidden />} label="Copy link" variant="secondary" />
      </Tooltip>
    </>
  );
}

const doc: ComponentDoc = {
  slug: "tooltip",
  title: "Tooltip",
  category: "Overlays",
  description: "A short label on hover and focus, with an optional shortcut hint. Wrap your app in TooltipProvider to share the open delay.",
  imports: `import { Tooltip, TooltipProvider } from "@/components/ui/tooltip/tooltip";`,
  baseUi: { name: "Tooltip", href: "https://base-ui.com/react/components/tooltip" },
  examples: examples(raw, [["Basic", Basic, { title: "On icon buttons" }]]),
  props: [
    {
      component: "Tooltip",
      rows: [
        { name: "content", type: "ReactNode", required: true, description: "The text." },
        { name: "children", type: "ReactElement", required: true, description: "The trigger (must accept ref and props)." },
        { name: "side / align", type: "Side / Align", default: '"top" / "center"', description: "Placement." },
        { name: "shortcut", type: "ReactNode", description: "Shortcut hint after the text." },
        { name: "delay", type: "number", description: "Open delay in ms." },
      ],
    },
  ],
  a11y: [
    "Opens on keyboard focus as well as hover, and closes on Escape.",
    "A tooltip supplements the accessible name, it doesn't replace it: icon buttons still need label.",
    "Text on the inverted chip meets 4.5:1 in both themes.",
  ],
};

export default doc;
