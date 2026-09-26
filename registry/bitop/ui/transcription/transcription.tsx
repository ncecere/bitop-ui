"use client";

import { useRender } from "@base-ui/react/use-render";
import { type ComponentPropsWithRef, type MouseEvent, type ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./transcription.module.css";

/*
 * Transcription: transcript segments with timestamps. The segment playing at
 * `currentTime` is highlighted (aria-current plus a visual marker, not colour
 * alone); with `onSeek`, each segment is a button and Enter / Space / click
 * seeks to its start.
 *
 *   <Transcription label="Transcript" segments={result.segments} currentTime={time} onSeek={(t) => (audio.currentTime = t)} />
 *
 *   // custom rendering
 *   <Transcription segments={segments} currentTime={time} onSeek={seek}>
 *     {(segment, index) => <TranscriptionSegment key={index} segment={segment} index={index} />}
 *   </Transcription>
 *
 * `layout="inline"` flows the text as a paragraph (timestamps hidden
 * visually but still part of each button's name).
 */

export type TranscriptSegment = {
  text: string;
  startSecond: number;
  endSecond: number;
  /** Optional speaker name, shown before the text in the list layout. */
  speaker?: string;
};

/** Formats seconds as m:ss (or h:mm:ss). */
export function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

type TranscriptionContextValue = {
  currentTime: number;
  seek?: (time: number) => void;
  layout: "list" | "inline";
  showTimestamps: boolean;
  autoScroll: boolean;
};

const TranscriptionContext = createContext<TranscriptionContextValue>({ currentTime: 0, layout: "list", showTimestamps: true, autoScroll: false });

export type TranscriptionProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  segments: TranscriptSegment[];
  /** Accessible name of the transcript (default "Transcript"). */
  label?: string;
  /** Playback position in seconds (controlled). */
  currentTime?: number;
  defaultCurrentTime?: number;
  /** Called with a segment's start time when it is activated. Without it segments are plain text. */
  onSeek?: (time: number) => void;
  /** "list" (default): one row per segment with its timestamp. "inline": flowing text. */
  layout?: "list" | "inline";
  /** Show timestamps in the list layout (default true). */
  showTimestamps?: boolean;
  /** Keep the active segment scrolled into view inside a scrolling container (default false). */
  autoScroll?: boolean;
  /** Custom segment rendering. */
  children?: (segment: TranscriptSegment, index: number) => ReactNode;
};

export function Transcription({
  segments,
  label = "Transcript",
  currentTime,
  defaultCurrentTime = 0,
  onSeek,
  layout = "list",
  showTimestamps = true,
  autoScroll = false,
  className,
  children,
  ...props
}: TranscriptionProps) {
  const [internal, setInternal] = useState(defaultCurrentTime);
  const time = currentTime ?? internal;
  const seek = onSeek
    ? (t: number) => {
        if (currentTime === undefined) setInternal(t);
        onSeek(t);
      }
    : undefined;
  const visible = segments.map((segment, index) => ({ segment, index })).filter(({ segment }) => segment.text.trim() !== "");
  return (
    <TranscriptionContext.Provider value={{ currentTime: time, seek, layout, showTimestamps, autoScroll }}>
      <div role="region" aria-label={label} {...props} data-layout={layout} className={cx(styles.root, className)}>
        <ol className={styles.list}>
          {visible.map(({ segment, index }) =>
            children ? children(segment, index) : <TranscriptionSegment key={index} segment={segment} index={index} />,
          )}
        </ol>
      </div>
    </TranscriptionContext.Provider>
  );
}

export type TranscriptionSegmentProps = Omit<ComponentPropsWithRef<"button">, "children"> & {
  segment: TranscriptSegment;
  index: number;
  /** Replace the segment element (a <button> with onSeek, else a <span>). */
  render?: useRender.RenderProp;
  children?: ReactNode;
};

/** One segment, inside an <li>. Must be rendered by Transcription (directly or via its children function). */
export function TranscriptionSegment({ segment, index, render, className, onClick, children, ref, ...props }: TranscriptionSegmentProps) {
  const { currentTime, seek, layout, showTimestamps, autoScroll } = useContext(TranscriptionContext);
  const active = currentTime >= segment.startSecond && currentTime < segment.endSecond;
  const past = currentTime >= segment.endSecond;
  const item = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!autoScroll || !active) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    item.current?.scrollIntoView?.({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  }, [active, autoScroll]);

  const stamp = formatTimestamp(segment.startSecond);
  const hideTime = layout === "inline" || !showTimestamps;
  const content = (
    <>
      {/* The spaces separate the parts of the accessible name. In the list
          layout (flex) whitespace-only text isn't rendered; in the inline
          layout the space sits inside the hidden timestamp so the visible
          text doesn't start with one. */}
      <span className={cx(styles.time, hideTime && "sr-only")}>{hideTime ? `${stamp} ` : stamp}</span>
      {layout === "list" && (
        <>
          {" "}
          {segment.speaker && <span className={styles.speaker}>{segment.speaker}</span>}
          {segment.speaker && " "}
        </>
      )}
      <span className={styles.text}>{children ?? segment.text}</span>
    </>
  );
  const element = useRender({
    render,
    defaultTagName: seek ? "button" : "span",
    ref,
    props: {
      ...(seek ? { type: "button" as const } : {}),
      ...props,
      "aria-current": active ? ("true" as const) : undefined,
      "data-active": active ? "" : undefined,
      "data-past": past ? "" : undefined,
      "data-index": index,
      "data-interactive": seek ? "" : undefined,
      className: cx(styles.segment, className),
      onClick:
        seek || onClick
          ? (e: MouseEvent<HTMLButtonElement>) => {
              onClick?.(e);
              if (!e.defaultPrevented) seek?.(segment.startSecond);
            }
          : undefined,
      children: content,
    },
  });
  return (
    <li ref={item} className={styles.item} data-active={active ? "" : undefined}>
      {element}
    </li>
  );
}
