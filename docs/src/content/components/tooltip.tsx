import { Bell, Copy } from "lucide-react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { Tooltip, TooltipText } from "@/registry/bitop/ui/tooltip/tooltip";
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

export function OnText() {
  return (
    <p>
      Latest score: <TooltipText content="Recall@5: the share of questions whose expected document was in the top 5 results.">82%</TooltipText>
    </p>
  );
}

const doc: ComponentDoc = {
  slug: "tooltip",
  title: "Tooltip",
  category: "Overlays",
  description: "A short label on hover and focus, with an optional shortcut hint. Wrap your app in TooltipProvider to share the open delay.",
  imports: `import { Tooltip, TooltipProvider, TooltipText } from "@/components/ui/tooltip/tooltip";`,
  baseUi: { name: "Tooltip", href: "https://base-ui.com/react/components/tooltip" },
  examples: examples(raw, [
    ["Basic", Basic, { title: "On icon buttons" }],
    [
      "OnText",
      OnText,
      {
        title: "On plain text",
        description: "TooltipText explains a value without turning it into a button: dotted underline, a tab stop, and the tooltip's text as its accessible description.",
      },
    ],
  ]),
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
    {
      component: "TooltipText",
      note: "Takes Tooltip's content, side, align, shortcut and delay.",
      rows: [
        { name: "children", type: "ReactNode", required: true, description: "The text the tooltip explains." },
        { name: "className", type: "string", description: "Class of the text (not the tooltip)." },
      ],
    },
  ],
  a11y: [
    "Opens on keyboard focus as well as hover, and closes on Escape.",
    "A tooltip supplements the accessible name, it doesn't replace it: icon buttons still need label.",
    "Text on the inverted chip meets 4.5:1 in both themes.",
    "TooltipText is focusable so keyboard users can open it, and the tooltip's text is its accessible description (a hidden element that's always in the page), so screen-reader users hear it after the text.",
    "Tooltips don't open on touch: keep what they say supplementary. For essential text use a Popover with openOnHover (an infotip), which works on touch too.",
  ],
};

export default doc;
