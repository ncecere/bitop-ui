import { Settings, Upload } from "lucide-react";
import { Badge, StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { Button } from "@/registry/bitop/ui/button/button";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { type ComponentDoc, examples } from "../types";
import raw from "./page-header.tsx?raw";

export function Full() {
  return (
    <PageHeader
      breadcrumbs={
        <Breadcrumbs label="Breadcrumb (page header example)" items={[{ label: "Acme", href: "#full" }, { label: "Projects", href: "#full" }, { label: "Marketing site" }]} />
      }
      title="Marketing site"
      titleAs="h3"
      meta={
        <>
          <StatusBadge tone="success">Live</StatusBadge>
          <Badge variant="outline">Production</Badge>
        </>
      }
      description="Deployed from main on every push. Last deploy 4 minutes ago."
      actions={
        <>
          <Button variant="secondary">
            <Settings aria-hidden /> Settings
          </Button>
          <Button>
            <Upload aria-hidden /> Deploy
          </Button>
        </>
      }
    />
  );
}

const doc: ComponentDoc = {
  slug: "page-header",
  title: "Page header",
  category: "Layout",
  description: "The top of a page: breadcrumbs, the page's h1, inline meta, a description and actions.",
  imports: `import { PageHeader } from "@/components/ui/page-header/page-header";`,
  examples: examples(raw, [["Full", Full, { title: "Full", description: "This example renders an h3 so the docs page keeps one h1.", wide: true }]]),
  props: [
    {
      component: "PageHeader",
      note: "Also accepts native <div> props.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "The page heading." },
        { name: "titleAs", type: '"h1" | "h2" | "h3"', default: '"h1"', description: "Heading level." },
        { name: "description", type: "ReactNode", description: "Muted text under the title." },
        { name: "breadcrumbs", type: "ReactNode", description: "Shown above the title." },
        { name: "meta", type: "ReactNode", description: "Inline badges next to the title." },
        { name: "actions", type: "ReactNode", description: "Buttons on the right." },
      ],
    },
  ],
  a11y: ["The title is the page h1 by default; each page should have exactly one h1, so use titleAs when nesting.", "Actions wrap below the title on narrow screens and keep their DOM order."],
};

export default doc;
