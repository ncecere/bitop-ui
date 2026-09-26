import { Button } from "@/registry/bitop/ui/button/button";
import { Response } from "@/registry/bitop/ui/response/response";
import { demoSources, useFakeStream } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./response.tsx?raw";

export function Markdown() {
  const md = `## Release checklist

1. Run the **full** test suite
2. Update the changelog — see [Keep a Changelog](https://keepachangelog.com)
3. Tag the release:

\`\`\`bash
git tag v1.4.0 && git push --tags
\`\`\`

| Step | Owner | Status |
| --- | --- | --- |
| Tests | CI | ✅ |
| Changelog | Docs team | In review |

- [x] Draft notes
- [ ] Announce in \`#releases\`

> Raw HTML such as <b>this</b> is shown as text, never rendered.`;
  return (
    <div className={styles.stack}>
      <Response>{md}</Response>
    </div>
  );
}

export function Streaming() {
  const stream = useFakeStream({ interval: 30 });
  const text =
    "Streaming Markdown stays readable: **bold text**, `inline code` and [links](https://example.com) render as they will when complete.\n\n```ts\nexport function add(a: number, b: number) {\n  return a + b;\n}\n```\n\nThe open code fence above was closed while it streamed.";
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <Button onClick={() => stream.start(text)} disabled={stream.status !== "ready"}>
          Stream
        </Button>
        <span className={styles.muted}>Status: {stream.status}</span>
      </div>
      <Response streaming={stream.status === "streaming"}>{stream.text || "_Press Stream._"}</Response>
    </div>
  );
}

export function Citations() {
  return (
    <div className={styles.stack}>
      <Response citations={demoSources}>
        {"Employees get **16 weeks** of paid parental leave [1], which can be split into up to three blocks [2]. Requests go through the HR portal 8 weeks ahead [3]. Unknown markers like [9] stay as text."}
      </Response>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "response",
  title: "Response",
  category: "AI",
  description:
    "Renders an assistant's Markdown answer (GFM tables, task lists, code) and stays tidy while it streams. Raw HTML is never rendered; [n] markers can become inline citations.",
  imports: `import { Response } from "@/components/ui/response/response";
import { closeMarkdown } from "@/components/ui/response/close-markdown";`,
  examples: examples(raw, [
    ["Markdown", Markdown, { title: "GitHub-flavoured Markdown", wide: true }],
    ["Streaming", Streaming, { title: "Streaming", description: "Half-written syntax is closed on the fly with closeMarkdown().", wide: true }],
    ["Citations", Citations, { title: "Citation markers", description: "Hover or activate a number to see its source.", wide: true }],
  ]),
  props: [
    {
      component: "Response",
      note: "Also accepts div props. Memoised: it re-renders only when its text or options change.",
      rows: [
        { name: "children", type: "string", required: true, description: "Markdown (partial while streaming)." },
        { name: "streaming", type: "boolean", default: "false", description: "Close incomplete syntax and defer rendering while tokens arrive." },
        { name: "citations", type: "CitationSource[]", description: "Sources for [n] markers (1-based). Numbers without a source stay text." },
        { name: "renderCitation", type: "(indices: number[]) => ReactNode", description: "Custom citation renderer (enables marker parsing on its own)." },
        { name: "components", type: "Components", description: "react-markdown element overrides, merged over the defaults." },
        { name: "highlight", type: "(code, lang) => ReactNode", description: "Syntax highlighter for fenced code (see Code block)." },
        { name: "headingOffset", type: "number", default: "2", description: "Levels added to Markdown headings (# → h3), so answers never compete with the page's h1/h2." },
        { name: "skipHtml", type: "boolean", default: "false", description: "Drop raw HTML instead of showing it as text." },
        { name: "remarkPlugins", type: "PluggableList", description: "Extra remark plugins after remark-gfm." },
      ],
    },
    {
      component: "closeMarkdown(markdown)",
      rows: [],
      note: "Pure function used by streaming: closes an open ``` fence, `code`, **strong**, *em*, _em_, ~~strike~~; turns an incomplete [link](http… into its text; hides incomplete images and half-typed [1 markers. Only the last block is touched. Display-only: never store its output.",
    },
  ],
  a11y: [
    "Links to other sites open in a new tab with rel=\"noreferrer noopener\" and say “(opens in a new tab)”.",
    "Headings are demoted by two levels by default, keeping the page outline intact.",
    "Wide tables and code blocks scroll horizontally and are keyboard-focusable.",
    "Raw HTML is shown as text (or dropped with skipHtml), and unsafe URLs such as javascript: are removed.",
    "Citation chips are named after their source (“Source 1: Parental leave policy (2025)”).",
  ],
};

export default doc;
