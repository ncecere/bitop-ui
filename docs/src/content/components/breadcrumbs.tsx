import { Boxes } from "lucide-react";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { type ComponentDoc, examples } from "../types";
import raw from "./breadcrumbs.tsx?raw";

export function Basic() {
  return (
    <Breadcrumbs
      label="Breadcrumb (example)"
      items={[
        { label: "Acme", href: "#basic", icon: <Boxes aria-hidden /> },
        { label: "Projects", href: "#basic" },
        { label: "Marketing site" },
      ]}
    />
  );
}

export function Collapsed() {
  return (
    <Breadcrumbs
      label="Breadcrumb (collapsed example)"
      items={[
        { label: "Acme", href: "#collapsed", icon: <Boxes aria-hidden /> },
        {
          label: "Show 3 hidden levels",
          collapsed: [
            { label: "Projects", href: "#collapsed" },
            { label: "Marketing site", href: "#collapsed" },
            { label: "Releases", href: "#collapsed" },
          ],
        },
        { label: "v2.1" },
      ]}
    />
  );
}

const doc: ComponentDoc = {
  slug: "breadcrumbs",
  title: "Breadcrumbs",
  category: "Navigation",
  description: "A breadcrumb trail. The last item is the current page; items can render router links.",
  imports: `import { Breadcrumbs } from "@/components/ui/breadcrumbs/breadcrumbs";`,
  examples: examples(raw, [
    ["Basic", Basic, { title: "Basic" }],
    ["Collapsed", Collapsed, { title: "Collapsed middle", description: "A long trail keeps its ends; “…” opens a menu of the crumbs in between." }],
  ]),
  props: [
    {
      component: "Breadcrumbs",
      rows: [
        { name: "items", type: "{ label, href?, render?, icon?, collapsed? }[]", required: true, description: "Trail from root to the current page." },
        {
          name: "items[].collapsed",
          type: "{ label, href?, render?, icon? }[]",
          description: "Hidden crumbs: the item shows “…” and opens a menu of these links. Its label names the button (e.g. “Show 3 hidden levels”).",
        },
        { name: "label", type: "string", default: '"Breadcrumb"', description: "Name of the navigation landmark." },
      ],
    },
  ],
  a11y: [
    "Renders a <nav> landmark with an ordered list.",
    'The last item is marked aria-current="page".',
    "Separators are decorative and hidden from assistive technology.",
    "Give each Breadcrumbs on a page a distinct label.",
    "A collapsed item is a menu button named by its label (the “…” is hidden from assistive technology); its menu lists the hidden crumbs as links, and focus returns to the button on Escape.",
  ],
};

export default doc;
