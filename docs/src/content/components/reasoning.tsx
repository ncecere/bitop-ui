import { Button } from "@/registry/bitop/ui/button/button";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/registry/bitop/ui/reasoning/reasoning";
import { Response } from "@/registry/bitop/ui/response/response";
import { useFakeStream } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./reasoning.tsx?raw";

export function Streaming() {
  const stream = useFakeStream({ interval: 45, firstTokenDelay: 200 });
  const thinking =
    "The user asks about leave. I should check the **2025 policy** first, then the FAQ for how the leave can be split. The PDF has the request deadline.";
  const streaming = stream.status === "streaming" || stream.status === "submitted";
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button onClick={() => stream.start(thinking)} disabled={streaming}>
          Think
        </Button>
        <span className={styles.muted}>Opens while thinking, closes a second after.</span>
      </div>
      {stream.text || streaming ? (
        <Reasoning streaming={streaming}>
          <ReasoningTrigger />
          <ReasoningContent>
            <Response streaming={streaming}>{stream.text}</Response>
          </ReasoningContent>
        </Reasoning>
      ) : null}
    </div>
  );
}

export function Finished() {
  return (
    <Reasoning duration={12}>
      <ReasoningTrigger />
      <ReasoningContent>
        <Response>{"Compared the two travel policies line by line. The 2025 version raises the hotel cap and drops the pre-approval step for trips under 3 days."}</Response>
      </ReasoningContent>
    </Reasoning>
  );
}

const doc: ComponentDoc = {
  slug: "reasoning",
  title: "Reasoning",
  category: "AI",
  description:
    "The model's thinking in a collapsible panel: it opens while reasoning streams, closes once it's done, and says how long it took. After the user toggles it, it stays where they put it.",
  imports: `import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ui/reasoning/reasoning";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Streaming", Streaming, { title: "Auto open and close", wide: true }],
    ["Finished", Finished, { title: "From history (collapsed)", wide: true }],
  ]),
  props: [
    {
      component: "Reasoning",
      rows: [
        { name: "streaming", type: "boolean", default: "false", description: "True while reasoning tokens arrive." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled. Automatic opens/closes are requested through onOpenChange." },
        { name: "duration", type: "number", description: "Seconds; measured from streaming when omitted." },
        { name: "autoClose", type: "boolean", default: "true", description: "Close once after streaming ends." },
        { name: "autoCloseDelay", type: "number", default: "1000", description: "Milliseconds before the automatic close." },
      ],
    },
    {
      component: "ReasoningTrigger",
      rows: [
        { name: "getLabel", type: "(streaming, duration) => ReactNode", default: "reasoningLabel", description: "“Thinking…” (shimmer) while streaming, “Thought for N seconds” after." },
        { name: "children", type: "ReactNode", description: "Fixed label instead." },
      ],
    },
    { component: "ReasoningContent", rows: [{ name: "children", type: "ReactNode", required: true, description: "Usually a Response with the reasoning text." }] },
  ],
  a11y: [
    "The trigger is a button with aria-expanded and aria-controls (Base UI Collapsible).",
    "Automatic opening and closing stop as soon as the user toggles the panel, so it never moves under them.",
    "If focus is inside the panel when it closes automatically, focus moves to the trigger instead of being lost.",
    "The shimmer is decorative; the text “Thinking…” is always readable (muted colour, 4.5:1) and static under reduced motion.",
  ],
};

export default doc;
