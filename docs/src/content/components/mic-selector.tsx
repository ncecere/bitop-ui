import { useState } from "react";
import { MicSelector } from "@/registry/bitop/ui/mic-selector/mic-selector";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./mic-selector.tsx?raw";

export function PickMicrophone() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  return (
    <div className={styles.stack}>
      <MicSelector label="Microphone" value={deviceId} onValueChange={setDeviceId} />
      <span className={styles.muted}>
        {deviceId ? "Recording will use the selected device." : "Recording will use the system default microphone."}
      </span>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "mic-selector",
  title: "Mic selector",
  category: "AI",
  description:
    "A microphone picker over navigator.mediaDevices. It asks for permission to reveal device names, updates when devices are plugged in, and explains itself where capture isn't available.",
  imports: `import { MicSelector, useAudioInputs } from "@/components/ui/mic-selector/mic-selector";`,
  baseUi: { name: "Select", href: "https://base-ui.com/react/components/select" },
  examples: examples(raw, [["PickMicrophone", PickMicrophone, { title: "Pick a microphone" }]]),
  props: [
    {
      component: "MicSelector",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label and the select's accessible name." },
        { name: "hideLabel", type: "boolean", description: "Keep the label for assistive technology only." },
        { name: "value / defaultValue / onValueChange", type: "string | null / … / (deviceId, device) => void", description: "Selected deviceId; pass it to getUserMedia({ audio: { deviceId } })." },
        { name: "placeholder", type: "string", default: '"Select a microphone"', description: "Trigger text with no selection." },
        { name: "permissionLabel", type: "string", default: '"Allow microphone access"', description: "Button that requests permission to reveal device names." },
        { name: "formatLabel", type: "(device, index) => string", description: 'Device label (default strips USB ids; unnamed devices become "Microphone 1").' },
        { name: "unsupportedText", type: "ReactNode", description: "Shown when mediaDevices is unavailable (old browsers, insecure origins)." },
        { name: "size / disabled", type: '"sm" | "md" / boolean', description: "Trigger size; disable the control." },
      ],
    },
    {
      component: "useAudioInputs()",
      note: "Returns { devices, status, hasPermission, error, requestPermission, refresh } for custom UIs; refreshes on devicechange.",
      rows: [],
    },
  ],
  a11y: [
    "Built on the bitop Select (Base UI): a labelled button with a listbox popup, arrow keys and typeahead.",
    "Permission errors and “No microphones found” are announced in a polite status region and written out in text.",
    "The permission button shows a spinner and aria-busy while the browser prompt is open.",
  ],
};

export default doc;
