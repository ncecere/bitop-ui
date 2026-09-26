import { CopyButton } from "@/registry/bitop/ui/copy-button/copy-button";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./copy-button.tsx?raw";

export function Variants() {
  return (
    <div className={styles.row}>
      <CopyButton value="sk_live_4f9c2e7b1d8a" label="API key" />
      <CopyButton value="https://example.com/share/42" label="link" variant="secondary" showText />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "copy-button",
  title: "Copy button",
  category: "Actions",
  description: "A button that copies text, swaps to a check mark and announces the result. useCopyToClipboard() is the same logic for your own triggers.",
  imports: `import { CopyButton, useCopyToClipboard } from "@/components/ui/copy-button/copy-button";`,
  examples: examples(raw, [["Variants", Variants, { title: "Icon-only and with text" }]]),
  props: [
    {
      component: "CopyButton",
      note: "A Button; accepts its props (variant, size…).",
      rows: [
        { name: "value", type: "string | () => string", required: true, description: "Text to copy, or a function read at click time." },
        { name: "label", type: "string", default: '"text"', description: "What is copied: “Copy API key”, “Copied API key”." },
        { name: "showText", type: "boolean", default: "false", description: "Show “Copy”/“Copied” next to the icon." },
        { name: "tooltip", type: "boolean", default: "true", description: "Tooltip on the icon-only button." },
        { name: "timeout", type: "number", default: "2000", description: "How long “copied” lasts (ms)." },
        { name: "onCopy / onError", type: "(text) => void / (error) => void", description: "Callbacks." },
      ],
    },
    { component: "useCopyToClipboard(options)", rows: [], note: "Returns { state: 'idle' | 'copied' | 'failed', copied, copy(text) }. Pair it with <CopyStatus state={state} /> for the announcement." },
  ],
  a11y: [
    "The accessible name changes from “Copy …” to “Copied …”.",
    'The result is announced through an always-mounted role="status", including a failure message.',
    "Falls back to execCommand when the async Clipboard API is unavailable.",
  ],
};

export default doc;
