import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolState } from "@/registry/bitop/ui/tool/tool";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./tool.tsx?raw";

export function States() {
  const states: ToolState[] = ["pending", "running", "completed"];
  return (
    <div className={styles.stack}>
      {states.map((state) => (
        <Tool key={state} defaultOpen={state === "completed"}>
          <ToolHeader name="search_documents" state={state} />
          <ToolContent>
            <ToolInput input={{ query: "parental leave", top_k: 5, filters: { collection: "handbook" } }} />
            {state === "completed" && <ToolOutput output={{ hits: 3, documents: ["parental-leave.md", "benefits-faq.md", "leave-request.pdf"] }} />}
          </ToolContent>
        </Tool>
      ))}
    </div>
  );
}

export function Failed() {
  return (
    <div className={styles.stack}>
      <Tool defaultOpen>
        <ToolHeader name="send_email" title="Send the summary by email" state="error" />
        <ToolContent>
          <ToolInput input={{ to: "team@example.com", subject: "Weekly summary" }} />
          <ToolOutput errorText="SMTP server refused the connection (421). Try again in a few minutes." />
        </ToolContent>
      </Tool>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "tool",
  title: "Tool",
  category: "AI",
  description: "A collapsible card for one tool call: its name, a status badge, the parameters and the result or error.",
  imports: `import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/components/ui/tool/tool";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["States", States, { title: "Pending, running, completed", wide: true }],
    ["Failed", Failed, { title: "Error", wide: true }],
  ]),
  props: [
    { component: "Tool", note: "Base UI Collapsible.Root props (open, defaultOpen, onOpenChange…).", rows: [] },
    {
      component: "ToolHeader",
      rows: [
        { name: "name", type: "string", required: true, description: "Tool name, shown in monospace." },
        { name: "state", type: '"pending" | "running" | "completed" | "error"', required: true, description: "Status badge." },
        { name: "title", type: "ReactNode", description: "Human title instead of the name." },
        { name: "stateLabel", type: "string", description: "Override the badge text." },
        { name: "icon", type: "ReactNode", description: "Decorative icon (default: wrench)." },
      ],
    },
    { component: "ToolContent", rows: [], note: "The collapsible panel." },
    { component: "ToolInput", rows: [{ name: "input", type: "unknown", required: true, description: "Pretty-printed as JSON (strings as-is)." }, { name: "label", type: "ReactNode", default: '"Parameters"', description: "Section label." }] },
    {
      component: "ToolOutput",
      rows: [
        { name: "output", type: "unknown", description: "A React node is rendered as-is; anything else as JSON." },
        { name: "errorText", type: "ReactNode", description: "Shown instead of the output when the call failed." },
        { name: "label", type: "ReactNode", description: 'Section label ("Result" / "Error").' },
      ],
    },
  ],
  a11y: [
    "The header is a button (aria-expanded) whose accessible name includes the state, e.g. “search_documents Running”.",
    "State is spelled out in the badge, not shown by colour alone; the running dot's pulse stops under reduced motion.",
    "Long JSON scrolls inside a focusable code block.",
  ],
};

export default doc;
