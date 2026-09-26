import { ColorModeToggle, useColorMode } from "@/registry/bitop/ui/color-mode/color-mode";
import { Button } from "@/registry/bitop/ui/button/button";
import { Inline } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./color-mode.tsx?raw";

export function Toggle() {
  return <ColorModeToggle variant="secondary" />;
}

export function Hook() {
  const { mode, resolved, setMode } = useColorMode();
  return (
    <Inline gap={2}>
      {(["light", "dark", "system"] as const).map((m) => (
        <Button key={m} size="sm" variant={mode === m ? "primary" : "secondary"} aria-pressed={mode === m} onClick={() => setMode(m)}>
          {m[0]!.toUpperCase() + m.slice(1)}
        </Button>
      ))}
      <span>Resolved: {resolved}</span>
    </Inline>
  );
}

const doc: ComponentDoc = {
  slug: "color-mode",
  title: "Color mode",
  category: "Theming",
  description:
    'Light and dark mode for bitop-ui themes. It sets data-theme on <html> from a saved choice or prefers-color-scheme, and exports a no-flash script for your index.html.',
  imports: `import { ColorModeToggle, colorModeScript, useColorMode } from "@/components/ui/color-mode/color-mode";`,
  examples: examples(raw, [
    ["Toggle", Toggle, { title: "Toggle", description: "This is the toggle in the docs header." }],
    ["Hook", Hook, { title: "useColorMode", description: '"system" follows the operating system and updates live.' }],
  ]),
  props: [
    {
      component: "ColorModeToggle",
      note: "Also accepts IconButton props except icon and onClick.",
      rows: [{ name: "label", type: "string", default: '"Dark mode"', description: "Accessible name; aria-pressed says whether dark mode is on." }],
    },
    {
      component: "useColorMode()",
      rows: [
        { name: "mode", type: '"light" | "dark" | "system"', description: "The saved choice." },
        { name: "resolved", type: '"light" | "dark"', description: "What is applied now." },
        { name: "setMode", type: "(mode) => void", description: "Save and apply a mode." },
        { name: "toggle", type: "() => void", description: "Switch between light and dark." },
      ],
    },
  ],
  a11y: [
    "The toggle keeps a constant name and reports its state with aria-pressed, so the label never lies.",
    "Both themes are contrast-checked in CI (tests/contrast.test.ts).",
  ],
};

export default doc;
