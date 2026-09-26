import { RefreshCw, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageBranch,
  MessageBranchContent,
  MessageBranchSelector,
  MessageContent,
  MessageCopyAction,
} from "@/registry/bitop/ui/message/message";
import { Response } from "@/registry/bitop/ui/response/response";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./message.tsx?raw";

export function Turns() {
  const answer = "The **Q3 roadmap** has three themes: faster search, SSO for every plan and a new billing page.";
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return (
    <div className={styles.stack}>
      <Message from="user">
        <MessageContent>What's on the Q3 roadmap?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageContent>
          <Response>{answer}</Response>
        </MessageContent>
        <MessageActions>
          <MessageCopyAction value={answer} />
          <MessageAction label="Regenerate" onClick={() => toast.info("Regenerating…")}>
            <RefreshCw aria-hidden />
          </MessageAction>
          <MessageAction label="Good response" pressed={vote === "up"} onClick={() => setVote(vote === "up" ? null : "up")}>
            <ThumbsUp aria-hidden />
          </MessageAction>
          <MessageAction label="Bad response" pressed={vote === "down"} onClick={() => setVote(vote === "down" ? null : "down")}>
            <ThumbsDown aria-hidden />
          </MessageAction>
        </MessageActions>
      </Message>
    </div>
  );
}

export function Avatars() {
  return (
    <div className={styles.stack}>
      <Message from="user">
        <MessageAvatar name="Ada Lovelace" />
        <MessageContent>Can you check my numbers?</MessageContent>
      </Message>
      <Message from="assistant">
        <MessageAvatar name="Assistant" />
        <MessageContent>They add up: 12 + 30 = 42.</MessageContent>
        <MessageActions visibility="hover">
          <MessageCopyAction value="They add up: 12 + 30 = 42." />
        </MessageActions>
      </Message>
    </div>
  );
}

export function Branches() {
  const versions = [
    "Paris is the capital of France.",
    "The capital of France is **Paris**, on the Seine.",
    "France's capital is Paris, its largest city.",
  ];
  return (
    <div className={styles.stack}>
      <MessageBranch defaultBranch={2}>
        <MessageBranchContent>
          {versions.map((v) => (
            <Message key={v} from="assistant">
              <MessageContent>
                <Response>{v}</Response>
              </MessageContent>
            </Message>
          ))}
        </MessageBranchContent>
        <MessageActions>
          <MessageBranchSelector />
        </MessageActions>
      </MessageBranch>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "message",
  title: "Message",
  category: "AI",
  description: "One turn of a chat: the user's message as a bubble, the assistant's as full-width prose, with an optional avatar, action buttons and alternative versions.",
  imports: `import {
  Message,
  MessageAction,
  MessageActions,
  MessageAvatar,
  MessageContent,
  MessageCopyAction,
} from "@/components/ui/message/message";`,
  examples: examples(raw, [
    ["Turns", Turns, { title: "User and assistant with actions", wide: true }],
    ["Avatars", Avatars, { title: "Avatars and hover-revealed actions", wide: true }],
    ["Branches", Branches, { title: "Alternative responses", wide: true }],
  ]),
  props: [
    {
      component: "Message",
      note: "An <article>; accepts article props.",
      rows: [
        { name: "from", type: '"user" | "assistant"', required: true, description: "Who is speaking: sets layout and the default label." },
        { name: "label", type: "string", default: '"You said" / "Assistant said"', description: "Accessible name of the turn." },
      ],
    },
    { component: "MessageContent", rows: [{ name: "variant", type: '"bubble" | "plain"', description: "Defaults to bubble for the user, plain for the assistant." }] },
    { component: "MessageAvatar", rows: [{ name: "name", type: "string", required: true, description: "For the initials." }, { name: "src", type: "string", description: "Image URL." }, { name: "children", type: "ReactNode", description: "Custom content (a logo)." }] },
    {
      component: "MessageActions",
      rows: [
        { name: "label", type: "string", default: '"Message actions"', description: "Name of the group." },
        { name: "visibility", type: '"always" | "hover"', default: '"always"', description: "hover fades the actions in on hover or focus (always visible on touch)." },
      ],
    },
    {
      component: "MessageAction",
      note: "An IconButton with a tooltip; accepts button props.",
      rows: [
        { name: "label", type: "string", required: true, description: "Accessible name and tooltip." },
        { name: "pressed", type: "boolean", description: "Toggle state (thumbs up / down): sets aria-pressed." },
        { name: "tooltip", type: "ReactNode", description: "Tooltip text if different from the label." },
        { name: "children", type: "ReactNode", required: true, description: "The icon (aria-hidden)." },
      ],
    },
    { component: "MessageCopyAction", rows: [{ name: "value", type: "string", required: true, description: "Text to copy." }, { name: "label", type: "string", default: '"Copy message"', description: "Accessible name." }, { name: "onCopy", type: "(text) => void", description: "After a successful copy." }] },
    {
      component: "MessageBranch / MessageBranchContent / MessageBranchSelector",
      rows: [
        { name: "branch / defaultBranch / onBranchChange", type: "number / number / (index) => void", description: "Controlled or uncontrolled current version (0-based)." },
        { name: "noun", type: "string", default: '"response"', description: "Used in labels: “Previous response”, “Response 2 of 3”." },
      ],
    },
  ],
  a11y: [
    "Each turn is an article named “You said” or “Assistant said”, so screen-reader users can jump between turns.",
    "Action buttons have accessible names and tooltips; feedback buttons use aria-pressed so their state is announced.",
    "Copying is confirmed with a check mark and a polite announcement.",
    "Hover-revealed actions are also revealed by keyboard focus and are always visible on touch screens.",
    "The avatar is decorative: the article label already says who is speaking.",
  ],
};

export default doc;
