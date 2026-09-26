import { ScrollArea } from "@/registry/bitop/ui/scroll-area/scroll-area";
import { type ComponentDoc, examples } from "../types";
import raw from "./scroll-area.tsx?raw";

export function ReleaseNotes() {
  const versions = Array.from({ length: 24 }, (_, i) => `v2.${24 - i}.0`);
  return (
    <ScrollArea label="Release notes" maxHeight="14rem">
      <ul style={{ margin: 0, padding: "0.75rem 1rem", listStyle: "none", display: "grid", gap: "0.5rem" }}>
        {versions.map((v) => (
          <li key={v}>
            <strong>{v}</strong> — bug fixes and performance improvements.
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

export function Horizontal() {
  const tags = ["design", "frontend", "backend", "infra", "docs", "billing", "security", "mobile", "analytics", "growth", "support", "research"];
  return (
    <ScrollArea label="Project tags" orientation="horizontal">
      <ul style={{ display: "flex", gap: "0.5rem", margin: 0, padding: "0.5rem 0 0.75rem", listStyle: "none", width: "max-content" }}>
        {tags.map((t) => (
          <li key={t} style={{ padding: "0.25rem 0.75rem", borderRadius: 999, boxShadow: "var(--shadow-control)" }}>
            {t}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

const doc: ComponentDoc = {
  slug: "scroll-area",
  title: "Scroll area",
  category: "Layout",
  description: "A scroll container with slim scrollbars that appear on hover and while scrolling. Native scrolling, keyboard and find-in-page keep working.",
  imports: `import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area/scroll-area";`,
  baseUi: { name: "Scroll Area", href: "https://base-ui.com/react/components/scroll-area" },
  examples: examples(raw, [
    ["ReleaseNotes", ReleaseNotes, { title: "Vertical, with maxHeight", wide: true }],
    ["Horizontal", Horizontal, { title: "Horizontal", wide: true }],
  ]),
  props: [
    {
      component: "ScrollArea",
      note: "Also accepts Base UI ScrollArea.Root props (overflowEdgeThreshold…).",
      rows: [
        { name: "label", type: "string", required: true, description: "Names the viewport region while it is scrollable." },
        { name: "orientation", type: '"vertical" | "horizontal" | "both"', default: '"vertical"', description: "Which scrollbars to render." },
        { name: "maxHeight", type: "string", description: 'Maximum height, e.g. "20rem" (or size it with className).' },
        { name: "viewportClassName / contentClassName", type: "string", description: "Classes for the inner parts." },
      ],
    },
    { component: "ScrollBar", rows: [{ name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "For custom compositions." }] },
  ],
  a11y: [
    "When the content overflows, the viewport joins the tab order (Base UI) and becomes a region named by label, so keyboard users can scroll it with the arrow keys (WCAG 2.1.1).",
    "Content that fits is not a tab stop and not a landmark.",
    "The custom scrollbars are pointer affordances only; the thumb uses a 3:1 boundary colour.",
    "Fade transitions are removed under prefers-reduced-motion.",
  ],
};

export default doc;
