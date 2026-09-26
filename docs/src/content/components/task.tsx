import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "@/registry/bitop/ui/task/task";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./task.tsx?raw";

export function Tasks() {
  return (
    <div className={styles.stack}>
      <Task defaultOpen>
        <TaskTrigger title="Searched 3 folders for “refund”" />
        <TaskContent>
          <TaskItem>
            Found <TaskItemFile>refunds.md</TaskItemFile> and <TaskItemFile>billing-faq.md</TaskItemFile>
          </TaskItem>
          <TaskItem>Read 2 sections about partial refunds</TaskItem>
        </TaskContent>
      </Task>
      <Task>
        <TaskTrigger title="Checking the ticket history" running />
        <TaskContent>
          <TaskItem>Looking through 40 tickets…</TaskItem>
        </TaskContent>
      </Task>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "task",
  title: "Task",
  category: "AI",
  description: "A collapsible unit of agent work listing what it did and which files it touched.",
  imports: `import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "@/components/ui/task/task";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["Tasks", Tasks, { title: "Finished and running", wide: true }]]),
  props: [
    { component: "Task", note: "Base UI Collapsible.Root props.", rows: [] },
    {
      component: "TaskTrigger",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "What the task is." },
        { name: "running", type: "boolean", default: "false", description: "Shows a loader and says “(in progress)”." },
        { name: "icon", type: "ReactNode", description: "Decorative icon (default: search)." },
      ],
    },
    { component: "TaskContent / TaskItem / TaskItemFile", rows: [], note: "A list of items; TaskItemFile is an inline file chip (icon prop to change the icon)." },
  ],
  a11y: ["The trigger is a button with aria-expanded; a running task says “(in progress)” rather than relying on the animation."],
};

export default doc;
