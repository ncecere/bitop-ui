import { Loading, Spinner } from "@/registry/bitop/ui/spinner/spinner";
import { type ComponentDoc, examples } from "../types";
import raw from "./spinner.tsx?raw";

export function Sizes() {
  return (
    <>
      <Spinner size="sm" />
      <Spinner />
      <Spinner size="lg" label="Loading results" />
      <Loading block={false} label="Loading projects…" />
    </>
  );
}

const doc: ComponentDoc = {
  slug: "spinner",
  title: "Spinner",
  category: "Feedback",
  description: "A spinner in three sizes, and Loading: a spinner with announced text for sections and pages.",
  imports: `import { Loading, Spinner } from "@/components/ui/spinner/spinner";`,
  examples: examples(raw, [["Sizes", Sizes, { title: "Spinner and Loading" }]]),
  props: [
    {
      component: "Spinner",
      rows: [
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Diameter." },
        { name: "label", type: "string", description: "Makes it an announced status; otherwise decorative." },
      ],
    },
    {
      component: "Loading",
      rows: [
        { name: "label", type: "ReactNode", default: '"Loading…"', description: "Visible and announced text." },
        { name: "block", type: "boolean", default: "true", description: "Centre in a padded block." },
      ],
    },
  ],
  a11y: ['Loading uses role="status" so the text is announced politely.', "A Spinner without label is aria-hidden; the surrounding UI must convey the state."],
};

export default doc;
