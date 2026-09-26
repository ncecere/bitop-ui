import { ArrowRight, Copy, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { type ComponentDoc, examples } from "../types";
import raw from "./button.tsx?raw";

export function Variants() {
  return (
    <>
      <Button>Create project</Button>
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Dismiss</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="link">View details</Button>
    </>
  );
}

export function SizesAndIcons() {
  return (
    <>
      <Button size="sm">
        <Plus aria-hidden /> Small
      </Button>
      <Button>
        <Plus aria-hidden /> Medium
      </Button>
      <Button variant="secondary" size="sm">
        <Share2 aria-hidden /> Share
      </Button>
      <Button variant="secondary">
        Continue <ArrowRight aria-hidden />
      </Button>
    </>
  );
}

export function States() {
  const [loading, setLoading] = useState(false);
  return (
    <>
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 1600);
        }}
      >
        {loading ? "Saving…" : "Save changes"}
      </Button>
      <Button loading variant="secondary">
        Uploading
      </Button>
      <Button disabled>Disabled</Button>
    </>
  );
}

export function IconButtons() {
  return (
    <>
      <Tooltip content="Edit">
        <IconButton icon={<Pencil aria-hidden />} label="Edit" />
      </Tooltip>
      <Tooltip content="Copy" shortcut="⌘C">
        <IconButton icon={<Copy aria-hidden />} label="Copy" variant="secondary" />
      </Tooltip>
      <Tooltip content="Delete">
        <IconButton icon={<Trash2 aria-hidden />} label="Delete" variant="danger" />
      </Tooltip>
      <IconButton icon={<Plus aria-hidden />} label="Add" variant="primary" size="sm" />
    </>
  );
}

export function AsLink() {
  return (
    <Button variant="secondary" render={<a href="#as-a-link" />}>
      Button rendered as a link
    </Button>
  );
}

const doc: ComponentDoc = {
  slug: "button",
  title: "Button",
  category: "Actions",
  description: "Native buttons with five variants, two sizes, a loading state and a render prop for router links. IconButton is the square, icon-only version.",
  imports: `import { Button, IconButton } from "@/components/ui/button/button";`,
  baseUi: { name: "useRender", href: "https://base-ui.com/react/utils/use-render" },
  examples: examples(raw, [
    ["Variants", Variants, { title: "Variants" }],
    ["SizesAndIcons", SizesAndIcons, { title: "Sizes and icons", description: "Icons are decorative (aria-hidden); the text names the button." }],
    ["States", States, { title: "Loading and disabled", description: "Loading sets aria-busy, shows a spinner and disables the button." }],
    ["IconButtons", IconButtons, { title: "Icon buttons", description: "The label prop is required by the type and becomes the accessible name." }],
    ["AsLink", AsLink, { title: "As a link", description: "Pass render={<a />} or a router Link; native-only props like type are dropped." }],
  ]),
  props: [
    {
      component: "Button",
      note: "Also accepts every native <button> prop and ref.",
      rows: [
        { name: "variant", type: '"primary" | "secondary" | "danger" | "ghost" | "link"', default: '"primary"', description: "Visual style." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "32px or 36px tall." },
        { name: "loading", type: "boolean", default: "false", description: "Shows a spinner, sets aria-busy and disables the button." },
        { name: "block", type: "boolean", default: "false", description: "Stretch to the container width." },
        { name: "iconOnly", type: "boolean", default: "false", description: "Square button; the type then requires aria-label." },
        { name: "render", type: "RenderProp", description: "Render another element, e.g. <Link to=… />." },
      ],
    },
    {
      component: "IconButton",
      rows: [
        { name: "icon", type: "ReactNode", required: true, description: "The icon (mark it aria-hidden)." },
        { name: "label", type: "string", required: true, description: "Accessible name." },
        { name: "variant", type: "ButtonVariant", default: '"ghost"', description: "Visual style." },
      ],
    },
  ],
  a11y: [
    'Renders a real <button type="button"> by default, so it never submits a form by accident.',
    "Loading buttons are disabled and expose aria-busy=\"true\".",
    "When rendered as a link, disabled is expressed with aria-disabled because links can't be disabled natively.",
    "IconButton and iconOnly buttons require an accessible name at the type level.",
  ],
};

export default doc;
