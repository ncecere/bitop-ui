"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, ChevronRight, TriangleAlert } from "lucide-react";
import { type ComponentPropsWithRef, type CSSProperties, type ReactNode, createContext, useContext, useId, useMemo } from "react";
import { CopyButton, type CopyButtonProps } from "@/registry/bitop/ui/copy-button/copy-button";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./stack-trace.module.css";

/*
 * StackTrace: a parsed JavaScript error stack. The header (Base UI
 * Collapsible trigger) shows the error type and message; the panel lists the
 * frames with file:line:column, where runs of internal frames (node_modules,
 * node:, native) fold into their own "N internal frames" disclosure.
 *
 *   <StackTrace trace={error.stack} onFrameClick={(f) => openInEditor(f)} />
 *
 * parseStackTrace() is dependency-free and reads V8 (Chrome, Node, Edge:
 * "    at fn (file:1:2)") and Firefox / Safari ("fn@file:1:2") formats. Lines
 * before the first frame are the message, so multi-line messages survive.
 * Frame locations become buttons only when `onFrameClick` is set.
 */

export type StackFrame = {
  /** The original line, trimmed. */
  raw: string;
  functionName: string | null;
  filePath: string | null;
  lineNumber: number | null;
  columnNumber: number | null;
  /** node_modules, node: built-ins, native code and similar. */
  isInternal: boolean;
};

export type ParsedStackTrace = {
  /** "TypeError", "RangeError [ERR_OUT_OF_RANGE]"…, or null if the header isn't "Type: message". */
  errorType: string | null;
  errorMessage: string;
  frames: StackFrame[];
  raw: string;
};

const V8_FRAME = /^at\s+(.*)$/;
const V8_WITH_FN = /^(.*?)\s+\((.*)\)$/;
const GECKO_FRAME = /^([^@\s]*)@(.+)$/;
const LOCATION = /^(.*?)(?::(\d+))?(?::(\d+))?$/;
const ERROR_HEADER = /^(?:Uncaught\s+)?((?:[A-Z][\w$.]*)?(?:Error|Exception)(?:\s*\[[\w-]+\])?)(?::\s*([\s\S]*))?$/;
const INTERNAL = /node_modules|^node:|\binternal\/|^<anonymous>$|^native$|\[native code\]|^webpack\/bootstrap/;

/** Default test for internal frames; pass `isInternalFrame` to StackTrace to override. */
export function isInternalPath(location: string): boolean {
  return INTERNAL.test(location);
}

function splitLocation(location: string): Pick<StackFrame, "filePath" | "lineNumber" | "columnNumber"> {
  const m = location.match(LOCATION);
  return {
    filePath: m?.[1] || null,
    lineNumber: m?.[2] ? Number(m[2]) : null,
    columnNumber: m?.[3] ? Number(m[3]) : null,
  };
}

/** Parses one frame line, or returns null if the line isn't a frame. */
export function parseStackFrame(line: string, isInternal: (location: string) => boolean = isInternalPath): StackFrame | null {
  const raw = line.trim();
  let functionName: string | null = null;
  let location: string;
  const v8 = raw.match(V8_FRAME);
  if (v8) {
    const body = v8[1]!;
    const withFn = body.match(V8_WITH_FN);
    if (withFn) {
      functionName = withFn[1]!;
      location = withFn[2]!;
      // eval frames: "eval at fn (file:1:2), <anonymous>:3:4" — point at the outer file.
      const evalAt = location.match(/\((.*?:\d+:\d+)\)/);
      if (location.startsWith("eval at") && evalAt) location = evalAt[1]!;
    } else location = body;
  } else {
    const gecko = raw.match(GECKO_FRAME);
    if (!gecko || !/:\d+/.test(gecko[2]!)) return null;
    functionName = gecko[1] || null;
    location = gecko[2]!;
  }
  const parts = splitLocation(location);
  return { raw, functionName, ...parts, isInternal: isInternal(parts.filePath ?? location) };
}

