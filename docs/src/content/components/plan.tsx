import { useEffect, useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Plan, PlanContent, PlanFooter, PlanHeader, PlanStep } from "@/registry/bitop/ui/plan/plan";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./plan.tsx?raw";

export function Streaming() {
  const steps = ["Snapshot the production database", "Run the migration on a staging copy", "Compare row counts", "Switch traffic to the new schema"];
  const [shown, setShown] = useState(steps.length);
  useEffect(() => {
    if (shown >= steps.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 700);
    return () => clearTimeout(t);
  }, [shown, steps.length]);
  const streaming = shown < steps.length;
  return (
    <div className={styles.stack}>
      <Plan streaming={streaming}>
        <PlanHeader title="Migrate the billing schema" description={`${steps.length} steps · about 20 minutes`} />
        <PlanContent>
          {steps.slice(0, shown).map((s, i) => (
            <PlanStep key={s} status={i === 0 ? "complete" : i === 1 ? "active" : "pending"}>
              {s}
            </PlanStep>
          ))}
        </PlanContent>
        <PlanFooter>
          <Button variant="secondary" size="sm" onClick={() => setShown(0)}>
            Replay
          </Button>
          <Button size="sm" disabled={streaming}>
            Approve plan
          </Button>
        </PlanFooter>
      </Plan>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "plan",
  title: "Plan",
  category: "AI",
  description: "A card with the agent's proposed steps. While it streams in the title shimmers and the card is marked busy; it can be collapsed.",
  imports: `import { Plan, PlanContent, PlanFooter, PlanHeader, PlanStep } from "@/components/ui/plan/plan";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["Streaming", Streaming, { title: "Streaming plan", wide: true }]]),
  props: [
    { component: "Plan", note: "Base UI Collapsible.Root props; open by default.", rows: [{ name: "streaming", type: "boolean", default: "false", description: "Shimmer the header and set aria-busy." }] },
    {
      component: "PlanHeader",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Names the card (aria-labelledby)." },
        { name: "description", type: "ReactNode", description: "Muted summary." },
        { name: "actions", type: "ReactNode", description: "Extra actions before the collapse toggle." },
        { name: "toggleLabel", type: "string", default: '"Show steps"', description: "Name of the collapse toggle." },
      ],
    },
    { component: "PlanContent", rows: [{ name: "label", type: "string", default: '"Steps"', description: "Name of the ordered list." }] },
    { component: "PlanStep", rows: [{ name: "status", type: '"complete" | "active" | "pending"', default: '"pending"', description: "Marker and spoken status." }] },
    { component: "PlanFooter", rows: [], note: "Right-aligned actions row." },
  ],
  a11y: [
    "The plan is a section named by its title; aria-busy is set while it streams.",
    "Each step says its status (“done”, “in progress”, “to do”); the active one has aria-current=\"step\".",
    "The collapse toggle is a button with aria-expanded.",
  ],
};

export default doc;
