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

const doc: ComponentDoc = {
  slug: "breadcrumbs",
  title: "Breadcrumbs",
  category: "Navigation",
  description: "A breadcrumb trail. The last item is the current page; items can render router links.",
  imports: `import { Breadcrumbs } from "@/components/ui/breadcrumbs/breadcrumbs";`,
  examples: examples(raw, [["Basic", Basic, { title: "Basic" }]]),
  props: [
    {
      component: "Breadcrumbs",
      rows: [
        { name: "items", type: "{ label, href?, render?, icon? }[]", required: true, description: "Trail from root to the current page." },
        { name: "label", type: "string", default: '"Breadcrumb"', description: "Name of the navigation landmark." },
      ],
    },
  ],
  a11y: [
    "Renders a <nav> landmark with an ordered list.",
    'The last item is marked aria-current="page".',
    "Separators are decorative and hidden from assistive technology.",
    "Give each Breadcrumbs on a page a distinct label.",
  ],
};

export default doc;
