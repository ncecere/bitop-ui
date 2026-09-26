import { VisuallyHidden } from "@/registry/bitop/ui/visually-hidden/visually-hidden";
import { type ComponentDoc, examples } from "../types";
import raw from "./visually-hidden.tsx?raw";

export function Hidden() {
  return (
    <p>
      There is hidden text after this sentence for screen readers.
      <VisuallyHidden> This sentence is only announced by assistive technology.</VisuallyHidden>
    </p>
  );
}

const doc: ComponentDoc = {
  slug: "visually-hidden",
  title: "Visually hidden",
  category: "Layout",
  description: "Content that is announced by assistive technology but not shown, e.g. extra context for icon-only UI.",
  imports: `import { VisuallyHidden } from "@/components/ui/visually-hidden/visually-hidden";`,
  examples: examples(raw, [["Hidden", Hidden, { title: "Hidden text" }]]),
  props: [
    {
      component: "VisuallyHidden",
      note: "Also accepts native <span> props.",
      rows: [{ name: "render", type: "RenderProp", description: "Render another element, e.g. <h2 />." }],
    },
  ],
  a11y: ["Uses the sr-only pattern (clip + 1px box), not display:none, so it stays in the accessibility tree.", "Don't hide focusable elements with it."],
};

export default doc;
