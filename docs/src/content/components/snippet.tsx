import { Snippet } from "@/registry/bitop/ui/snippet/snippet";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./snippet.tsx?raw";

export function Commands() {
  return (
    <div className={styles.stack}>
      <Snippet code="npx @bitop/cli add conversation prompt-input" />
      <Snippet code="SELECT count(*) FROM tickets WHERE status = 'open';" prefix=">" label="query" />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "snippet",
  title: "Snippet",
  category: "AI",
  description: "A one-line command with a copy button, e.g. an install command inside an answer. The prompt symbol is never copied.",
  imports: `import { Snippet } from "@/components/ui/snippet/snippet";`,
  examples: examples(raw, [["Commands", Commands, { title: "Commands", wide: true }]]),
  props: [
    {
      component: "Snippet",
      rows: [
        { name: "code", type: "string", required: true, description: "The command." },
        { name: "prefix", type: "string", default: '"$"', description: "Decorative prompt; empty hides it." },
        { name: "label", type: "string", default: '"command"', description: "For the button: “Copy command”." },
      ],
    },
  ],
  a11y: ["The prefix is aria-hidden and not copied.", "Long commands scroll inside a focusable element.", "Copying is announced."],
};

export default doc;
