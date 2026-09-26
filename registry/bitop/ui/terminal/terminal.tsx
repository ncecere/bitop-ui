"use client";

import { Eraser, SquareTerminal } from "lucide-react";
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { IconButton, type IconButtonProps } from "@/registry/bitop/ui/button/button";
import { CopyButton, type CopyButtonProps } from "@/registry/bitop/ui/copy-button/copy-button";
import { Loader } from "@/registry/bitop/ui/loader/loader";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./terminal.module.css";

/*
 * Terminal: command output with a header (title, running status, copy and
 * clear), basic ANSI colours and auto-scroll while output streams in.
 *
 *   <Terminal output={log} streaming={running} onClear={() => setLog("")} />
 *
 * or composed:
 *
 *   <Terminal output={log}>
 *     <TerminalHeader>
 *       <TerminalTitle>npm run build</TerminalTitle>
 *       <TerminalStatus />
 *       <TerminalActions><TerminalCopyButton /></TerminalActions>
 *     </TerminalHeader>
 *     <TerminalContent />
 *   </Terminal>
 *
 * parseAnsi() is a small dependency-free SGR parser: bold, dim, italic,
 * underline, inverse, the 16 standard / bright colours (38;5;n maps n < 16)
 * and resets. Colours map to theme tokens, not literal RGB, so the output
 * keeps AA contrast in light and dark themes; truecolour (38;2) and other
 * escape sequences (cursor moves, OSC titles) are dropped. A bare "\r"
 * rewrites the line, as progress bars expect.
 *
 * The output is a focusable, named region (it scrolls); it is not a live
 * region because streamed output would flood screen readers. TerminalStatus
 * says "Running" and aria-busy is set while streaming.
 */

export type AnsiColor = "black" | "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white" | "gray";

export type AnsiStyle = {
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  inverse?: boolean;
};

export type AnsiSpan = AnsiStyle & { text: string };

const COLORS: AnsiColor[] = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
// Bright black is the conventional "gray"; other bright colours share their base token.
const brightColor = (i: number): AnsiColor => (i === 0 ? "gray" : COLORS[i]!);

// CSI (ESC [ … final byte), OSC (ESC ] … BEL / ST) and two-byte escapes.
// eslint-disable-next-line no-control-regex
const ESCAPE = /\u001b\[([0-9;?]*)([@-~])|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;

/** Applies "\r" overwrites and normalises line endings. */
function collapseCarriageReturns(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => (line.includes("\r") ? line.slice(line.lastIndexOf("\r") + 1) : line))
    .join("\n");
}

function applySgr(style: AnsiStyle, params: string): AnsiStyle {
  const codes = params === "" ? [0] : params.split(";").map((p) => (p === "" ? 0 : Number(p)));
  let next = { ...style };
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]!;
    if (code === 0) next = {};
    else if (code === 1) next.bold = true;
    else if (code === 2) next.dim = true;
    else if (code === 3) next.italic = true;
    else if (code === 4) next.underline = true;
    else if (code === 7) next.inverse = true;
    else if (code === 22) next.bold = next.dim = undefined;
    else if (code === 23) next.italic = undefined;
    else if (code === 24) next.underline = undefined;
    else if (code === 27) next.inverse = undefined;
    else if (code >= 30 && code <= 37) next.fg = COLORS[code - 30];
    else if (code === 39) next.fg = undefined;
    else if (code >= 40 && code <= 47) next.bg = COLORS[code - 40];
    else if (code === 49) next.bg = undefined;
    else if (code >= 90 && code <= 97) next.fg = brightColor(code - 90);
    else if (code >= 100 && code <= 107) next.bg = brightColor(code - 100);
    else if (code === 38 || code === 48) {
      const mode = codes[i + 1];
      if (mode === 5) {
        const n = codes[i + 2] ?? -1;
        const color = n >= 0 && n < 8 ? COLORS[n] : n >= 8 && n < 16 ? brightColor(n - 8) : undefined;
        if (color) next[code === 38 ? "fg" : "bg"] = color;
        i += 2;
      } else if (mode === 2) i += 4; // truecolour: no token to map to
    }
  }
  return next;
}

