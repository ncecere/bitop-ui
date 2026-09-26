import { FileText } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/registry/bitop/ui/chain-of-thought/chain-of-thought";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./chain-of-thought.tsx?raw";

export function Steps() {
  return (
    <div className={styles.stack}>
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Searched the handbook for “parental leave”" description="3 matching documents">
            <ChainOfThoughtSearchResults>
              {["parental-leave.md", "benefits-faq.md", "leave-request.pdf"].map((f) => (
                <ChainOfThoughtSearchResult key={f}>
                  <FileText aria-hidden />
                  {f}
                </ChainOfThoughtSearchResult>
              ))}
            </ChainOfThoughtSearchResults>
          </ChainOfThoughtStep>
          <ChainOfThoughtStep label="Reading the 2025 policy" status="active" />
          <ChainOfThoughtStep label="Write the answer with citations" status="pending" />
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "chain-of-thought",
  title: "Chain of thought",
  category: "AI",
  description: "A collapsible timeline of an agent's visible steps, each with a status, optional description and search-result chips.",
  imports: `import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ui/chain-of-thought/chain-of-thought";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["Steps", Steps, { title: "Steps with results", wide: true }]]),
  props: [
    { component: "ChainOfThought", note: "Base UI Collapsible.Root props.", rows: [] },
    { component: "ChainOfThoughtHeader", rows: [{ name: "children", type: "ReactNode", default: '"Chain of thought"', description: "Trigger label." }, { name: "icon", type: "ReactNode", description: "Decorative icon." }] },
    { component: "ChainOfThoughtContent", rows: [{ name: "label", type: "string", default: '"Steps"', description: "Name of the ordered list." }] },
    {
      component: "ChainOfThoughtStep",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "What happened." },
        { name: "status", type: '"complete" | "active" | "pending"', default: '"complete"', description: "Marker and spoken status." },
        { name: "description", type: "ReactNode", description: "Muted detail." },
        { name: "icon", type: "ReactNode", description: "Replace the status marker." },
        { name: "children", type: "ReactNode", description: "Extra content, e.g. search results." },
      ],
    },
    { component: "ChainOfThoughtSearchResults / ChainOfThoughtSearchResult", rows: [], note: "A wrapping row of small chips." },
  ],
  a11y: [
    "Steps are an ordered list; each says its status to screen readers (“complete”, “in progress”, “not started”), and the active one has aria-current=\"step\".",
    "The header is a button with aria-expanded (Base UI Collapsible).",
  ],
};

export default doc;
