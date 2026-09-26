import { useState } from "react";
import { Checkpoint } from "@/registry/bitop/ui/checkpoint/checkpoint";
import { Message, MessageContent } from "@/registry/bitop/ui/message/message";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./checkpoint.tsx?raw";

export function Divider() {
  const [restored, setRestored] = useState(false);
  return (
    <div className={styles.stack}>
      <Message from="user">
        <MessageContent>Rename every file to kebab-case.</MessageContent>
      </Message>
      <Checkpoint time="10:42" onRestore={() => setRestored(true)} />
      <Message from="assistant">
        <MessageContent>{restored ? "Restored to 10:42. The files are back to their old names." : "Done: 18 files renamed."}</MessageContent>
      </Message>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "checkpoint",
  title: "Checkpoint",
  category: "AI",
  description: "A divider in the conversation marking a saved state, with a Restore button to roll back to it.",
  imports: `import { Checkpoint } from "@/components/ui/checkpoint/checkpoint";`,
  examples: examples(raw, [["Divider", Divider, { title: "Restore point", wide: true }]]),
  props: [
    {
      component: "Checkpoint",
      rows: [
        { name: "label", type: "string", default: '"Checkpoint"', description: "Visible label and group name." },
        { name: "time", type: "ReactNode", description: "When it was taken." },
        { name: "onRestore", type: "() => void", description: "Shows the Restore button." },
        { name: "restoreLabel", type: "string", default: '"Restore"', description: "Button text." },
        { name: "name", type: "string", description: "Plain-text name for the group and button (defaults to label + time)." },
      ],
    },
  ],
  a11y: ["A group named “Checkpoint 10:42”; the button is “Restore checkpoint 10:42”, so several are distinguishable.", "The lines are decorative."],
};

export default doc;
