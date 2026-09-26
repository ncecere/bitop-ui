import { useEffect, useRef, useState } from "react";
import { type Voice, VoiceSelector } from "@/registry/bitop/ui/voice-selector/voice-selector";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./voice-selector.tsx?raw";

const voices: Voice[] = [
  { id: "aria", name: "Aria", gender: "Female", accent: "American", language: "English (US)", description: "Warm and clear; good for narration." },
  { id: "ellis", name: "Ellis", gender: "Male", accent: "British", language: "English (UK)", age: "Middle-aged", description: "Calm, measured news-reader tone." },
  { id: "noor", name: "Noor", gender: "Female", accent: "Indian", language: "English (IN)", description: "Friendly and upbeat." },
  { id: "kai", name: "Kai", gender: "Neutral", accent: "Australian", language: "English (AU)", age: "Young adult", description: "Casual, conversational." },
  { id: "lucia", name: "Lucía", gender: "Female", accent: "Mexican", language: "Spanish (MX)", description: "Bright and expressive." },
];

export function WithPreview() {
  const [voiceId, setVoiceId] = useState<string | null>("aria");
  const [playing, setPlaying] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function preview(voice: Voice) {
    clearTimeout(timer.current);
    if (playing === voice.id) return setPlaying(null);
    // In an app: play voice.previewUrl or call your TTS endpoint.
    setPlaying(voice.id);
    timer.current = setTimeout(() => setPlaying(null), 2500);
  }

  return (
    <div className={styles.row}>
      <VoiceSelector label="Voice" voices={voices} value={voiceId} onValueChange={setVoiceId} onPreview={preview} previewingId={playing} />
      <span className={styles.muted}>Speaking as: {voices.find((v) => v.id === voiceId)?.name ?? "—"}</span>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "voice-selector",
  title: "Voice selector",
  category: "AI",
  description: "Pick a text-to-speech voice from a searchable list in a dialog, with gender, accent, language and age metadata and a preview button per voice.",
  imports: `import { VoiceSelector, type Voice } from "@/components/ui/voice-selector/voice-selector";`,
  baseUi: { name: "Radio Group", href: "https://base-ui.com/react/components/radio" },
  examples: examples(raw, [["WithPreview", WithPreview, { title: "Searchable, with previews" }]]),
  props: [
    {
      component: "VoiceSelector",
      rows: [
        { name: "voices", type: "Voice[]", required: true, description: "{ id, name, description?, gender?, accent?, language?, age?, icon? }" },
        { name: "label", type: "string", required: true, description: "Accessible name of the trigger and the list (“Voice”)." },
        { name: "value / defaultValue / onValueChange", type: "string | null / … / (id, voice) => void", description: "Selected voice id." },
        { name: "onPreview", type: "(voice) => void", description: "Preview button callback; omit to hide the buttons." },
        { name: "previewingId / previewLoadingId", type: "string | null", description: "Voice whose preview is playing (Pause, aria-pressed) / loading (spinner)." },
        { name: "title / description", type: "ReactNode", default: '"Choose a voice"', description: "Dialog heading and help text." },
        { name: "placeholder / searchPlaceholder / emptyText", type: "string / string / ReactNode", description: "Texts." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Dialog state." },
        { name: "trigger", type: "ReactElement", description: "Custom trigger (default: a button showing the voice)." },
        { name: "size / disabled", type: '"sm" | "md" / boolean', description: "Trigger size; disable." },
      ],
    },
  ],
  a11y: [
    "The trigger is named “Voice: Aria” and opens a modal dialog (focus trapped, Esc and Done close, focus returns).",
    "Voices are a Base UI radio group: arrow keys move and select; Tab reaches each voice's preview button.",
    "Preview buttons are named “Preview Aria” and use aria-pressed while playing; the search result count is announced.",
    "A dialog rather than a listbox popup, because preview buttons can't be nested inside listbox options.",
  ],
};

export default doc;
