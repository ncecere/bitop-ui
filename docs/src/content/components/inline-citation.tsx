import { InlineCitation } from "@/registry/bitop/ui/inline-citation/inline-citation";
import { demoSources } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./inline-citation.tsx?raw";

export function InText() {
  return (
    <p className={styles.stack}>
      <span>
        Eligible employees get 16 weeks of paid leave
        <InlineCitation index={1} sources={[demoSources[0]!]} />
        and can split it into blocks
        <InlineCitation index={[2, 3]} sources={[demoSources[1]!, demoSources[2]!]} />. Without numbers the chip shows the site
        <InlineCitation sources={[demoSources[1]!]} />.
      </span>
    </p>
  );
}

export function Verified() {
  return (
    <p className={styles.stack}>
      <span>
        Eligible employees get 16 weeks of paid leave
        <InlineCitation index={1} sources={[demoSources[0]!]} verification="verified" verificationLabel="Verified: the source supports this (97% confidence)" />
        and can take it any time before the child turns three
        <InlineCitation index={2} sources={[demoSources[1]!]} verification="unsupported" />, but not as single days
        <InlineCitation index={3} sources={[demoSources[2]!]} verification="contradicted" />.
      </span>
    </p>
  );
}

const doc: ComponentDoc = {
  slug: "inline-citation",
  title: "Inline citation",
  category: "AI",
  description: "A small numbered chip after a claim. Hover it, or press Enter, to open a card with the source; several sources page with previous / next.",
  imports: `import { InlineCitation, type CitationSource } from "@/components/ui/inline-citation/inline-citation";`,
  baseUi: { name: "Popover", href: "https://base-ui.com/react/components/popover" },
  examples: examples(raw, [
    ["InText", InText, { title: "Single and multiple sources", wide: true }],
    ["Verified", Verified, { title: "Checked claims: verified, unsupported, contradicted", wide: true }],
  ]),
  props: [
    {
      component: "InlineCitation",
      rows: [
        { name: "sources", type: "CitationSource[]", required: true, description: "{ title, href?, siteName?, description?, quote?, icon? }" },
        { name: "index", type: "number | number[]", description: "Citation number(s) shown in the chip and its name." },
        { name: "label", type: "ReactNode", description: "Override the chip text (keep it in the accessible name)." },
        { name: "side", type: '"top" | "bottom"', default: '"top"', description: "Preferred side of the card." },
        { name: "onActivate", type: "() => void", description: "Runs on click / Enter / Space instead of opening the card (hover still previews it), e.g. to focus the matching Source below the answer." },
        { name: "verification", type: '"verified" | "unsupported" | "contradicted"', description: "The claim was checked against its source: a small check (verified) or a warning (unsupported, contradicted) in the chip." },
        { name: "verificationLabel", type: "string", description: "Explains the verification in the card and the chip's accessible name (defaults per status, e.g. “Not supported by this source”)." },
      ],
    },
  ],
  a11y: [
    "Built on Base UI Popover with openOnHover: it opens on hover and on click, Enter or Space.",
    "Opening it by keyboard or click moves focus into the card, so the source link and previous/next buttons are reachable with Tab; Esc closes it and returns focus to the chip.",
    "The chip is named after the source (“Source 1: Parental leave policy (2025)”), so screen-reader users hear what's cited without opening the card.",
    "The page position “2 of 3” is announced politely when paging, and stays in range if the sources list shrinks while the card is open.",
    "A verification is never shown by colour or icon alone: its text is added to the chip's accessible name (“Source 2: Leave FAQ. Not supported by this source”) and heads the card, which is the icon's tooltip.",
  ],
};

export default doc;