/** Splits text with ANSI escape codes into styled spans. */
export function parseAnsi(input: string): AnsiSpan[] {
  const text = collapseCarriageReturns(input);
  const spans: AnsiSpan[] = [];
  let style: AnsiStyle = {};
  let last = 0;
  const push = (chunk: string) => {
    if (!chunk) return;
    const prev = spans[spans.length - 1];
    if (prev && STYLE_KEYS.every((k) => prev[k] === style[k])) prev.text += chunk;
    else spans.push({ ...style, text: chunk });
  };
  for (const m of text.matchAll(ESCAPE)) {
    push(text.slice(last, m.index));
    last = m.index + m[0].length;
    // Private-mode sequences such as ESC[?25l (hide cursor) are not SGR.
    if (m[2] === "m" && !m[1]?.startsWith("?")) style = cleanStyle(applySgr(style, m[1] ?? ""));
  }
  push(text.slice(last));
  return spans;
}

const STYLE_KEYS: (keyof AnsiStyle)[] = ["fg", "bg", "bold", "dim", "italic", "underline", "inverse"];

function cleanStyle(style: AnsiStyle): AnsiStyle {
  const out: AnsiStyle = {};
  for (const key of STYLE_KEYS) if (style[key] !== undefined) (out as Record<string, unknown>)[key] = style[key];
  return out;
}

/** Removes ANSI escape codes (and applies "\r" overwrites). */
export function stripAnsi(input: string): string {
  return collapseCarriageReturns(input).replace(ESCAPE, "");
}

type TerminalContextValue = {
  output: string;
  streaming: boolean;
  onClear?: () => void;
  titleId: string;
};

const TerminalContext = createContext<TerminalContextValue | null>(null);

function useTerminal(part: string): TerminalContextValue {
  const ctx = useContext(TerminalContext);
  if (!ctx) throw new Error(`${part} must be used inside <Terminal>`);
  return ctx;
}

export type TerminalProps = Omit<ComponentPropsWithRef<"div">, "children" | "title"> & {
  /** The raw output, ANSI codes included. */
  output: string;
  /** Output is still arriving: shows the status and a cursor, sets aria-busy. */
  streaming?: boolean;
  /** Keep the view pinned to the newest output while the user is at the bottom (default true). */
  autoScroll?: boolean;
  /** Shows a clear button that calls this. */
  onClear?: () => void;
  /** Title for the default header (default "Terminal"). */
  title?: ReactNode;
  /** Custom composition; defaults to header + content. */
  children?: ReactNode;
};

export function Terminal({ output, streaming = false, autoScroll = true, onClear, title, className, children, ...props }: TerminalProps) {
  const titleId = useId();
  const ctx = useMemo(() => ({ output, streaming, onClear, titleId }), [output, streaming, onClear, titleId]);
  return (
    <TerminalContext.Provider value={ctx}>
      <div {...props} className={cx(styles.root, className)} data-streaming={dataFlag(streaming)}>
        {children ?? (
          <>
            <TerminalHeader>
              <TerminalTitle>{title}</TerminalTitle>
              <TerminalStatus />
              <TerminalActions>
                <TerminalCopyButton />
                {onClear && <TerminalClearButton />}
              </TerminalActions>
            </TerminalHeader>
            <TerminalContent autoScroll={autoScroll} />
          </>
        )}
      </div>
    </TerminalContext.Provider>
  );
}

export function TerminalHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type TerminalTitleProps = ComponentPropsWithRef<"p"> & {
  /** Decorative icon (default: a terminal). */
  icon?: ReactNode;
};

