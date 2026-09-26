import { Inbox, Plus } from "lucide-react";
import { Button } from "@/registry/bitop/ui/button/button";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { type ComponentDoc, examples } from "../types";
import raw from "./empty-state.tsx?raw";

export function Basic() {
  return (
    <EmptyState
      icon={<Inbox />}
      title="No projects yet"
      description="Import a Git repository or start from a template to create your first project."
      action={
        <>
          <Button>
            <Plus aria-hidden /> New project
          </Button>
          <Button variant="ghost">Read the guide</Button>
        </>
      }
    />
  );
}

const doc: ComponentDoc = {
  slug: "empty-state",
  title: "Empty state",
  category: "Display",
  description: "Icon, title, description and actions for empty lists and first-run screens. The compact size fits inside tables.",
  imports: `import { EmptyState } from "@/components/ui/empty-state/empty-state";`,
  examples: examples(raw, [["Basic", Basic, { title: "Basic" }]]),
  props: [
    {
      component: "EmptyState",
      note: "Also accepts native <div> props.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Main message." },
        { name: "description", type: "ReactNode", description: "Supporting text." },
        { name: "icon", type: "ReactNode", description: "Decorative icon in a tinted circle." },
        { name: "action", type: "ReactNode", description: "Primary and optional secondary action." },
        { name: "titleAs", type: '"h1" | "h2" | "h3" | "h4" | "p"', default: '"p"', description: "Make the title a heading when it starts a section (h1 for a 404 page)." },
        { name: "size", type: '"md" | "compact"', default: '"md"', description: "Compact for tables and small cards." },
      ],
    },
  ],
  a11y: ["The icon is decorative.", "Use titleAs to add a heading only when it fits the page outline."],
};

export default doc;
