import { ArrowUp, X } from "lucide-react";
import { useState } from "react";
import { Queue, QueueContent, QueueHeader, QueueItem, QueueItemAction } from "@/registry/bitop/ui/queue/queue";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./queue.tsx?raw";

export function Queued() {
  const [items, setItems] = useState(["Also compare it with last year", "Then draft an email to the team"]);
  return (
    <div className={styles.stack}>
      <Queue defaultOpen>
        <QueueHeader title="Queued messages" count={items.length} />
        <QueueContent label="Queued messages">
          {items.map((m) => (
            <QueueItem
              key={m}
              actions={
                <>
                  <QueueItemAction label="Send now" icon={<ArrowUp aria-hidden />} onClick={() => setItems((all) => all.filter((x) => x !== m))} />
                  <QueueItemAction label="Remove" icon={<X aria-hidden />} onClick={() => setItems((all) => all.filter((x) => x !== m))} />
                </>
              }
            >
              {m}
            </QueueItem>
          ))}
        </QueueContent>
      </Queue>
      <Queue defaultOpen>
        <QueueHeader title="To-dos" count={3} />
        <QueueContent label="To-dos">
          <QueueItem completed>Collect the Q3 numbers</QueueItem>
          <QueueItem completed description="3 files">
            Read the board notes
          </QueueItem>
          <QueueItem>Write the summary</QueueItem>
        </QueueContent>
      </Queue>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "queue",
  title: "Queue",
  category: "AI",
  description: "Messages waiting to be sent while the assistant is busy, or an agent's to-do list, in a collapsible card with row actions.",
  imports: `import { Queue, QueueContent, QueueHeader, QueueItem, QueueItemAction } from "@/components/ui/queue/queue";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["Queued", Queued, { title: "Queued messages and to-dos", wide: true }]]),
  props: [
    { component: "Queue", note: "Base UI Collapsible.Root props.", rows: [] },
    { component: "QueueHeader", rows: [{ name: "title", type: "ReactNode", required: true, description: "Trigger text." }, { name: "count", type: "number", description: "Count chip (“2 items”)." }] },
    { component: "QueueContent", rows: [{ name: "label", type: "string", description: "Name of the list." }] },
    {
      component: "QueueItem",
      rows: [
        { name: "completed", type: "boolean", default: "false", description: "Struck through and read as “(done)”." },
        { name: "description", type: "ReactNode", description: "Muted detail." },
        { name: "actions", type: "ReactNode", description: "Row actions, revealed on hover or focus." },
      ],
    },
    { component: "QueueItemAction", note: "An IconButton with a tooltip.", rows: [{ name: "label", type: "string", required: true, description: "Name and tooltip." }] },
  ],
  a11y: ["Completion is spoken, not only shown by strike-through.", "Row actions appear on hover and on keyboard focus, and are always visible on touch screens."],
};

export default doc;
