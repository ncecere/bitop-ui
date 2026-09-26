import { Context } from "@/registry/bitop/ui/context/context";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./context.tsx?raw";

export function Usage() {
  return (
    <div className={styles.row}>
      <Context
        usedTokens={42_000}
        maxTokens={200_000}
        modelName="Claude Sonnet"
        usage={{ input: 30_500, output: 8_200, reasoning: 2_300, cached: 1_000 }}
        cost={{ input: 0.0915, output: 0.123, reasoning: 0.0345, cached: 0.0003, total: 0.2493 }}
      />
      <Context usedTokens={160_000} maxTokens={200_000} />
      <Context usedTokens={126_000} maxTokens={128_000} />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "context",
  title: "Context",
  category: "AI",
  description: "How much of the model's context window the conversation uses: a small ring with the percentage that opens a breakdown of input, output, reasoning and cached tokens, and cost.",
  imports: `import { Context } from "@/components/ui/context/context";`,
  baseUi: { name: "Meter", href: "https://base-ui.com/react/components/meter" },
  examples: examples(raw, [["Usage", Usage, { title: "Normal, high and critical", description: "Hover or activate a meter." }]]),
  props: [
    {
      component: "Context",
      rows: [
        { name: "usedTokens", type: "number", required: true, description: "Tokens used." },
        { name: "maxTokens", type: "number", required: true, description: "Context window size." },
        { name: "usage", type: "{ input?, output?, reasoning?, cached? }", description: "Token breakdown rows." },
        { name: "cost", type: "{ input?, output?, reasoning?, cached?, total? }", description: "Cost per row and total, in currency units." },
        { name: "currency", type: "string", default: '"USD"', description: "ISO currency code." },
        { name: "modelName", type: "string", description: "Shown in the card." },
        { name: "label", type: "string", default: '"Context window"', description: "Name of the trigger and meter." },
        { name: "locale", type: "string", description: "Number formatting locale." },
      ],
    },
  ],
  a11y: [
    "The trigger's name carries the numbers: “Context window: 21% used, 42,000 of 200,000 tokens”.",
    'The card uses a Base UI Meter (role="meter" with value and max).',
    "Levels (75% high, 90% critical) change the colour, but the percentage is always shown as text.",
    "It opens on hover and on click / Enter (Base UI Popover); Esc closes it.",
  ],
};

export default doc;
