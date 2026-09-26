import { useMemo, useRef, useState } from "react";
import { AudioPlayer } from "@/registry/bitop/ui/audio-player/audio-player";
import { Transcription, type TranscriptSegment } from "@/registry/bitop/ui/transcription/transcription";
import { chimeWavBase64 } from "../media-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./transcription.tsx?raw";

const segments: TranscriptSegment[] = [
  { text: "Welcome to the weekly service update.", startSecond: 0, endSecond: 2, speaker: "Dana" },
  { text: "The new ticket queue goes live on Monday.", startSecond: 2, endSecond: 4.5, speaker: "Dana" },
  { text: "Will the old email address keep working?", startSecond: 4.5, endSecond: 6.5, speaker: "Sam" },
  { text: "Yes, it forwards to the queue until the end of term.", startSecond: 6.5, endSecond: 9, speaker: "Dana" },
  { text: "Great, thanks.", startSecond: 9, endSecond: 10, speaker: "Sam" },
];

export function SyncedWithAudio() {
  const audio = useRef<HTMLAudioElement>(null);
  const base64 = useMemo(() => chimeWavBase64(10), []);
  const [time, setTime] = useState(0);
  return (
    <div className={styles.stack}>
      <AudioPlayer label="Service update recording" base64={base64} mediaType="audio/wav" audioRef={audio} onTimeUpdate={setTime} />
      <Transcription
        segments={segments}
        currentTime={time}
        onSeek={(t) => {
          if (audio.current) audio.current.currentTime = t;
          setTime(t);
        }}
      />
    </div>
  );
}

export function Inline() {
  return (
    <div className={styles.stack}>
      <Transcription label="Caption" layout="inline" segments={segments} defaultCurrentTime={5} />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "transcription",
  title: "Transcription",
  category: "AI",
  description: "Transcript segments with timestamps. The segment at the current playback time is highlighted, and activating a segment seeks to it.",
  imports: `import { Transcription, TranscriptionSegment } from "@/components/ui/transcription/transcription";`,
  examples: examples(raw, [
    ["SyncedWithAudio", SyncedWithAudio, { title: "Synced with an audio player", wide: true }],
    ["Inline", Inline, { title: "Inline text, read-only" }],
  ]),
  props: [
    {
      component: "Transcription",
      note: "Other native <div> props go to the region.",
      rows: [
        { name: "segments", type: "TranscriptSegment[]", required: true, description: "{ text, startSecond, endSecond, speaker? }; blank segments are skipped." },
        { name: "label", type: "string", default: '"Transcript"', description: "Accessible name of the region." },
        { name: "currentTime / defaultCurrentTime", type: "number", description: "Playback position in seconds (controlled / uncontrolled)." },
        { name: "onSeek", type: "(seconds) => void", description: "Makes segments buttons; called with the segment's start." },
        { name: "layout", type: '"list" | "inline"', default: '"list"', description: "Rows with timestamps, or flowing text." },
        { name: "showTimestamps", type: "boolean", default: "true", description: "Visible timestamps in the list layout." },
        { name: "autoScroll", type: "boolean", default: "false", description: "Keep the active segment in view inside a scrolling container." },
        { name: "children", type: "(segment, index) => ReactNode", description: "Custom rendering with TranscriptionSegment." },
      ],
    },
    {
      component: "TranscriptionSegment",
      note: "Native <button> props; `render` replaces the element.",
      rows: [
        { name: "segment / index", type: "TranscriptSegment / number", required: true, description: "The segment and its index." },
        { name: "children", type: "ReactNode", description: "Replaces the segment text (e.g. highlighted words)." },
      ],
    },
  ],
  a11y: [
    "A named region with an ordered list; the active segment has aria-current and an inset bar, not only a colour change.",
    "With onSeek each segment is a native button: Enter, Space or click seeks. Its name includes the timestamp (visually hidden in the inline layout).",
    "Auto-scrolling is opt-in and jumps instead of animating under reduced motion.",
  ],
};

export default doc;
