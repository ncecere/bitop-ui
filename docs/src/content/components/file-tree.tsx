import { useState } from "react";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/registry/bitop/ui/file-tree/file-tree";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./file-tree.tsx?raw";

export function Basic() {
  return (
    <div className={styles.stack}>
      <FileTree label="Project files" defaultExpanded={["src", "src/components"]}>
        <FileTreeFolder path="src" name="src">
          <FileTreeFolder path="src/components" name="components">
            <FileTreeFile path="src/components/button.tsx" name="button.tsx" />
            <FileTreeFile path="src/components/dialog.tsx" name="dialog.tsx" />
          </FileTreeFolder>
          <FileTreeFolder path="src/lib" name="lib">
            <FileTreeFile path="src/lib/utils.ts" name="utils.ts" />
          </FileTreeFolder>
          <FileTreeFile path="src/index.ts" name="index.ts" />
        </FileTreeFolder>
        <FileTreeFile path="package.json" name="package.json" />
        <FileTreeFile path="README.md" name="README.md" />
      </FileTree>
    </div>
  );
}

export function Controlled() {
  const [expanded, setExpanded] = useState<string[]>(["app"]);
  const [selected, setSelected] = useState<string | null>("app/page.tsx");
  return (
    <div className={styles.stack}>
      <FileTree
        label="Changed files"
        expanded={expanded}
        onExpandedChange={setExpanded}
        selectedPath={selected}
        onSelect={(path, kind) => kind === "file" && setSelected(path)}
      >
        <FileTreeFolder path="app" name="app">
          <FileTreeFile path="app/page.tsx" name="page.tsx" meta="M" />
          <FileTreeFile path="app/layout.tsx" name="layout.tsx" meta="M" />
          <FileTreeFolder path="app/api" name="api">
            <FileTreeFile path="app/api/route.ts" name="route.ts" meta="A" />
          </FileTreeFolder>
        </FileTreeFolder>
        <FileTreeFile path="next.config.ts" name="next.config.ts" meta="M" />
      </FileTree>
      <p className={styles.muted}>
        Selected: <code>{selected ?? "nothing"}</code> · Open: <code>{expanded.join(", ") || "none"}</code>
      </p>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "file-tree",
  title: "File tree",
  category: "AI",
  description: "An expandable folder and file tree with full tree keyboard navigation, type-ahead and a selection callback.",
  imports: `import { FileTree, FileTreeFile, FileTreeFolder } from "@/components/ui/file-tree/file-tree";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Basic", Basic, { title: "Uncontrolled", description: "Click a folder or use the arrow keys; type a letter to jump.", wide: true }],
    ["Controlled", Controlled, { title: "Controlled expansion and selection", description: "The meta prop adds trailing text, here a git status.", wide: true }],
  ]),
  props: [
    {
      component: "FileTree",
      note: "Also accepts native <ul> props.",
      rows: [
        { name: "label", type: "string", required: true, description: "Accessible name of the tree." },
        { name: "expanded", type: "string[]", description: "Open folder paths (controlled)." },
        { name: "defaultExpanded", type: "string[]", default: "[]", description: "Initially open folder paths." },
        { name: "onExpandedChange", type: "(expanded: string[]) => void", description: "Called with the new list of open folders." },
        { name: "selectedPath", type: "string | null", description: "Selected path (controlled)." },
        { name: "defaultSelectedPath", type: "string | null", default: "null", description: "Initially selected path." },
        { name: "onSelect", type: '(path: string, kind: "file" | "folder") => void', description: "Click, Enter or Space on an item." },
      ],
    },
    {
      component: "FileTreeFolder / FileTreeFile",
      note: "Also accept native <li> props. FileTreeFolder takes nested items as children.",
      rows: [
        { name: "path", type: "string", required: true, description: "Unique path; used for selection and expansion." },
        { name: "name", type: "string", required: true, description: "Visible name, accessible name and type-ahead text." },
        { name: "icon", type: "ReactNode", description: "Decorative icon (default: folder / guessed from the extension)." },
        { name: "meta", type: "ReactNode", description: "Trailing text, read after the name." },
      ],
    },
  ],
  a11y: [
    'WAI-ARIA tree pattern: role="tree" named by label, role="treeitem" with aria-level, aria-selected and (folders) aria-expanded, children in role="group".',
    "One item is tabbable (roving tabindex). ↓/↑ move, → opens then enters a folder, ← closes then goes to the parent, Home/End jump, Enter/Space select (and toggle folders), * opens sibling folders, printable keys type-ahead.",
    "The selected item has a tint, a bar and heavier text, not colour alone; the chevron and group animations stop under reduced motion.",
  ],
};

export default doc;
