import { Globe } from "lucide-react";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/registry/bitop/ui/sources/sources";
import { demoSources } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./sources.tsx?raw";

export function UsedSources() {
  return (
    <div className={styles.stack}>
      <Sources defaultOpen>
        <SourcesTrigger count={demoSources.length} />
        <SourcesContent>
          {demoSources.map((s, i) => (
            <Source
              key={s.title}
              index={i + 1}
              title={s.title}
              href={s.href}
              meta={s.siteName}
              description={s.description}
              icon={s.href ? <Globe /> : undefined}
            />
          ))}
        </SourcesContent>
      </Sources>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "sources",
  title: "Sources",
  category: "AI",
  description: "A collapsible “Used N sources” list under an answer, with titles, links, snippets and citation numbers that match the [n] markers.",
  imports: `import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ui/sources/sources";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["UsedSources", UsedSources, { title: "Sources with citation numbers", wide: true }]]),
  props: [
    { component: "Sources", note: "Base UI Collapsible.Root props (open, defaultOpen, onOpenChange…).", rows: [] },
    { component: "SourcesTrigger", rows: [{ name: "count", type: "number", required: true, description: "Used in the default label “Used N sources”." }, { name: "children", type: "ReactNode", description: "Custom label." }] },
    { component: "SourcesContent", rows: [{ name: "label", type: "string", default: '"Sources"', description: "Accessible name of the list." }] },
    {
      component: "Source",
      note: "An <li>; accepts li props.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Source title." },
        { name: "href", type: "string", description: "Opens in a new tab. Without it the row is plain text (e.g. an uploaded file)." },
        { name: "description", type: "ReactNode", description: "Snippet (two lines max)." },
        { name: "meta", type: "ReactNode", description: "Muted meta; defaults to the hostname." },
        { name: "icon", type: "ReactNode", description: "Decorative favicon or file icon." },
        { name: "index", type: "number", description: "Citation number, read as “Source 1:”." },
      ],
    },
  ],
  a11y: [
    "The trigger is a button with aria-expanded; the list is an ordered list named “Sources”.",
    "Each linked source is a single link whose name includes its number and title and says it opens in a new tab.",
    "A Source with an id and tabIndex={-1} can receive focus from a citation chip (InlineCitation onActivate); it shows a focus ring while focused or while it has data-highlighted.",
  ],
};

export default doc;
