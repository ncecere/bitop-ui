import { Loader } from "@/registry/bitop/ui/loader/loader";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./loader.tsx?raw";

export function Sizes() {
  return (
    <div className={styles.row}>
      <Loader size="sm" />
      <Loader />
      <Loader size="lg" />
      <Loader label="Waiting for the first token" showLabel />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "loader",
  title: "Loader",
  category: "AI",
  description: "Three pulsing dots for “waiting for a reply” and other pending chat states. Use Spinner for buttons and page loading.",
  imports: `import { Loader } from "@/components/ui/loader/loader";`,
  examples: examples(raw, [["Sizes", Sizes, { title: "Sizes and a label" }]]),
  props: [
    {
      component: "Loader",
      rows: [
        { name: "size", type: '"sm" | "md" | "lg"', default: '"md"', description: "Dot size." },
        { name: "label", type: "string", description: 'Makes it a polite role="status" with this text; decorative without it.' },
        { name: "showLabel", type: "boolean", default: "false", description: "Also show the label." },
      ],
    },
  ],
  a11y: ["Decorative (aria-hidden) unless labelled.", "Under reduced motion the dots stop pulsing and stay visible."],
};

export default doc;
