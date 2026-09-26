import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/bitop/ui/resizable/resizable";
import { type ComponentDoc, examples } from "../types";
import raw from "./resizable.tsx?raw";

export function Editor() {
  return (
    <div style={{ height: "14rem", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-ring)", overflow: "hidden" }}>
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
          <div style={{ padding: "1rem" }}>Files</div>
        </ResizablePanel>
        <ResizableHandle withHandle label="Resize file list" />
        <ResizablePanel>
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={70} minSize={30}>
              <div style={{ padding: "1rem" }}>Editor</div>
            </ResizablePanel>
            <ResizableHandle label="Resize terminal" />
            <ResizablePanel minSize={15}>
              <div style={{ padding: "1rem" }}>Terminal</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export function Persisted() {
  // In an app, read and write localStorage instead of component state.
  const [saved, setSaved] = useState<number[]>([40, 60]);
  return (
    <div style={{ display: "grid", gap: "0.5rem" }}>
      <div style={{ height: "8rem", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-ring)", overflow: "hidden" }}>
        <ResizablePanelGroup defaultLayout={saved} onLayoutChange={setSaved}>
          <ResizablePanel minSize={25}>
            <div style={{ padding: "1rem" }}>Preview</div>
          </ResizablePanel>
          <ResizableHandle label="Resize preview" />
          <ResizablePanel minSize={25}>
            <div style={{ padding: "1rem" }}>Inspector</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <p>Saved layout: {saved.map((n) => `${Math.round(n)}%`).join(" / ")}</p>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "resizable",
  title: "Resizable",
  category: "Layout",
  description: "Panel groups with draggable, keyboard-operable handles between them. Sizes are percentages and can be saved and restored.",
  imports: `import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable/resizable";`,
  examples: examples(raw, [
    ["Editor", Editor, { title: "Nested groups", wide: true }],
    ["Persisted", Persisted, { title: "Persisted layout", wide: true }],
  ]),
  props: [
    {
      component: "ResizablePanelGroup",
      note: "Also accepts native <div> props and render.",
      rows: [
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Side by side, or stacked." },
        { name: "defaultLayout", type: "number[]", description: "Starting sizes (percent, one per panel), e.g. a saved layout." },
        { name: "onLayoutChange", type: "(layout: number[]) => void", description: "Fires when a resize finishes (pointer up or key press)." },
        { name: "keyboardStep", type: "number", default: "5", description: "Percent per arrow key press." },
      ],
    },
    {
      component: "ResizablePanel",
      rows: [
        { name: "defaultSize", type: "number", description: "Initial percent; panels without one share the rest." },
        { name: "minSize / maxSize", type: "number / number", default: "0 / 100", description: "Limits in percent." },
        { name: "id", type: "string", description: "Panel id (generated if omitted); the handle's aria-controls points at it." },
      ],
    },
    {
      component: "ResizableHandle",
      rows: [
        { name: "label", type: "string", default: '"Resize panels"', description: "Accessible name; say what it resizes." },
        { name: "withHandle", type: "boolean", description: "Show a visible grip." },
        { name: "disabled", type: "boolean", description: "Not focusable or draggable." },
      ],
    },
  ],
  a11y: [
    'Handles are focusable window splitters: role="separator" with aria-orientation, aria-valuenow/min/max (the size of the panel before it, in percent) and aria-controls.',
    "Arrow keys resize by keyboardStep; Home and End jump to the smallest and largest size. Horizontal arrows follow the visual direction in right-to-left layouts.",
    "Min and max limits apply to pointer and keyboard alike, and the values reported to assistive technology already account for the neighbouring panel's limits.",
    "The hit area is wider than the 1px line; the focus ring and optional grip meet 3:1.",
  ],
};

export default doc;
