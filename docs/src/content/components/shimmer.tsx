import { Shimmer } from "@/registry/bitop/ui/shimmer/shimmer";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./shimmer.tsx?raw";

export function Labels() {
  return (
    <div className={styles.stack}>
      <Shimmer>Thinking…</Shimmer>
      <Shimmer duration={3}>Searching 12 documents</Shimmer>
      <Shimmer render={<p />} active={false}>
        Finished (active=false)
      </Shimmer>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "shimmer",
  title: "Shimmer",
  category: "AI",
  description: "A light sweep across text for in-progress labels such as “Thinking…”. The text stays readable, and the sweep turns off under reduced motion.",
  imports: `import { Shimmer } from "@/components/ui/shimmer/shimmer";`,
  examples: examples(raw, [["Labels", Labels, { title: "In-progress labels" }]]),
  props: [
    {
      component: "Shimmer",
      note: "A <span>; accepts span props.",
      rows: [
        { name: "duration", type: "number", default: "2", description: "Seconds per sweep." },
        { name: "active", type: "boolean", default: "true", description: "Turn the animation off without changing the element." },
        { name: "render", type: "RenderProp", description: "Render another element, e.g. <p />." },
      ],
    },
  ],
  a11y: [
    "The resting colour is the muted text colour (4.5:1 on every surface); the sweep only brightens it.",
    "prefers-reduced-motion removes the animation; forced-colours mode shows plain text.",
    "It is purely visual: pair it with a status message (e.g. ConversationAnnouncer) if the state must be announced.",
  ],
};

export default doc;
