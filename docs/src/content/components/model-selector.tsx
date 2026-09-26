import { useState } from "react";
import { ModelSelector } from "@/registry/bitop/ui/model-selector/model-selector";
import { demoModels } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./model-selector.tsx?raw";

export function Picker() {
  const [model, setModel] = useState<string | null>("claude-sonnet");
  return (
    <div className={styles.row}>
      <ModelSelector label="Model" models={demoModels} value={model} onValueChange={setModel} />
      <span className={styles.muted}>Selected: {model ?? "none"}</span>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "model-selector",
  title: "Model selector",
  category: "AI",
  description: "A searchable model picker grouped by provider, with capability badges and context sizes.",
  imports: `import { ModelSelector, type ModelOption } from "@/components/ui/model-selector/model-selector";`,
  baseUi: { name: "Combobox", href: "https://base-ui.com/react/components/combobox" },
  examples: examples(raw, [["Picker", Picker, { title: "Grouped, searchable" }]]),
  props: [
    {
      component: "ModelSelector",
      rows: [
        { name: "models", type: "ModelOption[]", required: true, description: "{ id, name, provider, description?, capabilities?, contextWindow?, icon? }" },
        { name: "label", type: "string", required: true, description: "Accessible name (“Model”)." },
        { name: "value / defaultValue / onValueChange", type: "string | null / … / (id, model) => void", description: "Selected model id." },
        { name: "placeholder", type: "string", default: '"Select a model"', description: "Trigger text with no selection." },
        { name: "searchPlaceholder", type: "string", default: '"Search models…"', description: "Search input placeholder." },
        { name: "emptyText", type: "ReactNode", default: '"No models found."', description: "No matches." },
        { name: "capabilityLabels", type: "Record<string, string>", description: "Badge text per capability id." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Trigger size." },
        { name: "disabled", type: "boolean", description: "Disable the picker." },
      ],
    },
  ],
  a11y: [
    "Base UI Combobox with the input inside the popup: the trigger is a button named “Model: Claude Sonnet”.",
    "Typing filters by name, provider and capability; ↑/↓ move, Enter selects, Esc closes and returns focus to the trigger.",
    "Provider groups are labelled; the selected model has a check mark and aria-selected.",
  ],
};

export default doc;
