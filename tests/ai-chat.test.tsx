/*
 * Behaviour tests for the chat essentials: conversation (stick to bottom,
 * announcer), prompt input (keyboard, IME, status labels), reasoning
 * (auto open / close), response, inline citations and copy buttons.
 */
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { CodeBlock } from "@/registry/bitop/ui/code-block/code-block";
import {
  Conversation,
  ConversationAnnouncer,
  ConversationContent,
  ConversationScrollButton,
  initialStickState,
  nextStickState,
} from "@/registry/bitop/ui/conversation/conversation";
import { InlineCitation } from "@/registry/bitop/ui/inline-citation/inline-citation";
import { Message, MessageAction, MessageActions, MessageContent, MessageCopyAction } from "@/registry/bitop/ui/message/message";
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  type ChatStatus,
} from "@/registry/bitop/ui/prompt-input/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/registry/bitop/ui/reasoning/reasoning";
import { Response } from "@/registry/bitop/ui/response/response";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from "@/registry/bitop/ui/tool/tool";
import { Snippet } from "@/registry/bitop/ui/snippet/snippet";

const sources = [
  { title: "Leave policy", href: "https://handbook.example.com/leave", description: "16 weeks paid." },
  { title: "Benefits FAQ", href: "https://people.example.com/faq" },
];

/* ---------------- Conversation ---------------- */

describe("nextStickState", () => {
  const m = (scrollTop: number, scrollHeight = 1000, clientHeight = 400) => ({ scrollTop, scrollHeight, clientHeight });

  it("stays stuck at the bottom and unsticks when the user scrolls up", () => {
    let s = nextStickState(initialStickState, m(600));
    expect(s).toMatchObject({ stuck: true, atBottom: true });
    s = nextStickState(s, m(300)); // same height, moved up: the user
    expect(s).toMatchObject({ stuck: false, atBottom: false });
    s = nextStickState(s, m(560)); // back within the threshold
    expect(s).toMatchObject({ stuck: true, atBottom: true });
  });

  it("keeps stickiness when content shrinks (not a user scroll)", () => {
    let s = nextStickState(initialStickState, m(600, 1000));
    s = nextStickState(s, m(200, 700)); // height changed: a collapse clamped scrollTop
    expect(s.stuck).toBe(true);
  });

  it("treats an upward move right after a gesture as the user's even if content grew", () => {
    let s = nextStickState(initialStickState, m(600, 1000));
    s = nextStickState(s, m(400, 1100), 64, true);
    expect(s.stuck).toBe(false);
  });
});

