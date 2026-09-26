/*
 * Docs-only helpers for the AI examples: a fake token stream (no network)
 * and sample data. Not part of the registry.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { CitationSource } from "@/registry/bitop/ui/inline-citation/inline-citation";
import type { ModelOption } from "@/registry/bitop/ui/model-selector/model-selector";

export type DemoStatus = "ready" | "submitted" | "streaming" | "error";

/** Splits text into word-ish tokens (keeps whitespace), like a model stream. */
export function tokenize(text: string): string[] {
  return text.match(/\s+|[^\s]{1,6}/g) ?? [];
}

/**
 * Streams `text` into state token by token. `start()` → submitted →
 * streaming → ready; `stop()` freezes the partial text.
 */
export function useFakeStream({ interval = 28, firstTokenDelay = 500 }: { interval?: number; firstTokenDelay?: number } = {}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<DemoStatus>("ready");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const clear = () => clearTimeout(timer.current);
  useEffect(() => clear, []);

  const start = useCallback(
    (full: string, onDone?: () => void) => {
      clear();
      const tokens = tokenize(full);
      let i = 0;
      setText("");
      setStatus("submitted");
      const tick = () => {
        i = Math.min(tokens.length, i + 1 + Math.floor(Math.random() * 2));
        setText(tokens.slice(0, i).join(""));
        if (i >= tokens.length) {
          setStatus("ready");
          onDone?.();
          return;
        }
        timer.current = setTimeout(tick, interval);
      };
      timer.current = setTimeout(() => {
        setStatus("streaming");
        tick();
      }, firstTokenDelay);
    },
    [interval, firstTokenDelay],
  );

  const stop = useCallback(() => {
    clear();
    setStatus("ready");
  }, []);

  const reset = useCallback(() => {
    clear();
    setText("");
    setStatus("ready");
  }, []);

  return { text, status, start, stop, reset };
}

export const demoSources: CitationSource[] = [
  {
    title: "Parental leave policy (2025)",
    href: "https://handbook.example.com/policies/parental-leave",
    siteName: "Employee handbook",
    description: "Eligibility, duration and pay for birth, adoption and foster parents.",
    quote: "Eligible employees receive 16 weeks of fully paid leave, which can be taken within 12 months of the child's arrival.",
  },
  {
    title: "Benefits FAQ",
    href: "https://people.example.com/benefits/faq",
    description: "Answers to the most common questions about benefits and leave.",
    quote: "Leave can be taken in up to three blocks of at least two weeks each.",
  },
  {
    title: "Leave request process.pdf",
    siteName: "HR shared drive",
    description: "Uploaded document · 4 pages",
    quote: "Submit the request in the HR portal at least 8 weeks before the planned start date.",
  },
];

export const demoModels: ModelOption[] = [
  { id: "claude-sonnet", name: "Claude Sonnet", provider: "Anthropic", description: "Balanced", capabilities: ["vision", "tools", "reasoning"], contextWindow: 200_000 },
  { id: "claude-haiku", name: "Claude Haiku", provider: "Anthropic", description: "Fastest", capabilities: ["vision", "tools"], contextWindow: 200_000 },
  { id: "gpt-large", name: "GPT Large", provider: "OpenAI", description: "Most capable", capabilities: ["vision", "tools", "reasoning"], contextWindow: 128_000 },
  { id: "gpt-mini", name: "GPT Mini", provider: "OpenAI", description: "Low cost", capabilities: ["tools"], contextWindow: 128_000 },
  { id: "llama-70b", name: "Llama 70B", provider: "Self-hosted", description: "On-prem", capabilities: ["tools"], contextWindow: 32_000 },
];
