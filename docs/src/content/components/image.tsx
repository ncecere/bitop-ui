import { Image } from "@/registry/bitop/ui/image/image";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./image.tsx?raw";

export function Generated() {
  // In an app this comes from your image model, e.g. result.image.base64.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
    <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312e81"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs>
    <rect width="320" height="200" fill="url(#sky)"/>
    <circle cx="228" cy="120" r="34" fill="#fde68a"/>
    <path d="M0 150 L70 110 L130 140 L200 96 L320 150 L320 200 L0 200 Z" fill="#1e1b4b"/>
  </svg>`;
  return (
    <div className={styles.stack}>
      <Image
        base64={btoa(svg)}
        mediaType="image/svg+xml"
        alt="Stylised sunset: a pale sun sinking behind dark mountains under an indigo-to-orange sky"
        aspectRatio="16 / 10"
      />
    </div>
  );
}

export function Failed() {
  return (
    <div className={styles.stack}>
      <Image src="/does-not-exist.png" alt="Architecture diagram of the ingestion pipeline" aspectRatio="16 / 9" />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "image",
  title: "Image",
  category: "AI",
  description: "Shows an AI-generated image from base64, a Uint8Array or a URL, with required alt text, a placeholder while loading and a fallback on error.",
  imports: `import { Image } from "@/components/ui/image/image";`,
  examples: examples(raw, [
    ["Generated", Generated, { title: "Generated image (base64)" }],
    ["Failed", Failed, { title: "Load error fallback" }],
  ]),
  props: [
    {
      component: "Image",
      note: "Other native <img> props (width, height, loading, onLoad…) go to the image; className is on the <img>.",
      rows: [
        { name: "alt", type: "string", required: true, description: 'Text alternative. Use "" only for decorative images.' },
        { name: "base64 / uint8Array / src", type: "string / Uint8Array / string", required: true, description: "One image source. Bytes become an object URL, revoked on unmount." },
        { name: "mediaType", type: "string", default: '"image/png"', description: "MIME type for base64 and bytes." },
        { name: "aspectRatio", type: "string", description: 'Reserves space before load, e.g. "16 / 9"; the image covers the box.' },
        { name: "framed", type: "boolean", default: "true", description: "Rounded corners and a hairline ring." },
        { name: "fallback", type: "ReactNode", description: 'Shown on error (default: "Image unavailable" and the alt text).' },
        { name: "frameClassName", type: "string", description: "Class for the wrapper." },
      ],
    },
  ],
  a11y: [
    "alt is a required prop; the fallback repeats it as text so the description survives a failed load.",
    "The frame is aria-busy while loading; the shimmer stops under reduced motion.",
    "Display-only: no interactive behaviour of its own.",
  ],
};

export default doc;
