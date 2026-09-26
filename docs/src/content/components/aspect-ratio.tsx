import { AspectRatio } from "@/registry/bitop/ui/aspect-ratio/aspect-ratio";
import { Inline } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./aspect-ratio.tsx?raw";

export function Video() {
  return (
    <div style={{ width: "100%", maxWidth: "28rem" }}>
      <AspectRatio ratio={16 / 9} framed>
        {/* In an app: <video src="…" controls /> or <img src="…" alt="…" /> */}
        <div role="img" aria-label="Onboarding video poster" style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--color-text-muted)" }}>
          16 : 9
        </div>
      </AspectRatio>
    </div>
  );
}

export function Thumbnails() {
  const ratios = [
    { ratio: 1, label: "1 : 1" },
    { ratio: 4 / 3, label: "4 : 3" },
    { ratio: 3 / 4, label: "3 : 4" },
  ];
  return (
    <Inline gap={3} align="start">
      {ratios.map(({ ratio, label }) => (
        <div key={label} style={{ width: "8rem" }}>
          <AspectRatio ratio={ratio} framed>
            <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--color-text-muted)" }}>{label}</div>
          </AspectRatio>
        </div>
      ))}
    </Inline>
  );
}

const doc: ComponentDoc = {
  slug: "aspect-ratio",
  title: "Aspect ratio",
  category: "Layout",
  description: "A box that keeps a width-to-height ratio. Images, videos and iframes inside fill it and are cropped with object-fit: cover.",
  imports: `import { AspectRatio } from "@/components/ui/aspect-ratio/aspect-ratio";`,
  examples: examples(raw, [
    ["Video", Video, { title: "16:9 media" }],
    ["Thumbnails", Thumbnails, { title: "Square, 4:3 and 3:4" }],
  ]),
  props: [
    {
      component: "AspectRatio",
      note: "Also accepts native <div> props.",
      rows: [
        { name: "ratio", type: "number", default: "1", description: "Width ÷ height, e.g. 16 / 9." },
        { name: "framed", type: "boolean", description: "Rounded corners and a sunken placeholder background." },
      ],
    },
  ],
  a11y: ["Purely presentational: give the media inside it alt text (images) or a title (iframes)."],
};

export default doc;
