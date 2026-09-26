import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools } from "@/registry/bitop/ui/agent/agent";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./agent.tsx?raw";

export function ResearchAgent() {
  return (
    <div className={styles.stack}>
      <Agent>
        <AgentHeader name="Policy research assistant" model="claude-sonnet-4" />
        <AgentContent>
          <AgentInstructions>
            {`You answer staff questions about HR and IT policy.
Search the handbook before answering, cite every source, and say so when the handbook doesn't cover a question.`}
          </AgentInstructions>
          <AgentTools defaultValue={["search_handbook"]}>
            <AgentTool
              name="search_handbook"
              description="Full-text search over the staff handbook"
              schema={{
                type: "object",
                properties: {
                  query: { type: "string", description: "What to look for" },
                  top_k: { type: "integer", minimum: 1, maximum: 20, default: 5 },
                },
                required: ["query"],
              }}
            />
            <AgentTool
              name="open_ticket"
              description="Create an IT service ticket"
              schema={{
                type: "object",
                properties: { summary: { type: "string" }, priority: { enum: ["low", "normal", "high"] } },
                required: ["summary"],
              }}
            />
            <AgentTool name="current_date" description="Today's date in the user's time zone" />
          </AgentTools>
          <AgentOutput
            schema={`z.object({
  answer: z.string(),
  citations: z.array(z.object({ title: z.string(), url: z.string().url() })),
})`}
          />
        </AgentContent>
      </Agent>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "agent",
  title: "Agent",
  category: "AI",
  description: "A card describing an agent definition: its name and model, system instructions, the tools it can call with their input schemas, and its output schema.",
  imports: `import { Agent, AgentContent, AgentHeader, AgentInstructions, AgentOutput, AgentTool, AgentTools } from "@/components/ui/agent/agent";`,
  baseUi: { name: "Accordion", href: "https://base-ui.com/react/components/accordion" },
  examples: examples(raw, [["ResearchAgent", ResearchAgent, { title: "Agent definition", wide: true }]]),
  props: [
    { component: "Agent", note: "A <section> named by the header's name; native section props.", rows: [] },
    {
      component: "AgentHeader",
      rows: [
        { name: "name", type: "string", required: true, description: "The agent's name; it labels the card." },
        { name: "model", type: "string", description: "Model id, shown as a monospace badge." },
        { name: "icon", type: "ReactNode", description: "Decorative icon (default: bot)." },
        { name: "actions", type: "ReactNode", description: "Extra content on the right." },
      ],
    },
    { component: "AgentContent", note: "Padded column for the sections.", rows: [] },
    { component: "AgentInstructions", rows: [{ name: "label", type: "ReactNode", default: '"Instructions"', description: "Section label. Children keep their line breaks." }] },
    {
      component: "AgentTools",
      note: "Base UI Accordion.Root props (value, defaultValue, multiple…).",
      rows: [{ name: "label", type: "ReactNode", default: '"Tools"', description: "Section label." }],
    },
    {
      component: "AgentTool",
      rows: [
        { name: "name", type: "string", required: true, description: "Tool name; also the accordion value unless `value` is set." },
        { name: "description", type: "ReactNode", description: "Shown next to the name." },
        { name: "schema", type: "unknown", description: "Input schema: objects are pretty-printed JSON, strings shown as-is." },
        { name: "schemaLanguage", type: "string", default: '"json"', description: "Language of a string schema." },
        { name: "headingLevel", type: "2 | 3 | 4 | 5 | 6", default: "3", description: "Heading wrapping the trigger." },
        { name: "disabled", type: "boolean", description: "Disable the item." },
      ],
    },
    {
      component: "AgentOutput",
      rows: [
        { name: "schema", type: "unknown", required: true, description: "Zod / TypeScript source, or a JSON Schema object." },
        { name: "language", type: "string", default: '"typescript"', description: "Language of a string schema." },
        { name: "label", type: "ReactNode", default: '"Output schema"', description: "Section label." },
      ],
    },
  ],
  a11y: [
    "The card is a region named by the agent's name; each section is a group named by its label.",
    "Each tool is a heading containing a button with aria-expanded / aria-controls (Base UI Accordion); Enter and Space toggle it.",
    "The model id is prefixed with visually hidden “Model:” text; schemas scroll inside focusable code blocks.",
  ],
};

export default doc;