/** Parses a stack string (error.stack) into the error header and frames. */
export function parseStackTrace(trace: string, isInternal?: (location: string) => boolean): ParsedStackTrace {
  const lines = trace.replace(/\r\n/g, "\n").split("\n");
  const header: string[] = [];
  const frames: StackFrame[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const frame = parseStackFrame(line, isInternal);
    if (frame) frames.push(frame);
    else if (frames.length === 0) header.push(line.trim());
  }
  const first = header.join("\n");
  const m = first.match(ERROR_HEADER);
  return {
    errorType: m ? m[1]! : null,
    errorMessage: m ? (m[2] ?? "") : first,
    frames,
    raw: trace,
  };
}

/** "file.ts:12:5" */
export function formatFrameLocation(frame: StackFrame): string {
  return [frame.filePath, frame.lineNumber, frame.columnNumber].filter((p) => p !== null).join(":");
}

type StackTraceContextValue = {
  trace: ParsedStackTrace;
  onFrameClick?: (frame: StackFrame) => void;
  /** id of the error text in the trigger; names the frames region. */
  errorId: string;
};

const StackTraceContext = createContext<StackTraceContextValue | null>(null);

function useStackTrace(part: string): StackTraceContextValue {
  const ctx = useContext(StackTraceContext);
  if (!ctx) throw new Error(`${part} must be used inside <StackTrace>`);
  return ctx;
}

export type StackTraceProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The stack string, usually `error.stack` (or `${name}: ${message}\n${stack}` for Firefox). */
  trace: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Makes frame locations buttons (e.g. open the file in an editor). */
  onFrameClick?: (frame: StackFrame) => void;
  /** Decides which frames are internal (receives the file path). */
  isInternalFrame?: (location: string) => boolean;
  /** Custom composition; defaults to header (trigger + copy) and the frames. */
  children?: ReactNode;
};

export function StackTrace({ trace, open, defaultOpen, onOpenChange, onFrameClick, isInternalFrame, className, children, ...props }: StackTraceProps) {
  const parsed = useMemo(() => parseStackTrace(trace, isInternalFrame), [trace, isInternalFrame]);
  const errorId = useId();
  const ctx = useMemo(() => ({ trace: parsed, onFrameClick, errorId }), [parsed, onFrameClick, errorId]);
  return (
    <StackTraceContext.Provider value={ctx}>
      <Collapsible.Root
        {...props}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
        className={cx(styles.root, className)}
      >
        {children ?? (
          <>
            <StackTraceHeader>
              <StackTraceTrigger />
              <StackTraceActions>
                <StackTraceCopyButton />
              </StackTraceActions>
            </StackTraceHeader>
            <StackTraceContent>
              <StackTraceFrames />
            </StackTraceContent>
          </>
        )}
      </Collapsible.Root>
    </StackTraceContext.Provider>
  );
}

export function StackTraceHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type StackTraceTriggerProps = Omit<Collapsible.Trigger.Props, "className"> & {
  className?: string;
  /** Replaces the error type + message. */
  children?: ReactNode;
};

/** Toggles the frames; shows the error type and message. */
export function StackTraceTrigger({ className, children, ...props }: StackTraceTriggerProps) {
  const { trace, errorId } = useStackTrace("StackTraceTrigger");
  return (
    <Collapsible.Trigger {...props} className={cx(styles.trigger, className)}>
      <TriangleAlert aria-hidden className={styles.alertIcon} />
      <span id={errorId} className={styles.error}>
        {children ?? (
          <>
            {trace.errorType && (
              <span className={styles.errorType}>
                {trace.errorType}
                {trace.errorMessage && ":"}
              </span>
            )}{" "}
            <span className={styles.errorMessage}>{trace.errorMessage || (trace.errorType ? "" : "Error")}</span>
          </>
        )}
      </span>
      <ChevronDown aria-hidden className={styles.chevron} />
    </Collapsible.Trigger>
  );
}

export function StackTraceActions({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.actions, className)} />;
}

