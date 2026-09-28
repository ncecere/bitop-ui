import { Avatar } from "@/registry/bitop/ui/avatar/avatar";
import { type ComponentDoc, examples } from "../types";
import raw from "./avatar.tsx?raw";

export function Sizes() {
  return (
    <>
      <Avatar name="Ada Lovelace" size="xs" />
      <Avatar name="Grace Hopper" size="sm" />
      <Avatar name="Alan Turing" />
      <Avatar name="Acme Inc" shape="square" size="lg" />
    </>
  );
}

const doc: ComponentDoc = {
  slug: "avatar",
  title: "Avatar",
  category: "Display",
  description: "An image avatar that falls back to initials. Square avatars suit workspaces and teams.",
  imports: `import { Avatar } from "@/components/ui/avatar/avatar";`,
  baseUi: { name: "Avatar", href: "https://base-ui.com/react/components/avatar" },
  examples: examples(raw, [["Sizes", Sizes, { title: "Sizes and shapes" }]]),
  props: [
    {
      component: "Avatar",
      rows: [
        { name: "name", type: "string", required: true, description: "Used for the initials (first letter or digit of the first and last words; punctuation and symbols are skipped) and the accessible name." },
        { name: "src", type: "string", description: "Image URL; initials show until it loads." },
        { name: "size", type: '"xs" | "sm" | "md" | "lg" | "xl"', default: '"md"', description: "Diameter (1.25 to 3.5rem)." },
        { name: "shape", type: '"circle" | "square"', default: '"circle"', description: "Square for workspaces." },
        { name: "decorative", type: "boolean", default: "false", description: "Hide from assistive tech when the name is shown next to it." },
      ],
    },
  ],
  a11y: ["The avatar is an image named by name (role=\"img\").", "Use decorative when the person's name is already visible next to it, to avoid repetition."],
};

export default doc;
