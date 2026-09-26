import { Copy, Download } from "lucide-react";
import { useState } from "react";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/registry/bitop/ui/artifact/artifact";
import { Button } from "@/registry/bitop/ui/button/button";
import { Response } from "@/registry/bitop/ui/response/response";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./artifact.tsx?raw";

export function Panel() {
  const [open, setOpen] = useState(true);
  if (!open) return <Button onClick={() => setOpen(true)}>Reopen the artifact</Button>;
  return (
    <Artifact className={styles.artifact}>
      <ArtifactHeader>
        <div>
          <ArtifactTitle>Q3 board summary</ArtifactTitle>
          <ArtifactDescription>Markdown · generated 2 minutes ago</ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction label="Copy" icon={<Copy aria-hidden />} onClick={() => toast.success("Copied")} />
          <ArtifactAction label="Download" icon={<Download aria-hidden />} onClick={() => toast.info("Downloading…")} />
          <ArtifactClose onClick={() => setOpen(false)} />
        </ArtifactActions>
      </ArtifactHeader>
      <ArtifactContent>
        <Response>{"## Highlights\n\n- Revenue up **12%** quarter on quarter\n- Churn down to 2.1%\n- Two enterprise launches\n\n## Risks\n\n- Hiring behind plan in support\n- Data-centre migration slipping to Q4\n\n## Asks\n\n1. Approve the support hiring budget\n2. Confirm the Q4 migration window"}</Response>
      </ArtifactContent>
    </Artifact>
  );
}

const doc: ComponentDoc = {
  slug: "artifact",
  title: "Artifact",
  category: "AI",
  description: "A panel for something the assistant produced — a document, chart or code — with a header, actions, a close button and a scrollable body.",
  imports: `import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactClose,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ui/artifact/artifact";`,
  examples: examples(raw, [["Panel", Panel, { title: "Document artifact", wide: true }]]),
  props: [
    { component: "Artifact", rows: [], note: "A <section> named by its ArtifactTitle." },
    { component: "ArtifactHeader / ArtifactActions", rows: [], note: "Layout rows; put the title block first." },
    { component: "ArtifactTitle", rows: [{ name: "as", type: '"p" | "h2" | "h3" | "h4"', default: '"p"', description: "Element for the title." }] },
    { component: "ArtifactAction", note: "An IconButton with a tooltip.", rows: [{ name: "label", type: "string", required: true, description: "Accessible name and tooltip." }, { name: "icon", type: "ReactNode", required: true, description: "The icon." }] },
    { component: "ArtifactClose", rows: [{ name: "label", type: "string", default: '"Close"', description: "Accessible name." }] },
    { component: "ArtifactContent", rows: [{ name: "flush", type: "boolean", description: "No padding (full-bleed previews)." }] },
  ],
  a11y: ["The artifact is a section (region) named by its title; the body is focusable so keyboard users can scroll it.", "Icon actions have names and tooltips."],
};

export default doc;
