import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/registry/bitop/ui/drop-zone/drop-zone";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Progress } from "@/registry/bitop/ui/progress/progress";
import { type ComponentDoc, examples } from "../types";
import raw from "./drop-zone.tsx?raw";

export function Upload() {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  useEffect(() => () => clearInterval(timer.current), []);
  function start(files: File[]) {
    setMessage("");
    setProgress(0);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, (p ?? 0) + 12);
        if (next >= 100) {
          clearInterval(timer.current);
          setTimeout(() => {
            setProgress(null);
            setMessage(`Uploaded ${files.length} file${files.length === 1 ? "" : "s"}.`);
          }, 300);
        }
        return next;
      });
    }, 180);
  }
  return (
    <Stack gap={4}>
      <DropZone
        onFiles={start}
        busy={progress !== null}
        label="Drag and drop files here, or"
        buttonLabel="Choose files to upload"
        description="PDF, PNG, CSV or Markdown, up to 5 MB each."
        accept=".pdf,.png,.csv,.md"
        maxSize={5 * 1024 * 1024}
      />
      {progress !== null && <Progress label="Uploading" value={progress} />}
      <p role="status">{message}</p>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "drop-zone",
  title: "Drop zone",
  category: "Forms",
  description: "A file picker that is fully keyboard-operable through a real button; dragging and dropping files is an enhancement.",
  imports: `import { DropZone } from "@/components/ui/drop-zone/drop-zone";`,
  examples: examples(raw, [["Upload", Upload, { title: "With progress", wide: true }]]),
  props: [
    {
      component: "DropZone",
      rows: [
        { name: "onFiles", type: "(files: File[]) => void", required: true, description: "Accepted chosen or dropped files (never empty)." },
        {
          name: "onReject",
          type: '(rejections: { file: File; reason: "type" | "size" }[]) => void',
          description: "Files that failed accept or maxSize. They are also announced in a status line under the button.",
        },
        { name: "label", type: "ReactNode", default: '"Drag and drop files here, or"', description: "Group heading." },
        { name: "buttonLabel", type: "string", description: "Button text and accessible name." },
        { name: "description", type: "ReactNode", description: "Accepted types and limits; describes the button." },
        { name: "accept / multiple", type: "string / boolean", default: "— / true", description: 'Accepted types (".pdf", "image/*", "application/json"), checked for picked and dropped files alike; the picker also uses it as a hint.' },
        { name: "maxSize", type: "number", description: "Largest accepted file, in bytes." },
        { name: "busy / disabled", type: "boolean", description: "Busy shows a spinner; neither delivers files." },
        { name: "icon", type: "ReactNode", description: "Replace the upload icon." },
      ],
    },
  ],
  a11y: [
    "The zone is a labelled group; the button opens the native file picker, so keyboard and screen-reader users never need drag and drop.",
    "The description is attached to the button with aria-describedby.",
    "While busy the button is aria-busy and files are ignored.",
    "Rejected files are named in a polite status line (“setup.exe isn't an accepted file type.”), so the reason is announced, not just shown.",
  ],
};

export default doc;
