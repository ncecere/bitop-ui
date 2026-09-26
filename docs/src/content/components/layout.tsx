import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { Separator } from "@/registry/bitop/ui/separator/separator";
import { type ComponentDoc, examples } from "../types";
import raw from "./layout.tsx?raw";

const box = { padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-2)", background: "var(--color-primary-subtle)", color: "var(--color-primary-subtle-text)" };

export function StackAndInline() {
  return (
    <Stack gap={3}>
      {[1, 2, 3].map((n) => (
        <div key={n} style={box}>
          Stack item {n}
        </div>
      ))}
      <Separator label="or" />
      <Inline gap={2}>
        {["a", "b", "c", "d"].map((n) => (
          <div key={n} style={box}>
            Inline {n}
          </div>
        ))}
      </Inline>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "layout",
  title: "Layout",
  category: "Layout",
  description: "Stack (vertical), Inline (horizontal, wrapping) and Container (centred 1200px column) on the 4px spacing scale.",
  imports: `import { Container, Inline, Stack } from "@/components/ui/layout/layout";`,
  examples: examples(raw, [["StackAndInline", StackAndInline, { title: "Stack and Inline", wide: true }]]),
  props: [
    {
      component: "Stack / Inline",
      note: "Also accept native <div> props. Inline adds wrap (default true).",
      rows: [
        { name: "gap", type: "0 | 1 | … | 12", description: "Spacing token (--space-N)." },
        { name: "align", type: '"start" | "center" | "end" | "stretch" | "baseline"', description: "Cross-axis alignment." },
        { name: "justify", type: '"start" | "center" | "end" | "between"', description: "Main-axis alignment." },
        { name: "render", type: "RenderProp", description: "Render another element, e.g. <ul />." },
      ],
    },
    { component: "Container", rows: [{ name: "size", type: '"md" | "lg" | "full"', default: '"lg"', description: "Max width." }] },
  ],
  a11y: ["Layout components add no semantics; use render={<ul />} (with <li> children) when content is a list."],
};

export default doc;
