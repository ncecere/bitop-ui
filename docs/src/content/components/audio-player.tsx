import { useMemo, useState } from "react";
import { AudioPlayer, formatTime } from "@/registry/bitop/ui/audio-player/audio-player";
import { chimeWavBase64 } from "../media-demo";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./audio-player.tsx?raw";

export function GeneratedSpeech() {
  // In an app: const { audio } = await generateSpeech(…); pass audio.base64 and audio.mediaType.
  const base64 = useMemo(() => chimeWavBase64(8), []);
  return (
    <div className={styles.stack}>
      <AudioPlayer label="Generated speech" base64={base64} mediaType="audio/wav" />
    </div>
  );
}

export function Compact() {
  const base64 = useMemo(() => chimeWavBase64(12), []);
  const [time, setTime] = useState(0);
  return (
    <div className={styles.stack}>
      <AudioPlayer label="Episode 12 preview" base64={base64} mediaType="audio/wav" skipSeconds={5} showVolume={false} playbackRates={[1, 1.5, 2]} onTimeUpdate={setTime} />
      <span className={styles.muted}>Position reported to the app: {formatTime(time)}</span>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "audio-player",
  title: "Audio player",
  category: "AI",
  description: "A native <audio> element with custom controls for generated speech and recordings: play/pause, skip, seek, time, mute, volume and playback speed.",
  imports: `import { AudioPlayer } from "@/components/ui/audio-player/audio-player";`,
  baseUi: { name: "Slider", href: "https://base-ui.com/react/components/slider" },
  examples: examples(raw, [
    ["GeneratedSpeech", GeneratedSpeech, { title: "Generated speech (base64)", wide: true }],
    ["Compact", Compact, { title: "Skip buttons, fewer speeds, time callback", wide: true }],
  ]),
  props: [
    {
      component: "AudioPlayer",
      note: "Other native <div> props go to the wrapper (a group named by label).",
      rows: [
        { name: "label", type: "string", required: true, description: "Accessible name of the player." },
        { name: "src / base64 / uint8Array", type: "string / string / Uint8Array", required: true, description: "One audio source; bytes become an object URL." },
        { name: "mediaType", type: "string", default: '"audio/mpeg"', description: "MIME type for base64 and bytes." },
        { name: "playbackRates", type: "number[]", default: "[0.5, 0.75, 1, 1.25, 1.5, 2]", description: "Speed menu options; [] hides the menu." },
        { name: "defaultPlaybackRate", type: "number", default: "1", description: "Initial speed." },
        { name: "skipSeconds", type: "number", default: "0", description: "Show back/forward buttons that jump this far." },
        { name: "showVolume", type: "boolean", default: "true", description: "Show the volume slider next to Mute." },
        { name: "autoPlay / loop / preload", type: 'boolean / boolean / "none" | "metadata" | "auto"', default: '— / — / "metadata"', description: "Passed to <audio>." },
        { name: "onPlay / onPause / onEnded", type: "() => void", description: "Playback callbacks." },
        { name: "onTimeUpdate", type: "(seconds) => void", description: "Current time as playback progresses." },
        { name: "audioRef", type: "Ref<HTMLAudioElement>", description: "The underlying element, e.g. to seek from a transcript." },
        { name: "tracks", type: "ReactNode", description: "Children for <audio>, e.g. <track kind=\"captions\">." },
      ],
    },
  ],
  a11y: [
    "Play/Pause is a native button whose name follows the state; Mute is a toggle button (aria-pressed).",
    "Seek and volume are Base UI sliders: arrow keys, Page Up/Down and Home/End work; values are announced as “0:05 of 0:08” and “80%”.",
    "Playback speed is a labelled select; the seek slider is disabled until the duration is known.",
  ],
};

export default doc;
