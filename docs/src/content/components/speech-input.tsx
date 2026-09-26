import { useState } from "react";
import { Field } from "@/registry/bitop/ui/field/field";
import { Textarea } from "@/registry/bitop/ui/input/input";
import { SpeechInput } from "@/registry/bitop/ui/speech-input/speech-input";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./speech-input.tsx?raw";

export function Dictation() {
  const [draft, setDraft] = useState("");
  return (
    <div className={styles.stack}>
      <Field label="Message">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type or dictate…" />
      </Field>
      <SpeechInput
        label="Dictate message"
        showStatus
        onTranscriptionChange={(text) => setDraft((d) => (d ? `${d} ${text}` : text))}
        onAudioRecorded={async (audio) => {
          // Browsers without the Web Speech API: upload the recording to your
          // transcription endpoint and return its text, e.g.
          //   const res = await fetch("/api/transcribe", { method: "POST", body: audio });
          //   return (await res.json()).text;
          return `(${Math.max(1, Math.round(audio.size / 1024))} KB recorded: transcribe it on your server)`;
        }}
      />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "speech-input",
  title: "Speech input",
  category: "AI",
  description:
    "A microphone toggle that turns speech into text: the Web Speech API where available, otherwise a MediaRecorder recording handed to your server for transcription.",
  imports: `import { SpeechInput } from "@/components/ui/speech-input/speech-input";`,
  baseUi: { name: "Toggle", href: "https://base-ui.com/react/components/toggle" },
  examples: examples(raw, [["Dictation", Dictation, { title: "Dictate into a text field" }]]),
  props: [
    {
      component: "SpeechInput",
      note: "Other native <div> props go to the wrapper.",
      rows: [
        { name: "onTranscriptionChange", type: "(text) => void", description: "Each final phrase, or the text returned by onAudioRecorded." },
        { name: "onInterimTranscript", type: "(text) => void", description: "The in-progress phrase (Web Speech API only)." },
        { name: "onAudioRecorded", type: "(audio: Blob) => Promise<string | void> | string | void", description: "Fallback recorder; return the transcript. Without it, browsers lacking the Web Speech API get a disabled button." },
        { name: "onListeningChange / onError", type: "(listening) => void / (code) => void", description: "State and error callbacks." },
        { name: "lang", type: "string", description: "Recognition language (default: <html lang>, else en-US)." },
        { name: "label", type: "string", default: '"Voice input"', description: "Accessible name of the toggle." },
        { name: "showInterim", type: "boolean", default: "true", description: "Show the in-progress phrase." },
        { name: "showStatus", type: "boolean", default: "false", description: "Show “Listening…” visibly (errors and unsupported notes always show)." },
        { name: "unsupportedText", type: "ReactNode", description: "Explanation when no capture method exists." },
        { name: "size / disabled", type: '"sm" | "md" / boolean', description: "Button size; disable." },
      ],
    },
  ],
  a11y: [
    "A Base UI Toggle: aria-pressed is true while listening; the name stays the same.",
    "“Listening…”, “Transcribing…” and errors are announced in a polite status region that also describes the button.",
    "The recording pulse is decorative and stops under reduced motion; the stop icon and pressed state carry the meaning.",
  ],
};

export default doc;