export type StackTraceCopyButtonProps = Omit<CopyButtonProps, "value"> & { value?: CopyButtonProps["value"] };

/** Copies the raw trace. */
export function StackTraceCopyButton({ value, label = "stack trace", ...props }: StackTraceCopyButtonProps) {
  const { trace } = useStackTrace("StackTraceCopyButton");
  return <CopyButton {...props} label={label} value={value ?? trace.raw} />;
}

export type StackTraceContentProps = Omit<Collapsible.Panel.Props, "className"> & { className?: string };

/** The collapsible panel under the header. */
export function StackTraceContent({ className, ...props }: StackTraceContentProps) {
  return <Collapsible.Panel {...props} className={cx(styles.panel, className)} />;
}

export type StackTraceFramesProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** `collapse` (default) folds runs of internal frames; `show` lists them; `hide` drops them. */
  internalFrames?: "collapse" | "show" | "hide";
  /** Cap the height (any CSS length; default 24rem); the frames scroll beyond it. */
  maxHeight?: string;
};

type FrameRun = { internal: boolean; frames: StackFrame[] };

/** The frame list (scrolls; keyboard-focusable). */
export function StackTraceFrames({ internalFrames = "collapse", maxHeight, className, style, ...props }: StackTraceFramesProps) {
  const { trace, onFrameClick, errorId } = useStackTrace("StackTraceFrames");
  const frames = internalFrames === "hide" ? trace.frames.filter((f) => !f.isInternal) : trace.frames;
  const runs: FrameRun[] = [];
  for (const frame of frames) {
    const internal = internalFrames === "collapse" && frame.isInternal;
    const last = runs[runs.length - 1];
    if (last && last.internal === internal) last.frames.push(frame);
    else runs.push({ internal, frames: [frame] });
  }
  return (
    <div
      role="region"
      tabIndex={0}
      aria-labelledby={props["aria-label"] ? undefined : errorId}
      {...props}
      className={cx(styles.frames, className)}
      style={maxHeight ? ({ "--stack-max-height": maxHeight, ...style } as CSSProperties) : style}
    >
      {frames.length === 0 ? (
        <p className={styles.empty}>No stack frames</p>
      ) : (
        <ol className={styles.list}>
          {runs.map((run, r) =>
            run.internal ? (
              <li key={r} className={styles.internalGroup}>
                <Collapsible.Root>
                  <Collapsible.Trigger className={styles.internalTrigger}>
                    <ChevronRight aria-hidden className={styles.internalChevron} />
                    {run.frames.length} internal {run.frames.length === 1 ? "frame" : "frames"}
                  </Collapsible.Trigger>
                  <Collapsible.Panel className={styles.internalPanel}>
                    <ol className={styles.list}>
                      {run.frames.map((frame, i) => (
                        <Frame key={i} frame={frame} onFrameClick={onFrameClick} />
                      ))}
                    </ol>
                  </Collapsible.Panel>
                </Collapsible.Root>
              </li>
            ) : (
              run.frames.map((frame, i) => <Frame key={`${r}-${i}`} frame={frame} onFrameClick={onFrameClick} />)
            ),
          )}
        </ol>
      )}
    </div>
  );
}

function Frame({ frame, onFrameClick }: { frame: StackFrame; onFrameClick?: (frame: StackFrame) => void }) {
  const location = formatFrameLocation(frame);
  return (
    <li className={styles.frame} data-internal={dataFlag(frame.isInternal)}>
      <span className={styles.at}>at </span>
      {frame.functionName && <span className={styles.fn}>{frame.functionName} </span>}
      {frame.filePath ? (
        <>
          <span className={styles.paren}>(</span>
          {onFrameClick ? (
            <button type="button" className={styles.location} onClick={() => onFrameClick(frame)}>
              {location}
            </button>
          ) : (
            <span className={styles.locationText}>{location}</span>
          )}
          <span className={styles.paren}>)</span>
        </>
      ) : (
        !frame.functionName && <span>{frame.raw.replace(/^at\s+/, "")}</span>
      )}
    </li>
  );
}
