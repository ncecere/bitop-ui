import { ArrowRight, Bell, Moon } from "lucide-react";
import { useCallback, useState } from "react";
import { CommandPalette, CommandPaletteTrigger, useCommandPaletteShortcut, type CommandGroup } from "@/registry/bitop/ui/command-palette/command-palette";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./command-palette.tsx?raw";

export function Palette() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  useCommandPaletteShortcut(toggle);
  const groups: CommandGroup[] = [
    {
      label: "Jump to",
      items: [
        { id: "projects", label: "Projects", icon: <ArrowRight aria-hidden />, hint: "Page", onSelect: () => toast.info("Projects") },
        { id: "billing", label: "Billing", icon: <ArrowRight aria-hidden />, hint: "Page", keywords: ["invoices"], onSelect: () => toast.info("Billing") },
      ],
    },
    {
      label: "Actions",
      items: [
        { id: "notify", label: "Show a toast", icon: <Bell aria-hidden />, onSelect: () => toast.success("Hello from the palette") },
        { id: "theme", label: "Toggle dark mode", icon: <Moon aria-hidden />, shortcut: ["shift", "D"], onSelect: () => toast.info("Use the header toggle") },
      ],
    },
  ];
  return (
    <>
      <CommandPaletteTrigger onClick={() => setOpen(true)} label="Search or jump to…" />
      <CommandPalette open={open} onOpenChange={setOpen} groups={groups} />
    </>
  );
}

const doc: ComponentDoc = {
  slug: "command-palette",
  title: "Command palette",
  category: "Overlays",
  description: "A ⌘K / Ctrl+K dialog with grouped commands, keyword filtering and shortcut hints, plus a search-field style trigger.",
  imports: `import {
  CommandPalette,
  CommandPaletteTrigger,
  useCommandPaletteShortcut,
  type CommandGroup,
} from "@/components/ui/command-palette/command-palette";`,
  baseUi: { name: "Autocomplete + Dialog", href: "https://base-ui.com/react/components/autocomplete" },
  examples: examples(raw, [
    ["Palette", Palette, { title: "Palette", description: "Press ⌘K / Ctrl+K on this page too. Type, use ↑/↓ and Enter." }],
  ]),
  props: [
    {
      component: "CommandPalette",
      rows: [
        { name: "open", type: "boolean", required: true, description: "Controlled open state." },
        { name: "onOpenChange", type: "(open: boolean) => void", required: true, description: "Called on open/close." },
        { name: "groups", type: "{ label, items: Command[] }[]", required: true, description: "Command groups; empty groups are hidden." },
        { name: "placeholder", type: "string", default: '"Search pages and actions…"', description: "Input placeholder." },
        { name: "label", type: "string", default: '"Command palette"', description: "Accessible name of the dialog and input." },
        { name: "emptyText", type: "ReactNode", default: '"No results found."', description: "Shown when nothing matches." },
        {
          name: "finalFocus",
          type: "Dialog.Popup finalFocus",
          description: "Where focus goes on close (default: the opener). Return the new page's heading from a function when a command navigates.",
        },
        { name: "className", type: "string", description: "Class for the dialog popup, merged with the built-in styles (e.g. to scope token overrides)." },
      ],
    },
    {
      component: "Command",
      rows: [
        { name: "id", type: "string", required: true, description: "Stable key." },
        { name: "label", type: "string", required: true, description: "Visible text; matched by the filter." },
        { name: "onSelect", type: "() => void", required: true, description: "Runs after the palette closes." },
        { name: "keywords", type: "string[]", description: "Extra search terms." },
        { name: "icon / hint / shortcut", type: "ReactNode / ReactNode / string[]", description: "Decorative extras." },
      ],
    },
    { component: "useCommandPaletteShortcut", rows: [{ name: "toggle", type: "() => void", required: true, description: "Called on ⌘K / Ctrl+K (memoise it)." }] },
  ],
  a11y: [
    "A modal dialog containing a combobox and listbox (Base UI Autocomplete): arrow keys move, Enter runs, Escape closes.",
    "Focus moves to the input on open and returns to the trigger on close.",
    "Keyboard hints in the footer are also available to screen readers as the input's description.",
  ],
};

export default doc;
