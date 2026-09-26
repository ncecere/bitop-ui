import { Globe, Mic } from "lucide-react";
import { useState } from "react";
import {
  PromptInput,
  PromptInputAttachButton,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/registry/bitop/ui/prompt-input/prompt-input";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { useFakeStream } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./prompt-input.tsx?raw";

export function Composer() {
  const stream = useFakeStream({ interval: 60, firstTokenDelay: 1200 });
  const [web, setWeb] = useState(false);
  const [sent, setSent] = useState("");
  return (
    <div className={styles.stack}>
      <PromptInput
        status={stream.status}
        onStop={stream.stop}
        onSubmit={({ text }) => {
          setSent(text);
          stream.start("A pretend answer that streams for a few seconds so you can try the Stop button while it runs.");
        }}
      >
        <PromptInputTextarea />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputButton label="Search the web" pressed={web} onClick={() => setWeb(!web)} showLabel>
              <Globe aria-hidden />
            </PromptInputButton>
            <PromptInputButton label="Dictate" onClick={() => toast.info("Dictation isn't part of this demo")}>
              <Mic aria-hidden />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <p className={styles.muted}>
        Status: {stream.status}
        {sent && ` · last message: “${sent}”`}
      </p>
    </div>
  );
}

export function WithAttachments() {
  return (
    <div className={styles.stack}>
      <PromptInput
        attachments
        accept="image/*,.pdf,.md,.txt"
        maxFiles={4}
        maxFileSize={10 * 1024 * 1024}
        onFileError={(e) => toast.error(e.message)}
        onSubmit={({ text, files }) => {
          toast.success(`Sent “${text}”`, `${files.length} attachment(s)`);
        }}
      >
        <PromptInputAttachments />
        <PromptInputTextarea placeholder="Attach, paste or drop files…" maxLength={280} showCount="always" />
        <PromptInputToolbar>
          <PromptInputTools>
            <PromptInputAttachButton />
          </PromptInputTools>
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "prompt-input",
  title: "Prompt input",
  category: "AI",
  description:
    "The chat composer: a form with an autosizing textarea (Enter sends, Shift+Enter adds a line, IME-safe), a toolbar, attachments and a send button that turns into Stop while the answer streams.",
  imports: `import {
  PromptInput,
  PromptInputAttachButton,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from "@/components/ui/prompt-input/prompt-input";`,
  examples: examples(raw, [
    ["Composer", Composer, { title: "Send, then stop", description: "Enter to send, Shift+Enter for a new line.", wide: true }],
    ["WithAttachments", WithAttachments, { title: "Attachments and a character limit", wide: true }],
  ]),
  props: [
    {
      component: "PromptInput",
      note: "A <form>; accepts form props.",
      rows: [
        { name: "onSubmit", type: "({ text, files }, event) => void | boolean | Promise", required: true, description: "Called with the message. Return false (or reject) to keep the draft." },
        { name: "status", type: '"ready" | "submitted" | "streaming" | "error"', default: '"ready"', description: "Drives PromptInputSubmit; submits are ignored while submitted/streaming." },
        { name: "onStop", type: "() => void", description: "Stops the response; enables the Stop button." },
        { name: "disabled", type: "boolean", description: "Disables the textarea and buttons." },
        { name: "attachments", type: "boolean", default: "false", description: "Enable the file picker, paste and drag-and-drop." },
        { name: "accept / multiple / maxFiles / maxFileSize", type: "string / boolean / number / number", description: "File rules (maxFileSize in bytes)." },
        { name: "onFileError", type: "({ code, message, file }) => void", description: "A file was rejected." },
      ],
    },
    {
      component: "PromptInputTextarea",
      note: "Accepts textarea props (value/onChange for controlled use).",
      rows: [
        { name: "placeholder", type: "string", default: '"Ask anything…"', description: "Placeholder." },
        { name: "aria-label", type: "string", default: '"Message"', description: "Accessible name." },
        { name: "maxLength", type: "number", description: "Hard limit with a counter." },
        { name: "showCount", type: '"auto" | "always" | "never"', default: '"auto"', description: "auto shows the counter from 80% of the limit." },
        { name: "submitOnEnter", type: "boolean", default: "true", description: "When false, only Ctrl/⌘+Enter submits." },
      ],
    },
    { component: "PromptInputToolbar / PromptInputTools", rows: [], note: "Layout rows: tools on the left, submit on the right." },
    {
      component: "PromptInputButton",
      rows: [
        { name: "label", type: "string", required: true, description: "Accessible name and tooltip." },
        { name: "showLabel", type: "boolean", description: "Show the label as text next to the icon." },
        { name: "pressed", type: "boolean", description: "Toggle state (aria-pressed)." },
      ],
    },
    {
      component: "PromptInputSubmit",
      rows: [
        { name: "status", type: "ChatStatus", description: "Defaults to PromptInput's." },
        { name: "onStop", type: "() => void", description: "Defaults to PromptInput's." },
        { name: "labels", type: "{ send?, stop?, sending? }", description: '"Send message", "Stop generating", "Sending message".' },
        { name: "showLabel", type: "boolean", default: "false", description: 'Show "Send" / "Stop" as text next to the icon (no tooltip).' },
        { name: "shortLabels", type: "{ send?, stop?, sending? }", description: "The visible text with showLabel; keep each one contained in the matching label (WCAG 2.5.3)." },
      ],
    },
    { component: "PromptInputAttachments / PromptInputAttachButton", rows: [], note: "Chips for the attached files (removing one returns focus to the textarea) and the “Attach files” button." },
  ],
  a11y: [
    "A real form with a labelled textarea (“Message”); Enter submits via requestSubmit, so form semantics and validation still apply.",
    "Enter that confirms an IME composition (Japanese, Chinese, Korean) never submits.",
    "The submit button's name follows the status: “Send message”, “Sending message”, “Stop generating”. It is disabled while the draft is empty.",
    "Focus stays in the textarea after sending; removing an attachment returns focus there.",
    "The counter is linked with aria-describedby; reaching the limit is announced once.",
    "The composer shows a focus ring while the textarea has focus.",
  ],
};

export default doc;