describe("Conversation", () => {
  function setup() {
    const metrics = { scrollHeight: 1000, clientHeight: 400 };
    function Chat() {
      const [lines, setLines] = useState(["Hello"]);
      return (
        <>
          <button type="button" onClick={() => setLines((l) => [...l, `Line ${l.length}`])}>
            Grow
          </button>
          <Conversation>
            <ConversationContent>
              {lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </>
      );
    }
    const utils = render(<Chat />);
    const log = screen.getByRole("log", { name: "Conversation" });
    Object.defineProperty(log, "scrollHeight", { configurable: true, get: () => metrics.scrollHeight });
    Object.defineProperty(log, "clientHeight", { configurable: true, get: () => metrics.clientHeight });
    return { ...utils, log, metrics };
  }

  it("is a silent, focusable log", async () => {
    const { log, container } = setup();
    expect(log).toHaveAttribute("aria-live", "off");
    expect(log).toHaveAttribute("tabindex", "0");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("follows new content while at the bottom, and stops after the user scrolls up", async () => {
    const user = userEvent.setup();
    const { log, metrics } = setup();
    metrics.scrollHeight = 1200;
    await user.click(screen.getByRole("button", { name: "Grow" }));
    await waitFor(() => expect(log.scrollTop).toBe(1200));
    expect(screen.queryByRole("button", { name: "Scroll to latest message" })).not.toBeInTheDocument();

    // The user scrolls up (same content height).
    act(() => {
      log.scrollTop = 200;
      fireEvent.scroll(log);
    });
    const jump = await screen.findByRole("button", { name: "Scroll to latest message" });

    metrics.scrollHeight = 1400;
    await user.click(screen.getByRole("button", { name: "Grow" }));
    await waitFor(() => expect(screen.getAllByText(/^Line/)).toHaveLength(2));
    expect(log.scrollTop).toBe(200); // not pulled down

    await user.click(jump);
    expect(log.scrollTop).toBe(1400);
    await waitFor(() => expect(screen.queryByRole("button", { name: "Scroll to latest message" })).not.toBeInTheDocument());
    expect(log).toHaveFocus(); // focus isn't lost when the button disappears
  });

  it("releases on a wheel gesture upward", () => {
    const { log } = setup();
    act(() => {
      log.scrollTop = 600;
      fireEvent.scroll(log);
    });
    act(() => {
      fireEvent.wheel(log, { deltaY: -40 });
      log.scrollTop = 580; // still near the bottom: re-sticks
      fireEvent.scroll(log);
    });
    expect(screen.queryByRole("button", { name: "Scroll to latest message" })).not.toBeInTheDocument();
  });
});

describe("ConversationAnnouncer", () => {
  it("announces transitions, not tokens", () => {
    const { rerender } = render(<ConversationAnnouncer status="ready" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");
    rerender(<ConversationAnnouncer status="submitted" />);
    expect(status).toHaveTextContent("Message sent");
    rerender(<ConversationAnnouncer status="streaming" />);
    expect(status).toHaveTextContent("Assistant is responding");
    rerender(<ConversationAnnouncer status="ready" />);
    expect(status).toHaveTextContent("Response complete");
    rerender(<ConversationAnnouncer status="error" messages={{ error: "Something went wrong" }} />);
    expect(status).toHaveTextContent("Something went wrong");
  });
});

/* ---------------- Prompt input ---------------- */

function Composer({ status = "ready", onSubmit = vi.fn(), onStop, maxLength }: { status?: ChatStatus; onSubmit?: (...a: unknown[]) => unknown; onStop?: () => void; maxLength?: number }) {
  return (
    <PromptInput status={status} onStop={onStop} onSubmit={(m, e) => onSubmit(m, e) as void}>
      <PromptInputTextarea maxLength={maxLength} />
      <PromptInputToolbar>
        <PromptInputSubmit />
      </PromptInputToolbar>
    </PromptInput>
  );
}

describe("PromptInput", () => {
  it("submits on Enter, adds a newline on Shift+Enter and clears after sending", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<Composer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();

    await user.type(box, "Hello{Shift>}{Enter}{/Shift}world");
    expect(box).toHaveValue("Hello\nworld");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]![0]).toEqual({ text: "Hello\nworld", files: [] });
    await waitFor(() => expect(box).toHaveValue(""));
    expect(box).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("never submits the Enter that confirms an IME composition", () => {
    const onSubmit = vi.fn();
    render(<Composer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    fireEvent.change(box, { target: { value: "にほんご" } });
    fireEvent.compositionStart(box);
    fireEvent.keyDown(box, { key: "Enter", isComposing: true });
    fireEvent.compositionEnd(box);
    fireEvent.keyDown(box, { key: "Enter", keyCode: 229 }); // Safari fires this after compositionend
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ignores empty drafts and keeps the draft when onSubmit returns false", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => false);
    render(<Composer onSubmit={onSubmit} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    await user.type(box, "   {Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(box, "keep me{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(box).toHaveValue("   keep me");
  });

  it.each([
    ["ready", undefined, "Send message", "submit"],
    ["error", undefined, "Send message", "submit"],
    ["submitted", undefined, "Sending message", "submit"],
    ["submitted", () => {}, "Stop generating", "button"],
    ["streaming", () => {}, "Stop generating", "button"],
  ] as const)("status %s (onStop: %s) → %s", (status, onStop, name, type) => {
    render(<Composer status={status} onStop={onStop} />);
    expect(screen.getByRole("button", { name })).toHaveAttribute("type", type);
  });

  it("Stop calls onStop, and Enter doesn't send while streaming", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onSubmit = vi.fn();
    render(<Composer status="streaming" onStop={onStop} onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox"), "next question{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Stop generating" }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("shows a counter near the limit and announces the limit", async () => {
    const user = userEvent.setup();
    render(<Composer maxLength={10} />);
    const box = screen.getByRole("textbox", { name: "Message" });
    await user.type(box, "1234567");
    expect(screen.queryByText(/\/ 10/)).not.toBeInTheDocument();
    await user.type(box, "8");
    expect(box).toHaveAccessibleDescription("8 / 10 characters");
    await user.type(box, "90123");
    expect(box).toHaveValue("1234567890");
    expect(screen.getAllByRole("status").some((s) => s.textContent === "Character limit of 10 reached")).toBe(true);
  });
});

/* ---------------- Reasoning ---------------- */

describe("Reasoning", () => {
  afterEach(() => vi.useRealTimers());

  function Thinking({ streaming, onOpenChange }: { streaming: boolean; onOpenChange?: (o: boolean) => void }) {
    return (
      <Reasoning streaming={streaming} onOpenChange={onOpenChange} autoCloseDelay={1000}>
        <ReasoningTrigger />
        <ReasoningContent>Checking the policy…</ReasoningContent>
      </Reasoning>
    );
  }

  it("opens while streaming and closes once after it ends", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender, container } = render(<Thinking streaming={false} />);
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    rerender(<Thinking streaming />);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveTextContent("Thinking…");
    act(() => vi.advanceTimersByTime(3200));
    rerender(<Thinking streaming={false} />);
    expect(trigger).toHaveTextContent("Thought for 3 seconds");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    act(() => vi.advanceTimersByTime(1000));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stops moving on its own once the user toggles it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { rerender } = render(<Thinking streaming />);
    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(trigger); // user closes it
    fireEvent.click(trigger); // and opens it again
    rerender(<Thinking streaming={false} />);
    act(() => vi.advanceTimersByTime(2000));
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("requests automatic changes through onOpenChange when controlled", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onOpenChange = vi.fn();
    function Controlled({ streaming }: { streaming: boolean }) {
      const [open, setOpen] = useState(false);
      return (
        <Reasoning streaming={streaming} open={open} onOpenChange={(o) => (onOpenChange(o), setOpen(o))}>
          <ReasoningTrigger />
          <ReasoningContent>…</ReasoningContent>
        </Reasoning>
      );
    }
    const { rerender } = render(<Controlled streaming={false} />);
    rerender(<Controlled streaming />);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    rerender(<Controlled streaming={false} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("uses the duration prop for history", () => {
    render(
      <Reasoning duration={1}>
        <ReasoningTrigger />
        <ReasoningContent>…</ReasoningContent>
      </Reasoning>,
    );
    expect(screen.getByRole("button", { name: "Thought for 1 second" })).toHaveAttribute("aria-expanded", "false");
  });
});

/* ---------------- Response ---------------- */

describe("Response", () => {
  it("renders GFM safely: external links, tables, code blocks, no raw HTML, demoted headings", async () => {
    const md = [
      "# Title",
      "",
      "See [docs](https://example.com) and [local](/local).",
      "",
      "| A | B |",
      "| - | - |",
      "| 1 | 2 |",
      "",
      "- [x] done",
      "",
      "<script>alert(1)</script><b>bold?</b>",
      "",
      "[bad](javascript:alert(1))",
      "",
      "```ts",
      "const a = 1;",
      "```",
    ].join("\n");
    const { container } = render(<Response>{md}</Response>);
    expect(screen.getByRole("heading", { level: 3, name: "Title" })).toBeInTheDocument();
    const ext = screen.getByRole("link", { name: /docs/ });
    expect(ext).toHaveAttribute("target", "_blank");
    expect(ext).toHaveAttribute("rel", "noreferrer noopener");
    expect(ext).toHaveTextContent("(opens in a new tab)");
    expect(screen.getByRole("link", { name: "local" })).not.toHaveAttribute("target");
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Done:")).toBeInTheDocument();
    expect(container.querySelector("script, b")).toBeNull();
    expect(container).toHaveTextContent("<b>bold?</b>");
    expect(screen.getByText("bad").closest("a")?.getAttribute("href") ?? "").not.toMatch(/javascript/);
    expect(screen.getByRole("button", { name: "Copy TypeScript code" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("closes an open code fence while streaming", () => {
    render(<Response streaming>{"Here:\n\n```ts\nconst a = **1"}</Response>);
    expect(screen.getByRole("button", { name: "Copy TypeScript code" })).toBeInTheDocument();
    expect(screen.getByText("const a = **1")).toBeInTheDocument();
  });

  it("turns known [n] markers into citation chips and leaves the rest as text", () => {
    render(<Response citations={sources}>{"Paid leave [1]. Also [1, 2]. Not [7]. `code [1]`."}</Response>);
    expect(screen.getByRole("button", { name: "Source 1: Leave policy" })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: "Sources 1, 2: Leave policy and 1 more" })).toBeInTheDocument();
    expect(screen.getByText(/Not \[7\]/)).toBeInTheDocument();
    expect(screen.getByText("code [1]")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("does not parse markers without citations, and supports a custom renderer", () => {
    const { rerender } = render(<Response>{"Plain [1]."}</Response>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<Response renderCitation={(n) => <mark>ref {n.join("+")}</mark>}>{"Custom [2, 3]."}</Response>);
    expect(screen.getByText("ref 2+3")).toBeInTheDocument();
  });
});

/* ---------------- Inline citation ---------------- */

describe("InlineCitation", () => {
  it("opens with the keyboard, pages through sources and returns focus on Escape", async () => {
    const user = userEvent.setup();
    render(
      <p>
        Claim <InlineCitation index={[1, 2]} sources={sources} />
      </p>,
    );
    const chip = screen.getByRole("button", { name: "Sources 1, 2: Leave policy and 1 more" });
    await user.tab();
    expect(chip).toHaveFocus();
    await user.keyboard("{Enter}");
    const card = await screen.findByRole("dialog", { name: /Leave policy/ });
    expect(within(card).getByText("1 of 2")).toBeInTheDocument();
    await waitFor(() => expect(card.contains(document.activeElement)).toBe(true));
    expect(await axe(card)).toHaveNoViolations();

    await user.click(within(card).getByRole("button", { name: "Next source" }));
    expect(within(card).getByText("2 of 2")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Benefits FAQ/ })).toHaveAttribute("target", "_blank");
    expect(within(card).getByRole("button", { name: "Next source" })).toBeDisabled();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(chip).toHaveFocus();
  });
});

/* ---------------- Message, tool, copy ---------------- */

describe("Message", () => {
  it("names turns and exposes pressed state on feedback actions", async () => {
    const user = userEvent.setup();
    function Turn() {
      const [up, setUp] = useState(false);
      return (
        <Message from="assistant">
          <MessageContent>Answer</MessageContent>
          <MessageActions>
            <MessageCopyAction value="Answer **md**" />
            <MessageAction label="Good response" pressed={up} onClick={() => setUp(!up)}>
              <span aria-hidden>+</span>
            </MessageAction>
          </MessageActions>
        </Message>
      );
    }
    const { container } = render(<Turn />);
    expect(screen.getByRole("article", { name: "Assistant said" })).toBeInTheDocument();
    const good = screen.getByRole("button", { name: "Good response" });
    expect(good).toHaveAttribute("aria-pressed", "false");
    await user.click(good);
    expect(good).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Copy message" }));
    expect(await navigator.clipboard.readText()).toBe("Answer **md**");
    expect(screen.getByRole("status")).toHaveTextContent("Copied message to clipboard");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Copy controls", () => {
  it("CodeBlock copies the raw code, not the highlighted markup or line numbers", async () => {
    const user = userEvent.setup();
    render(<CodeBlock code={"a\nb"} language="py" showLineNumbers highlight={(c) => <em>{c.toUpperCase()}</em>} />);
    await user.click(screen.getByRole("button", { name: "Copy Python code" }));
    expect(await navigator.clipboard.readText()).toBe("a\nb");
    expect(screen.getByRole("button", { name: "Copied Python code" })).toBeInTheDocument();
  });

  it("Snippet copies the command without its prefix", async () => {
    const user = userEvent.setup();
    const { container } = render(<Snippet code="npm test" />);
    await user.click(screen.getByRole("button", { name: "Copy command" }));
    expect(await navigator.clipboard.readText()).toBe("npm test");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Tool", () => {
  it("names the trigger with the state and shows parameters, output and errors", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Tool>
          <ToolHeader name="search" state="running" />
          <ToolContent>
            <ToolInput input={{ q: "leave" }} />
            <ToolOutput output={{ hits: 2 }} />
          </ToolContent>
        </Tool>
        <Tool defaultOpen>
          <ToolHeader name="send_email" state="error" />
          <ToolContent>
            <ToolOutput errorText="SMTP refused" />
          </ToolContent>
        </Tool>
      </>,
    );
    const running = screen.getByRole("button", { name: "search Running" });
    expect(running).toHaveAttribute("aria-expanded", "false");
    await user.click(running);
    expect(screen.getByText(/"q": "leave"/)).toBeInTheDocument();
    expect(screen.getByText(/"hits": 2/)).toBeInTheDocument();
    expect(screen.getByText("SMTP refused")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
