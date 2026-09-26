import { useEffect, useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import {
  Terminal,
  TerminalActions,
  TerminalContent,
  TerminalCopyButton,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from "@/registry/bitop/ui/terminal/terminal";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./terminal.tsx?raw";

export function Basic() {
  const output = [
    "\u001b[1m> bitop-ui@0.1.0 test\u001b[0m",
    "",
    " \u001b[32m✓\u001b[0m tests/forms.test.tsx \u001b[90m(24 tests)\u001b[0m 812ms",
    " \u001b[32m✓\u001b[0m tests/widgets.test.tsx \u001b[90m(31 tests)\u001b[0m 1.2s",
    " \u001b[31m✗\u001b[0m tests/overlays.test.tsx \u001b[90m(12 tests | \u001b[31m1 failed\u001b[90m)\u001b[0m",
    "",
    "\u001b[33mwarn\u001b[0m  act(...) warning in Dialog",
    "\u001b[1m Test Files \u001b[0m \u001b[31m1 failed\u001b[0m | \u001b[32m2 passed\u001b[0m (3)",
  ].join("\n");
  return (
    <div className={styles.stack}>
      <Terminal title="npm test" output={output} />
    </div>
  );
}

export function Streaming() {
  const lines = ["$ npm run build", "vite v8.3.1 building for production...", "\u001b[32m✓\u001b[0m 1284 modules transformed.", "dist/index.html   0.61 kB", "dist/assets/index.js   1,204.33 kB", "\u001b[32m✓ built in 3.21s\u001b[0m"];
  const [count, setCount] = useState(lines.length);
  const streaming = count > 0 && count < lines.length;
  useEffect(() => {
    if (!streaming) return;
    const id = setTimeout(() => setCount((c) => c + 1), 700);
    return () => clearTimeout(id);
  }, [count, streaming]);
  return (
    <div className={styles.stack}>
      <Terminal title="Build" output={lines.slice(0, count).join("\n")} streaming={streaming} onClear={() => setCount(0)} />
      <div className={styles.row}>
        <Button variant="secondary" size="sm" onClick={() => setCount(1)}>
          Run again
        </Button>
      </div>
    </div>
  );
}

export function Composed() {
  return (
    <div className={styles.stack}>
      <Terminal output={"Listening on http://localhost:5173\n\u001b[36m[hmr]\u001b[0m updated /src/App.tsx"} streaming>
        <TerminalHeader>
          <TerminalTitle>Dev server</TerminalTitle>
          <TerminalStatus>Watching</TerminalStatus>
          <TerminalActions>
            <TerminalCopyButton />
          </TerminalActions>
        </TerminalHeader>
        <TerminalContent maxHeight="10rem" />
      </Terminal>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "terminal",
  title: "Terminal",
  category: "AI",
  description: "Command output with ANSI colours, a running status, auto-scroll while streaming, copy and clear.",
  imports: `import { Terminal } from "@/components/ui/terminal/terminal";`,
  examples: examples(raw, [
    ["Basic", Basic, { title: "ANSI colours", description: "SGR colours map to theme tokens, so they keep AA contrast in both themes.", wide: true }],
    ["Streaming", Streaming, { title: "Streaming with clear", wide: true }],
    ["Composed", Composed, { title: "Composed header", wide: true }],
  ]),
  props: [
    {
      component: "Terminal",
      note: "Also accepts native <div> props. Without children it renders the header (title, status, copy, clear) and content.",
      rows: [
        { name: "output", type: "string", required: true, description: "Raw output, ANSI escape codes included." },
        { name: "streaming", type: "boolean", default: "false", description: "Shows “Running” and a cursor; sets aria-busy on the output." },
        { name: "autoScroll", type: "boolean", default: "true", description: "Keep the newest output in view while the user is at the bottom." },
        { name: "onClear", type: "() => void", description: "Shows a clear button." },
        { name: "title", type: "ReactNode", default: '"Terminal"', description: "Title in the default header; names the output region." },
      ],
    },
    {
      component: "TerminalContent",
      rows: [
        { name: "autoScroll", type: "boolean", default: "true", description: "As above, for custom compositions." },
        { name: "maxHeight", type: "string", default: '"24rem"', description: "Any CSS length." },
        { name: "label", type: "string", description: "Region name, if there's no TerminalTitle." },
        { name: "placeholder", type: "ReactNode", default: '"No output"', description: "Shown when the output is empty." },
      ],
    },
    {
      component: "TerminalTitle / TerminalStatus / TerminalCopyButton / TerminalClearButton",
      rows: [],
      note: "TerminalCopyButton copies the output without ANSI codes. TerminalClearButton renders only when Terminal has onClear. parseAnsi() and stripAnsi() are exported.",
    },
  ],
  a11y: [
    "The output is a focusable scroll region named by the title. It is deliberately not a live region, so streamed output doesn't flood screen readers; the status says “Running” and aria-busy is set while streaming.",
    "Colours come from theme text tokens (all ≥ 4.5:1 on the terminal surface); bold, italic and underline are preserved.",
    "The blinking cursor is decorative and stops under reduced motion.",
  ],
};

export default doc;
