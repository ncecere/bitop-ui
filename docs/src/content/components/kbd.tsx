import { Kbd, KbdShortcut } from "@/registry/bitop/ui/kbd/kbd";
import { type ComponentDoc, examples } from "../types";
import raw from "./kbd.tsx?raw";

export function Keys() {
  return (
    <>
      <KbdShortcut keys={["mod", "K"]} />
      <KbdShortcut keys={["shift", "enter"]} />
      <Kbd>Esc</Kbd>
      <KbdShortcut keys={["mod", "S"]} size="sm" />
    </>
  );
}

const doc: ComponentDoc = {
  slug: "kbd",
  title: "Kbd",
  category: "Display",
  description: "Key caps and platform-aware shortcuts: mod renders ⌘ on Apple platforms and Ctrl elsewhere.",
  imports: `import { Kbd, KbdShortcut } from "@/components/ui/kbd/kbd";`,
  examples: examples(raw, [["Keys", Keys, { title: "Keys and shortcuts" }]]),
  props: [
    { component: "Kbd", note: "Native <kbd> props plus:", rows: [{ name: "size", type: '"sm" | "md"', default: '"md"', description: "Cap size." }] },
    {
      component: "KbdShortcut",
      rows: [
        { name: "keys", type: "string[]", required: true, description: 'e.g. ["mod", "K"]; also shift, alt, enter, esc, up, down.' },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Cap size." },
      ],
    },
  ],
  a11y: ["Symbols such as ⌘ and ⇧ have spelled-out names for screen readers (Command, Shift)."],
};

export default doc;
