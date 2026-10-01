import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import {
  Conversation,
  ConversationAnnouncer,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/registry/bitop/ui/conversation/conversation";
import { Message, MessageContent } from "@/registry/bitop/ui/message/message";
import { Response } from "@/registry/bitop/ui/response/response";
import { Suggestion, Suggestions } from "@/registry/bitop/ui/suggestion/suggestion";
import { useFakeStream } from "../ai-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./conversation.tsx?raw";

export function StreamingLog() {
  const stream = useFakeStream({ interval: 20 });
  const [turns, setTurns] = useState<string[]>(["Summarise the incident report.", "Sure — the outage lasted **42 minutes** and affected the EU region."]);
  const busy = stream.status !== "ready";
  const answer = "Here is a longer answer so you can watch the log follow it.\n\n" + "- A point that adds a line\n".repeat(14) + "\nScroll up while it streams: the log stops following and a button takes you back.";
  return (
    <div className={styles.stack}>
      <div className={styles.frame}>
        <Conversation>
          <ConversationContent>
            {turns.map((t, i) => (
              <Message key={i} from={i % 2 === 0 ? "user" : "assistant"}>
                <MessageContent>{i % 2 === 0 ? t : <Response>{t}</Response>}</MessageContent>
              </Message>
            ))}
            {stream.status !== "ready" || stream.text ? (
              <Message from="assistant">
                <MessageContent>
                  <Response streaming={stream.status === "streaming"}>{stream.text}</Response>
                </MessageContent>
              </Message>
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      <div className={styles.row}>
        <Button
          disabled={busy}
          onClick={() => {
            if (stream.text) setTurns((t) => [...t, "Show me more.", stream.text]);
            else setTurns((t) => [...t, "Show me more."]);
            stream.start(answer);
          }}
        >
          Stream a reply
        </Button>
        <Button variant="secondary" disabled={!busy} onClick={stream.stop}>
          Stop
        </Button>
      </div>
      <ConversationAnnouncer status={stream.status} />
    </div>
  );
}

export function Empty() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className={styles.frame}>
      <Conversation>
        <ConversationEmptyState
          icon={<Sparkles />}
          title="How can I help today?"
          description={picked ? `You picked: “${picked}”` : "Ask about policies, projects or anything in your workspace."}
        >
          <Suggestions>
            {["Summarise my unread threads", "Draft a status update", "What changed in the travel policy?"].map((s) => (
              <Suggestion key={s} suggestion={s} onSelect={setPicked} />
            ))}
          </Suggestions>
        </ConversationEmptyState>
      </Conversation>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "conversation",
  title: "Conversation",
  category: "AI",
  description:
    "The scrolling message log of a chat. It sticks to the bottom while an answer streams, lets go when the user scrolls up, and offers a button back to the latest message.",
  imports: `import {
  Conversation,
  ConversationAnnouncer,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ui/conversation/conversation";`,
  examples: examples(raw, [
    ["StreamingLog", StreamingLog, { title: "Stick to bottom while streaming", description: "Scroll up during the stream to release it.", wide: true }],
    ["Empty", Empty, { title: "Empty state with suggestions", wide: true }],
  ]),
  props: [
    {
      component: "Conversation",
      note: "Also accepts div props for the outer element.",
      rows: [
        { name: "aria-label", type: "string", default: '"Conversation"', description: "Accessible name of the log." },
        { name: "live", type: '"off" | "polite"', default: '"off"', description: "aria-live of the log. Keep it off and render ConversationAnnouncer." },
        { name: "threshold", type: "number", default: "64", description: "Pixels from the bottom that still count as “at the bottom”." },
        { name: "stickToBottom", type: "boolean", default: "true", description: "Follow new content to the bottom. Pass false while the conversation is empty, so a welcome taller than the panel starts at its top; turning it on pins to the bottom." },
        { name: "viewportClassName", type: "string", description: "Class for the inner scrolling element." },
      ],
    },
    { component: "ConversationContent", rows: [], note: "The growing column of messages (a div, max 48rem wide, centred). Its size changes drive stick-to-bottom." },
    {
      component: "ConversationEmptyState",
      rows: [
        { name: "title", type: "ReactNode", default: '"How can I help?"', description: "Greeting." },
        { name: "description", type: "ReactNode", description: "Supporting text." },
        { name: "icon", type: "ReactNode", description: "Decorative icon, shown in a tinted tile." },
        { name: "media", type: "ReactNode", description: "Decorative media shown as-is instead of the icon tile, e.g. <MessageAvatar name=… color=… size=\"xl\" />." },
        { name: "titleAs", type: '"h1" | "h2" | "h3" | "p"', default: '"p"', description: "Render the title as a heading." },
        { name: "children", type: "ReactNode", description: "Usually Suggestions." },
      ],
    },
    { component: "ConversationScrollButton", rows: [{ name: "label", type: "string", default: '"Scroll to latest message"', description: "Accessible name and tooltip." }] },
    {
      component: "ConversationAnnouncer",
      rows: [
        { name: "status", type: '"ready" | "submitted" | "streaming" | "error"', required: true, description: "The chat status; transitions are announced." },
        { name: "messages", type: "Partial<Record<…, string>>", description: 'Override "Message sent", "Assistant is responding", "Response complete", "The response failed".' },
      ],
    },
    {
      component: "useStickToBottom / nextStickState",
      rows: [],
      note: "The behaviour on its own for custom layouts: useStickToBottom({ threshold, enabled }) returns viewportRef, contentRef, atBottom, scrollToBottom() and scrollToElement(el, { offset }) (stop following and show an element from its start, such as an answer that arrived whole); nextStickState() is the pure reducer it uses.",
    },
  ],
  a11y: [
    'The viewport is role="log" with aria-live="off": a polite log would read every streamed token. Render one ConversationAnnouncer (a polite role="status") to say "Assistant is responding" and "Response complete"; users then read the answer at their own pace.',
    "Each Message is an article (“You said”, “Assistant said”), so screen-reader users can move turn by turn.",
    "The viewport is focusable (tabIndex 0) so keyboard users can scroll it; ↑, PageUp and Home release stick-to-bottom like the wheel does.",
    "The scroll button moves focus to the log before it disappears, so focus is never lost.",
    "Following new content uses instant scrolling; the scroll button's smooth scroll is skipped under prefers-reduced-motion.",
  ],
};

export default doc;
