import type { ReactNode } from "react";
import { CodeBlock } from "@/registry/bitop/ui/code-block/code-block";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./code-block.tsx?raw";

export function Basic() {
  return (
    <div className={styles.stack}>
      <CodeBlock language="bash" code="npx @bitop/cli add response code-block" />
      <CodeBlock
        filename="src/lib/sum.ts"
        language="ts"
        showLineNumbers
        code={`export function sum(values: number[]): number {\n  // Adds every value.\n  return values.reduce((a, b) => a + b, 0);\n}`}
      />
    </div>
  );
}

export function Highlighted() {
  // A toy highlighter; in an app pass shiki / Prism / lowlight output instead.
  const highlight = (code: string): ReactNode =>
    code.split(/(\/\/.*$|"[^"]*"|\b(?:const|return|function|export)\b)/gm).map((part, i) => {
      if (part.startsWith("//")) return <span key={i} className={styles.tokComment}>{part}</span>;
      if (part.startsWith('"')) return <span key={i} className={styles.tokString}>{part}</span>;
      if (/^(const|return|function|export)$/.test(part)) return <span key={i} className={styles.tokKeyword}>{part}</span>;
      return part;
    });
  return (
    <div className={styles.stack}>
      <CodeBlock language="js" highlight={highlight} code={`// Greets someone\nexport function greet(name) {\n  const greeting = "Hello, " + name;\n  return greeting;\n}`} />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "code-block",
  title: "Code block",
  category: "AI",
  description: "Code with a language label or filename, a copy button, optional line numbers and a pluggable highlighter. No highlighting library is bundled.",
  imports: `import { CodeBlock } from "@/components/ui/code-block/code-block";`,
  examples: examples(raw, [
    ["Basic", Basic, { title: "Language, filename and line numbers", wide: true }],
    ["Highlighted", Highlighted, { title: "Custom highlighter", wide: true }],
  ]),
  props: [
    {
      component: "CodeBlock",
      note: "Also accepts div props.",
      rows: [
        { name: "code", type: "string", required: true, description: "The code (copied verbatim)." },
        { name: "language", type: "string", description: "Language id for the label, the class and the highlighter." },
        { name: "filename", type: "ReactNode", description: "Shown instead of the language." },
        { name: "showLineNumbers", type: "boolean", default: "false", description: "Line-number gutter (not copied, hidden from screen readers)." },
        { name: "highlight", type: "(code, language) => ReactNode", description: "Returns inline content for <code>, e.g. from shiki's codeToHast." },
        { name: "actions", type: "ReactNode", description: "Extra header actions." },
        { name: "copyable", type: "boolean", default: "true", description: "Show the copy button." },
        { name: "wrap", type: "boolean", default: "false", description: "Wrap long lines instead of scrolling." },
        { name: "maxHeight", type: "string", description: "CSS length; scrolls beyond it." },
        { name: "hideHeader", type: "boolean", default: "false", description: "No header; the copy button floats in the corner." },
      ],
    },
  ],
  a11y: [
    "The <pre> scrolls and is keyboard-focusable (WCAG 2.1.1).",
    "The copy button is named “Copy <language> code” and announces the result.",
    "Line numbers are aria-hidden and not selectable, so copying and screen readers get just the code.",
    "Highlighter colours must use theme tokens with 4.5:1 contrast on --color-surface-sunken.",
  ],
};

export default doc;
