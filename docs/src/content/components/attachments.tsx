import { useState } from "react";
import { Attachment, type AttachmentData, Attachments } from "@/registry/bitop/ui/attachments/attachments";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./attachments.tsx?raw";

export function Chips() {
  const [files, setFiles] = useState<AttachmentData[]>([
    { id: "1", name: "quarterly-report.pdf", size: 2_400_000, type: "application/pdf" },
    { id: "2", name: "notes.md", size: 5_300, type: "text/markdown" },
    { id: "3", name: "diagram.png", size: 820_000, type: "image/png", status: "uploading" },
    { id: "4", name: "archive.zip", size: 48_000_000, type: "application/zip", status: "error" },
  ]);
  return (
    <div className={styles.stack}>
      <Attachments>
        {files.map((f) => (
          <Attachment key={f.id} file={f} onRemove={() => setFiles((all) => all.filter((x) => x.id !== f.id))} />
        ))}
      </Attachments>
      {files.length === 0 && <p className={styles.muted}>All removed.</p>}
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "attachments",
  title: "Attachments",
  category: "AI",
  description: "File chips for a composer or a sent message: image thumbnail or file icon, size and type, upload state and a remove button. PromptInputAttachments renders them from the composer's files.",
  imports: `import { Attachment, Attachments, formatBytes } from "@/components/ui/attachments/attachments";`,
  examples: examples(raw, [["Chips", Chips, { title: "Ready, uploading and failed", wide: true }]]),
  props: [
    { component: "Attachments", rows: [{ name: "label", type: "string", default: '"Attachments"', description: "Name of the list." }] },
    {
      component: "Attachment",
      rows: [
        { name: "file", type: "{ id, name, size?, type?, url?, status? }", required: true, description: "url is an image preview; status is uploading, ready or error." },
        { name: "onRemove", type: "() => void", description: "Shows a “Remove <name>” button." },
        { name: "icon", type: "ReactNode", description: "Custom file icon." },
      ],
    },
    { component: "formatBytes(bytes)", rows: [], note: "1536 → “1.5 KB”." },
  ],
  a11y: [
    "A named list of files; each remove button says which file it removes.",
    "Upload state is written out (“Uploading…”, “Upload failed”), not shown by the spinner or colour alone.",
    "Thumbnails are decorative (alt=\"\"): the file name is the text alternative.",
  ],
};

export default doc;
