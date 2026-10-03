import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { Suggestion, Suggestions } from "@/registry/bitop/ui/suggestion/suggestion";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./suggestion.tsx?raw";

export function Wrap() {
  const [picked, setPicked] = useState("");
  const ideas = ["Summarise this document", "Find action items", "Draft a reply", "Translate to Spanish", "Explain like I'm new"];
  return (
    <div className={styles.stack}>
      <Suggestions>
        {ideas.map((s) => (
          <Suggestion key={s} suggestion={s} onSelect={setPicked} />
        ))}
      </Suggestions>
      <p className={styles.muted}>{picked ? `Selected: ${picked}` : "Pick a suggestion."}</p>
    </div>
  );
}

export function Start() {
  const ideas = ["How long does an interlibrary loan item take to arrive at the branch I picked?", "Can I renew it?", "Where do I pick it up?"];
  return (
    <div className={styles.stack}>
      <p className={styles.muted}>Under a left-aligned answer, rows start at the left; a long suggestion wraps inside its chip.</p>
      <Suggestions align="start" label="Suggested follow-up questions">
        {ideas.map((s) => (
          <Suggestion key={s} suggestion={s} />
        ))}
      </Suggestions>
    </div>
  );
}

export function Scroll() {
  const ideas = ["What's new this week?", "Compare the Q2 and Q3 numbers", "Which tickets are overdue?", "Plan my next sprint", "Write release notes"];
  return (
    <div className={styles.stack}>
      <Suggestions layout="scroll">
        {ideas.map((s) => (
          <Suggestion key={s} suggestion={s} icon={<Lightbulb aria-hidden />} />
        ))}
      </Suggestions>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "suggestion",
  title: "Suggestion",
  category: "AI",
  description: "Prompt starters as pill buttons, wrapping onto several lines or scrolling sideways in one row.",
  imports: `import { Suggestion, Suggestions } from "@/components/ui/suggestion/suggestion";`,
  examples: examples(raw, [
    ["Wrap", Wrap, { title: "Wrapping", wide: true }],
    ["Start", Start, { title: "From the start, with long suggestions", wide: true }],
    ["Scroll", Scroll, { title: "Single scrolling row", wide: true }],
  ]),
  props: [
    { component: "Suggestions", rows: [{ name: "layout", type: '"wrap" | "scroll"', default: '"wrap"', description: "Flow onto lines or scroll in one row." }, { name: "align", type: '"center" | "start"', default: '"center"', description: "Where wrapped rows line up: centred, or from the start (under left-aligned text)." }, { name: "label", type: "string", default: '"Suggestions"', description: "Group name." }] },
    {
      component: "Suggestion",
      note: "A secondary Button; accepts button props.",
      rows: [
        { name: "suggestion", type: "string", required: true, description: "The prompt text passed to onSelect." },
        { name: "onSelect", type: "(suggestion) => void", description: "Called on click." },
        { name: "icon", type: "ReactNode", description: "Leading decorative icon." },
        { name: "children", type: "ReactNode", description: "Visible text if different from suggestion." },
      ],
    },
  ],
  a11y: ["The chips are real buttons in a group named “Suggestions”.", "In the wrapping layout a long suggestion wraps onto more lines inside its chip, so it never runs past the screen's edge (WCAG 1.4.10 reflow).", "In the scrolling row every chip is reachable with Tab, which scrolls it into view."],
};

export default doc;
