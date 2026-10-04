import { Button } from "@/registry/bitop/ui/button/button";
import { Popover } from "@/registry/bitop/ui/popover/popover";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { type ComponentDoc, examples } from "../types";
import raw from "./popover.tsx?raw";

export function Explainer() {
  return (
    <Popover
      trigger={<Button variant="secondary">What is a preview deployment?</Button>}
      title="Preview deployments"
      description="Every pull request gets its own URL, so reviewers can try changes before they are merged."
    >
      <TextLink href="#explainer">Read more</TextLink>
    </Popover>
  );
}

const doc: ComponentDoc = {
  slug: "popover",
  title: "Popover",
  category: "Overlays",
  description: "A non-modal floating panel anchored to its trigger, with an optional title and description.",
  imports: `import { Popover } from "@/components/ui/popover/popover";`,
  baseUi: { name: "Popover", href: "https://base-ui.com/react/components/popover" },
  examples: examples(raw, [["Explainer", Explainer, { title: "Explainer" }]]),
  props: [
    {
      component: "Popover",
      rows: [
        { name: "trigger", type: "ReactElement", required: true, description: "Element that toggles the popover." },
        { name: "title", type: "ReactNode", description: "Heading; names the popup." },
        { name: "description", type: "ReactNode", description: "Describes the popup." },
        { name: "side / align", type: "Side / Align", default: '"bottom" / "center"', description: "Placement." },
        { name: "openOnHover", type: "boolean", description: "Also open on hover (still keyboard and touch accessible)." },
        { name: "pointerFocus", type: '"first" | "popup"', default: '"first"', description: "Where focus goes when a mouse or pen opens it: the first control, or the popup itself so nothing in a list of links looks selected. The keyboard always focuses the first control." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
      ],
    },
  ],
  a11y: [
    "The trigger exposes aria-expanded; the popup is a dialog named by its title.",
    "Escape and clicking outside close it, and focus returns to the trigger.",
    "Use a Tooltip for short labels and a Popover when the content is interactive.",
  ],
};

export default doc;
