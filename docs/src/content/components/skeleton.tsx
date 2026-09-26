import { Inline } from "@/registry/bitop/ui/layout/layout";
import { Skeleton, SkeletonText } from "@/registry/bitop/ui/skeleton/skeleton";
import { type ComponentDoc, examples } from "../types";
import raw from "./skeleton.tsx?raw";

export function Placeholder() {
  return (
    <Inline gap={4} wrap={false} align="start" style={{ width: "100%", maxWidth: "28rem" }}>
      <Skeleton shape="circle" width="2.5rem" height="2.5rem" />
      <div style={{ flex: 1 }}>
        <SkeletonText lines={3} />
      </div>
    </Inline>
  );
}

const doc: ComponentDoc = {
  slug: "skeleton",
  title: "Skeleton",
  category: "Feedback",
  description: "Shimmering placeholders for content that is loading: rectangles, circles and lines of text.",
  imports: `import { Skeleton, SkeletonText } from "@/components/ui/skeleton/skeleton";`,
  examples: examples(raw, [["Placeholder", Placeholder, { title: "Avatar and text" }]]),
  props: [
    {
      component: "Skeleton",
      rows: [
        { name: "width / height", type: "CSS length", description: "Size." },
        { name: "shape", type: '"rect" | "text" | "circle"', default: '"rect"', description: "Shape." },
      ],
    },
    { component: "SkeletonText", rows: [{ name: "lines", type: "number", default: "3", description: "Number of lines; the last is shorter." }] },
  ],
  a11y: ["Skeletons are aria-hidden: announce loading with Loading or a status message instead.", "The shimmer stops under prefers-reduced-motion."],
};

export default doc;
