/*
 * A complete RAG chat built from the bitop-ui AI items, with a simulated
 * stream (no network): reasoning → a tool call → an answer with inline
 * citations → sources. Stop works at every stage.
 */
import { BookOpenText, FileText, Globe, RefreshCw, SquarePen, ThumbsDown, ThumbsUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { Context } from "@/registry/bitop/ui/context/context";
import {
  Conversation,
  ConversationAnnouncer,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/registry/bitop/ui/conversation/conversation";
import type { CitationSource } from "@/registry/bitop/ui/inline-citation/inline-citation";
import { Loader } from "@/registry/bitop/ui/loader/loader";
import { Message, MessageAction, MessageActions, MessageContent, MessageCopyAction } from "@/registry/bitop/ui/message/message";
import { ModelSelector } from "@/registry/bitop/ui/model-selector/model-selector";
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
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/registry/bitop/ui/reasoning/reasoning";
import { Response } from "@/registry/bitop/ui/response/response";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/registry/bitop/ui/sources/sources";
import { Suggestion, Suggestions } from "@/registry/bitop/ui/suggestion/suggestion";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolState } from "@/registry/bitop/ui/tool/tool";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { demoModels, demoSources, tokenize } from "../content/ai-demo";
import styles from "./chat-demo.module.css";

type Status = "ready" | "submitted" | "streaming" | "error";

type AssistantTurn = {
  id: number;
  role: "assistant";
  prompt: string;
  reasoning: string;
  reasoningStreaming: boolean;
  tool?: { name: string; state: ToolState; input: unknown; output?: unknown };
  text: string;
  streaming: boolean;
  sources: CitationSource[];
  stopped: boolean;
  vote: "up" | "down" | null;
};
type UserTurn = { id: number; role: "user"; text: string; files: string[] };
type Turn = UserTurn | AssistantTurn;

type Script = { reasoning: string; query: string; answer: string; sources: CitationSource[] };

function scriptFor(prompt: string): Script {
  if (/request|apply|how do i|process/i.test(prompt)) {
    return {
      reasoning: "They want the **process**, not the entitlement. The request PDF has the steps and the deadline; the FAQ covers splitting the leave.",
      query: "how to request parental leave",
      sources: [demoSources[2]!, demoSources[1]!],
      answer: `Here's how to request parental leave:

1. **Tell your manager** about your plans as early as you can.
2. **Submit the request in the HR portal** at least **8 weeks** before your start date [1].
3. If you want to split it, add each block (minimum two weeks) to the same request [2].

\`\`\`text
HR portal → Time off → New request → Parental leave
\`\`\`

You'll get an email once HR approves it, usually within five working days [1].`,
    };
  }
  return {
    reasoning:
      "The question is about parental leave. I'll search the handbook, then check the 2025 policy for duration and pay, and the FAQ for whether it can be split. Cite each claim.",
    query: "parental leave duration pay split",
    sources: demoSources,
    answer: `Under the **2025 parental leave policy**, eligible employees get **16 weeks of fully paid leave** [1]. It applies to birth, adoption and foster parents, and can be taken any time within 12 months of the child's arrival [1].

| | Details |
| --- | --- |
| Duration | 16 weeks, fully paid |
| Window | Within 12 months |
| Split | Up to 3 blocks of 2+ weeks [2] |

To take it, submit a request in the HR portal at least **8 weeks** before you start [3]. Want me to draft the request?`,
  };
}

const suggestions = ["What is our parental leave policy?", "How do I request parental leave?", "Can I split my leave into blocks?"];

let nextId = 1;

export function ChatDemo() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [model, setModel] = useState<string | null>("claude-sonnet");
  const [web, setWeb] = useState(false);
  const run = useRef(0);
  useEffect(() => () => void run.current++, []);

  const update = (id: number, patch: (t: AssistantTurn) => Partial<AssistantTurn>) =>
    setTurns((all) => all.map((t) => (t.id === id && t.role === "assistant" ? { ...t, ...patch(t) } : t)));

  async function respond(prompt: string, replaceId?: number) {
    const token = ++run.current;
    const alive = () => run.current === token;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const script = scriptFor(prompt);
    const id = replaceId ?? nextId++;
    const fresh: AssistantTurn = { id, role: "assistant", prompt, reasoning: "", reasoningStreaming: false, text: "", streaming: false, sources: [], stopped: false, vote: null };
    setTurns((all) => (replaceId ? all.map((t) => (t.id === replaceId ? fresh : t)) : [...all, fresh]));
    setStatus("submitted");

    await sleep(700);
    if (!alive()) return;
    setStatus("streaming");
    update(id, () => ({ reasoningStreaming: true }));
    let acc = "";
    for (const tok of tokenize(script.reasoning)) {
      acc += tok;
      const text = acc;
      update(id, () => ({ reasoning: text }));
      await sleep(22);
      if (!alive()) return;
    }
    update(id, () => ({ reasoningStreaming: false, tool: { name: "search_handbook", state: "running", input: { query: script.query, top_k: 5 } } }));
    await sleep(1200);
    if (!alive()) return;
    const output = { results: script.sources.map((s, i) => ({ rank: i + 1, title: s.title, score: Math.round((0.93 - i * 0.07) * 100) / 100 })) };
    update(id, (t) => ({ tool: { ...t.tool!, state: "completed", output }, sources: script.sources, streaming: true }));
    acc = "";
    for (const tok of tokenize(script.answer)) {
      acc += tok;
      const text = acc;
      update(id, () => ({ text }));
      await sleep(18);
      if (!alive()) return;
    }
    update(id, () => ({ streaming: false }));
    setStatus("ready");
  }

  function stop() {
    run.current++;
    setTurns((all) =>
      all.map((t) =>
        t.role === "assistant" && (t.streaming || t.reasoningStreaming || t.tool?.state === "running" || (!t.text && !t.stopped))
          ? { ...t, streaming: false, reasoningStreaming: false, stopped: true, tool: t.tool && t.tool.state === "running" ? { ...t.tool, state: "error" } : t.tool }
          : t,
      ),
    );
    setStatus("ready");
  }

  function send(text: string, files: File[] = []) {
    setTurns((all) => [...all, { id: nextId++, role: "user", text, files: files.map((f) => f.name) }]);
    void respond(text);
  }

  function newChat() {
    run.current++;
    setTurns([]);
    setStatus("ready");
  }

  const chars = turns.reduce((n, t) => n + t.text.length + (t.role === "assistant" ? t.reasoning.length : 0), 0);
  const usedTokens = 1_800 + Math.round(chars / 4) * 12;
  const busy = status !== "ready";

  return (
    <div className={styles.app} data-chat-demo="">
      <header className={styles.bar}>
        <ModelSelector label="Model" size="sm" models={demoModels} value={model} onValueChange={setModel} />
        <div className={styles.barEnd}>
          <Context
            usedTokens={usedTokens}
            maxTokens={200_000}
            modelName={demoModels.find((m) => m.id === model)?.name}
            usage={{ input: Math.round(usedTokens * 0.7), output: Math.round(usedTokens * 0.22), reasoning: Math.round(usedTokens * 0.08) }}
            cost={{ total: usedTokens * 0.000006 }}
          />
          <Tooltip content="New chat">
            <IconButton size="sm" icon={<SquarePen aria-hidden />} label="New chat" onClick={newChat} disabled={turns.length === 0} />
          </Tooltip>
        </div>
      </header>

      <Conversation className={styles.conversation} aria-label="Chat with the handbook assistant">
        {turns.length === 0 ? (
          <ConversationEmptyState
            icon={<BookOpenText />}
            title="Ask the handbook"
            description="Answers come from your company's policies, with sources you can check."
          >
            <Suggestions>
              {suggestions.map((s) => (
                <Suggestion key={s} suggestion={s} onSelect={(text) => send(text)} />
              ))}
            </Suggestions>
          </ConversationEmptyState>
        ) : (
          <ConversationContent>
            {turns.map((turn) =>
              turn.role === "user" ? (
                <Message key={turn.id} from="user">
                  {turn.files.length > 0 && (
                    <div className={styles.userFiles}>
                      {turn.files.map((f) => (
                        <span key={f} className={styles.userFile}>
                          <FileText aria-hidden />
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                  <MessageContent>{turn.text}</MessageContent>
                </Message>
              ) : (
                <AssistantMessage
                  key={turn.id}
                  turn={turn}
                  last={turn.id === turns[turns.length - 1]?.id}
                  busy={busy}
                  onVote={(vote) => update(turn.id, (t) => ({ vote: t.vote === vote ? null : vote }))}
                  onRetry={() => void respond(turn.prompt, turn.id)}
                />
              ),
            )}
          </ConversationContent>
        )}
        <ConversationScrollButton />
      </Conversation>

      <div className={styles.composer}>
        <PromptInput status={status} onStop={stop} attachments accept="image/*,.pdf,.md,.txt,.docx" onSubmit={({ text, files }) => send(text, files)}>
          <PromptInputAttachments />
          <PromptInputTextarea placeholder="Ask about a policy…" maxLength={4000} />
          <PromptInputToolbar>
            <PromptInputTools>
              <PromptInputAttachButton />
              <PromptInputButton label="Search the web" showLabel pressed={web} onClick={() => setWeb(!web)}>
                <Globe aria-hidden />
              </PromptInputButton>
            </PromptInputTools>
            <PromptInputSubmit />
          </PromptInputToolbar>
        </PromptInput>
        <p className={styles.disclaimer}>Simulated responses — nothing leaves your browser.</p>
      </div>
      <ConversationAnnouncer status={status} />
    </div>
  );
}

type AssistantMessageProps = {
  turn: AssistantTurn;
  last: boolean;
  busy: boolean;
  onVote: (vote: "up" | "down") => void;
  onRetry: () => void;
};

function AssistantMessage({ turn, last, busy, onVote, onRetry }: AssistantMessageProps) {
  const waiting = !turn.reasoning && !turn.stopped;
  const done = !turn.streaming && !turn.reasoningStreaming && (turn.text !== "" || turn.stopped) && !(last && busy);
  return (
    <Message from="assistant">
      <MessageContent className={styles.assistant}>
        {waiting && <Loader label="Waiting for a response" />}
        {turn.reasoning && (
          <Reasoning streaming={turn.reasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>
              <Response streaming={turn.reasoningStreaming}>{turn.reasoning}</Response>
            </ReasoningContent>
          </Reasoning>
        )}
        {turn.tool && (
          <Tool>
            <ToolHeader name={turn.tool.name} title="Searched the handbook" state={turn.tool.state} stateLabel={turn.tool.state === "error" ? "Stopped" : undefined} />
            <ToolContent>
              <ToolInput input={turn.tool.input} />
              <ToolOutput output={turn.tool.output} />
            </ToolContent>
          </Tool>
        )}
        {turn.text && (
          <Response streaming={turn.streaming} citations={turn.sources}>
            {turn.text}
          </Response>
        )}
        {turn.stopped && <p className={styles.stopped}>Response stopped.</p>}
        {!turn.streaming && turn.text && turn.sources.length > 0 && (
          <Sources>
            <SourcesTrigger count={turn.sources.length} />
            <SourcesContent>
              {turn.sources.map((s, i) => (
                <Source key={s.title} index={i + 1} title={s.title} href={s.href} meta={s.siteName} description={s.description} />
              ))}
            </SourcesContent>
          </Sources>
        )}
      </MessageContent>
      {done && (
        <MessageActions visibility={last ? "always" : "hover"}>
          {turn.text && <MessageCopyAction value={turn.text} />}
          <MessageAction label="Regenerate" onClick={onRetry} disabled={busy}>
            <RefreshCw aria-hidden />
          </MessageAction>
          <MessageAction label="Good response" pressed={turn.vote === "up"} onClick={() => onVote("up")}>
            <ThumbsUp aria-hidden />
          </MessageAction>
          <MessageAction label="Bad response" pressed={turn.vote === "down"} onClick={() => onVote("down")}>
            <ThumbsDown aria-hidden />
          </MessageAction>
        </MessageActions>
      )}
    </Message>
  );
}
