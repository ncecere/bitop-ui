import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { type ComponentDoc, examples } from "../types";
import raw from "./text-link.tsx?raw";

export function Links() {
  return (
    <p>
      Read the <TextLink href="#links">deployment guide</TextLink>, check the{" "}
      <TextLink href="#links" tone="muted">
        changelog
      </TextLink>
      , or open the{" "}
      <TextLink href="https://base-ui.com" external>
        Base UI docs
      </TextLink>
      .
    </p>
  );
}

const doc: ComponentDoc = {
  slug: "text-link",
  title: "Text link",
  category: "Actions",
  description: "An inline link that is always underlined, with a muted tone and an external variant.",
  imports: `import { TextLink } from "@/components/ui/text-link/text-link";`,
  examples: examples(raw, [["Links", Links, { title: "Links in a sentence" }]]),
  props: [
    {
      component: "TextLink",
      note: "Also accepts native <a> props.",
      rows: [
        { name: "tone", type: '"default" | "muted"', default: '"default"', description: "Muted for secondary links in dense UI." },
        { name: "external", type: "boolean", default: "false", description: "New tab, icon and an announced “(opens in a new tab)”." },
        { name: "render", type: "RenderProp", description: "Render a router link." },
      ],
    },
  ],
  a11y: [
    "Links are underlined, so they are not identified by colour alone (WCAG 1.4.1).",
    'External links add rel="noopener noreferrer" and tell screen-reader users they open a new tab.',
  ],
};

export default doc;
