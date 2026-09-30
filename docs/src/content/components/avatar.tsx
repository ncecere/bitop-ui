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

export function Initials() {
  return (
    <>
      <Avatar name="IT Help Desk" shape="square" />
      <Avatar name="Go docs (signed-in)" shape="square" />
      <Avatar name="Ludwig van Beethoven" />
      <Avatar name="Cher" />
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
  examples: examples(raw, [
    ["Sizes", Sizes, { title: "Sizes and shapes" }],
    [
      "Initials",
      Initials,
      {
        title: "Initials",
        description: "The first letters of the first two words: IH, GD (punctuation is skipped), LB (a lowercase particle such as van or de is passed over) and C.",
      },
    ],
  ]),
  props: [
    {
      component: "Avatar",
      rows: [
        {
          name: "name",
          type: "string",
          required: true,
          description:
            "Used for the initials and the accessible name. Initials are the first letter or digit of the first two words (\"IT Help Desk\" → IH); punctuation and symbols are skipped, and lowercase particles (van, de, of…) are passed over for the second.",
        },
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