/** Names the terminal (default text "Terminal"). */
export function TerminalTitle({ icon, className, children, ...props }: TerminalTitleProps) {
  const { titleId } = useTerminal("TerminalTitle");
  return (
    <p id={titleId} {...props} className={cx(styles.title, className)}>
      <span aria-hidden className={styles.titleIcon}>
        {icon ?? <SquareTerminal />}
      </span>
      {children ?? "Terminal"}
    </p>
  );
}

export type TerminalStatusProps = ComponentPropsWithRef<"span"> & {
  /** Text while streaming (default "Running"). */
  children?: ReactNode;
};

/** "Running" with a loader while streaming; renders nothing otherwise. */
export function TerminalStatus({ className, children, ...props }: TerminalStatusProps) {
  const { streaming } = useTerminal("TerminalStatus");
  if (!streaming) return null;
  return (
    <span {...props} className={cx(styles.status, className)}>
      <Loader size="sm" />
      {children ?? "Running"}
    </span>
  );
}

export function TerminalActions({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.actions, className)} />;
}

export type TerminalCopyButtonProps = Omit<CopyButtonProps, "value"> & {
  /** Override what is copied (default: the output without ANSI codes). */
  value?: CopyButtonProps["value"];
};

export function TerminalCopyButton({ value, label = "output", ...props }: TerminalCopyButtonProps) {
  const { output } = useTerminal("TerminalCopyButton");
  return <CopyButton {...props} label={label} value={value ?? (() => stripAnsi(output))} />;
}

export type TerminalClearButtonProps = Omit<IconButtonProps, "icon" | "label"> & {
  label?: string;
  icon?: ReactNode;
};

/** Calls the Terminal's `onClear`; renders nothing without it. */
export function TerminalClearButton({ label = "Clear output", icon, size = "sm", onClick, ...props }: TerminalClearButtonProps) {
  const { onClear } = useTerminal("TerminalClearButton");
  if (!onClear) return null;
  return (
    <IconButton
      {...props}
      size={size}
      label={label}
      icon={icon ?? <Eraser aria-hidden />}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onClear();
      }}
    />
  );
}

export type TerminalContentProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Keep the view pinned to the newest output while the user is at the bottom (default true). */
  autoScroll?: boolean;
  /** Cap the height (any CSS length; default 24rem). */
  maxHeight?: string;
  /** Accessible name of the scroll region (default: "<title> output"). */
  label?: string;
  /** Shown when there is no output. */
  placeholder?: ReactNode;
};

export function TerminalContent({ autoScroll = true, maxHeight, label, placeholder = "No output", className, style, onScroll, ...props }: TerminalContentProps) {
  const { output, streaming, titleId } = useTerminal("TerminalContent");
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const spans = useMemo(() => parseAnsi(output), [output]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && autoScroll && pinned.current) el.scrollTop = el.scrollHeight;
  }, [spans, autoScroll, streaming]);

  return (
    <div
      role="region"
      tabIndex={0}
      aria-label={label}
      aria-labelledby={label ? undefined : titleId}
      aria-busy={streaming || undefined}
      {...props}
      ref={ref}
      className={cx(styles.content, className)}
      style={maxHeight ? ({ "--terminal-max-height": maxHeight, ...style } as CSSProperties) : style}
      onScroll={(event) => {
        onScroll?.(event);
        const el = event.currentTarget;
        pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      }}
    >
      <pre className={styles.pre}>
        {spans.length === 0 && !streaming ? (
          <span className={styles.placeholder}>{placeholder}</span>
        ) : (
          spans.map((span, i) => (
            <span
              key={i}
              className={styles.span}
              data-fg={span.fg}
              data-bg={span.bg}
              data-bold={dataFlag(span.bold)}
              data-dim={dataFlag(span.dim)}
              data-italic={dataFlag(span.italic)}
              data-underline={dataFlag(span.underline)}
              data-inverse={dataFlag(span.inverse)}
            >
              {span.text}
            </span>
          ))
        )}
        {streaming && <span aria-hidden className={styles.cursor} />}
      </pre>
    </div>
  );
}
