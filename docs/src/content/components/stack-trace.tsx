import { useState } from "react";
import {
  StackTrace,
  StackTraceActions,
  StackTraceContent,
  StackTraceCopyButton,
  StackTraceFrames,
  StackTraceHeader,
  StackTraceTrigger,
  type StackFrame,
} from "@/registry/bitop/ui/stack-trace/stack-trace";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./stack-trace.tsx?raw";

export function NodeError() {
  const trace = `TypeError: Cannot read properties of undefined (reading 'map')
    at renderRows (/app/src/components/table.tsx:42:18)
    at Table (/app/src/components/table.tsx:17:10)
    at renderWithHooks (/app/node_modules/react-dom/cjs/react-dom.development.js:16305:18)
    at mountIndeterminateComponent (/app/node_modules/react-dom/cjs/react-dom.development.js:20074:13)
    at beginWork (/app/node_modules/react-dom/cjs/react-dom.development.js:21587:16)
    at async loadReport (/app/src/routes/report.ts:88:5)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)`;
  const [opened, setOpened] = useState<StackFrame | null>(null);
  return (
    <div className={styles.stack}>
      <StackTrace trace={trace} defaultOpen onFrameClick={setOpened} />
      <p className={styles.muted} role="status">
        {opened ? `Would open ${opened.filePath} at line ${opened.lineNumber}` : "Click a file location to open it."}
      </p>
    </div>
  );
}

export function Firefox() {
  const trace = `RangeError: Invalid time value
formatDate@https://app.example.com/assets/date.js:12:31
InvoiceRow@https://app.example.com/assets/invoices.js:88:14
@https://app.example.com/assets/vendor.js:1:4410`;
  return (
    <div className={styles.stack}>
      <StackTrace trace={trace} />
    </div>
  );
}

export function Composed() {
  const trace = `Error: connect ECONNREFUSED 127.0.0.1:5432
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1555:16)
    at Pool.connect (/srv/api/node_modules/pg-pool/index.js:45:11)
    at getUser (/srv/api/src/db/users.ts:21:20)`;
  return (
    <div className={styles.stack}>
      <StackTrace trace={trace} defaultOpen>
        <StackTraceHeader>
          <StackTraceTrigger />
          <StackTraceActions>
            <StackTraceCopyButton showText />
          </StackTraceActions>
        </StackTraceHeader>
        <StackTraceContent>
          <StackTraceFrames internalFrames="hide" maxHeight="12rem" />
        </StackTraceContent>
      </StackTrace>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "stack-trace",
  title: "Stack trace",
  category: "AI",
  description: "A parsed JavaScript error stack: error type and message, frames with file, line and column, folded internal frames and a copy button.",
  imports: `import { StackTrace, parseStackTrace } from "@/components/ui/stack-trace/stack-trace";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["NodeError", NodeError, { title: "Node / V8 with frame clicks", description: "Runs of node_modules and node: frames fold into “N internal frames”.", wide: true }],
    ["Firefox", Firefox, { title: "Firefox / Safari format", wide: true }],
    ["Composed", Composed, { title: "Composed, internal frames hidden", wide: true }],
  ]),
  props: [
    {
      component: "StackTrace",
      note: "Also accepts native <div> props. Without children it renders the header (trigger + copy) and the frames.",
      rows: [
        { name: "trace", type: "string", required: true, description: "The stack string, usually error.stack." },
        { name: "open / defaultOpen", type: "boolean", default: "false", description: "Frames panel state." },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when the panel opens or closes." },
        { name: "onFrameClick", type: "(frame: StackFrame) => void", description: "Makes each file location a button." },
        { name: "isInternalFrame", type: "(location: string) => boolean", description: "Override which frames count as internal." },
      ],
    },
    {
      component: "StackTraceFrames",
      rows: [
        { name: "internalFrames", type: '"collapse" | "show" | "hide"', default: '"collapse"', description: "What to do with internal frames." },
        { name: "maxHeight", type: "string", default: '"24rem"', description: "Any CSS length; the list scrolls beyond it." },
      ],
    },
    {
      component: "StackTraceHeader / StackTraceTrigger / StackTraceActions / StackTraceCopyButton / StackTraceContent",
      rows: [],
      note: "Composition parts. parseStackTrace(), parseStackFrame() and formatFrameLocation() are exported for use outside the component.",
    },
  ],
  a11y: [
    "The header is a button (aria-expanded) whose name is the error; the copy button sits beside it, not inside it.",
    "The frame list is a focusable, scrollable region named by the error. Internal-frame groups are their own disclosure buttons.",
    "Internal frames are quieter but keep 4.5:1 contrast; the error type is text, not just red.",
  ],
};

export default doc;
