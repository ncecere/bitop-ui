import { useState } from "react";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarGroup,
  MenubarItem,
  MenubarLinkItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSubmenu,
} from "@/registry/bitop/ui/menubar/menubar";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./menubar.tsx?raw";

export function Editor() {
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [panel, setPanel] = useState("terminal");
  return (
    <Menubar aria-label="Editor">
      <MenubarMenu label="File">
        <MenubarItem shortcut="⌘N" onClick={() => toast.add({ title: "New file" })}>
          New file
        </MenubarItem>
        <MenubarItem shortcut="⌘O">Open…</MenubarItem>
        <MenubarSubmenu label="Open recent">
          <MenubarItem>deploy.config.ts</MenubarItem>
          <MenubarItem>README.md</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Clear recently opened</MenubarItem>
        </MenubarSubmenu>
        <MenubarSeparator />
        <MenubarSubmenu label="Export as">
          <MenubarItem>PDF</MenubarItem>
          <MenubarItem>HTML</MenubarItem>
          <MenubarItem>Markdown</MenubarItem>
        </MenubarSubmenu>
        <MenubarSeparator />
        <MenubarItem tone="danger" shortcut="⌘W">
          Close editor
        </MenubarItem>
      </MenubarMenu>
      <MenubarMenu label="Edit">
        <MenubarItem shortcut="⌘Z">Undo</MenubarItem>
        <MenubarItem shortcut="⇧⌘Z" disabled>
          Redo
        </MenubarItem>
        <MenubarSeparator />
        <MenubarItem shortcut="⌘X">Cut</MenubarItem>
        <MenubarItem shortcut="⌘C">Copy</MenubarItem>
        <MenubarItem shortcut="⌘V">Paste</MenubarItem>
      </MenubarMenu>
      <MenubarMenu label="View">
        <MenubarGroup label="Editor">
          <MenubarCheckboxItem checked={wordWrap} onCheckedChange={setWordWrap} shortcut="⌥Z">
            Word wrap
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked={minimap} onCheckedChange={setMinimap}>
            Minimap
          </MenubarCheckboxItem>
        </MenubarGroup>
        <MenubarSeparator />
        <MenubarRadioGroup label="Bottom panel" value={panel} onValueChange={setPanel}>
          <MenubarRadioItem value="terminal">Terminal</MenubarRadioItem>
          <MenubarRadioItem value="problems">Problems</MenubarRadioItem>
          <MenubarRadioItem value="output">Output</MenubarRadioItem>
        </MenubarRadioGroup>
      </MenubarMenu>
      <MenubarMenu label="Help">
        <MenubarLinkItem href="#editor">Documentation</MenubarLinkItem>
        <MenubarLinkItem href="#editor">Release notes</MenubarLinkItem>
      </MenubarMenu>
    </Menubar>
  );
}

const doc: ComponentDoc = {
  slug: "menubar",
  title: "Menubar",
  category: "Navigation",
  description:
    "A horizontal bar of menus, as in a desktop application: items, link items, checkbox and radio items, submenus, groups and shortcuts. The items are the Menu items.",
  imports: `import {
  Menubar, MenubarCheckboxItem, MenubarGroup, MenubarItem, MenubarLinkItem, MenubarMenu,
  MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarSubmenu,
} from "@/components/ui/menubar/menubar";`,
  baseUi: { name: "Menubar", href: "https://base-ui.com/react/components/menubar" },
  examples: examples(raw, [["Editor", Editor, { title: "Editor menubar", description: "Open a menu, then use ArrowLeft/ArrowRight to move between menus." }]]),
  props: [
    {
      component: "Menubar",
      note: "Also accepts Base UI Menubar props and native <div> props (aria-label, ref…).",
      rows: [
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout and arrow-key axis." },
        { name: "loopFocus", type: "boolean", default: "true", description: "Wrap focus from the last menu to the first." },
        { name: "modal", type: "boolean", default: "true", description: "Block page interaction while a menu is open." },
        { name: "disabled", type: "boolean", description: "Disable every menu." },
      ],
    },
    {
      component: "MenubarMenu",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Trigger text, e.g. File." },
        { name: "children", type: "ReactNode", required: true, description: "The items." },
        { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Popup alignment against the trigger." },
        { name: "sideOffset", type: "number", default: "6", description: "Gap from the trigger in px." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        { name: "disabled", type: "boolean", description: "Disable this menu." },
        { name: "className / triggerClassName", type: "string", description: "Classes for the popup / trigger." },
      ],
    },
    {
      component: "MenubarItem, MenubarLinkItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarSubmenu, MenubarGroup, MenubarSeparator",
      note: "The Menu items under Menubar names; see the Context menu page for their props (icon, shortcut, tone, checked, value, label…).",
      rows: [],
    },
  ],
  a11y: [
    'role="menubar" with menuitem triggers (aria-haspopup, aria-expanded). Name it with aria-label when the page has more than one.',
    "ArrowLeft/ArrowRight move between menus; ArrowDown, Enter or Space opens one; once a menu is open, moving to a neighbour opens that one.",
    "Inside a menu: arrow keys, typeahead, ArrowRight/ArrowLeft for submenus, Escape closes and returns focus to the trigger.",
    "Checkbox and radio items expose aria-checked; shortcut hints are visual only.",
  ],
};

export default doc;
