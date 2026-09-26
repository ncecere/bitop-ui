import { FileClock, Pencil, Settings, Share2, Trash2 } from "lucide-react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Menu, MenuGroup, MenuItem, MenuLinkItem, MenuSeparator } from "@/registry/bitop/ui/menu/menu";
import { type ComponentDoc, examples } from "../types";
import raw from "./menu.tsx?raw";

export function Actions() {
  return (
    <Menu trigger={<Button variant="secondary">Actions</Button>}>
      <MenuGroup label="Project">
        <MenuItem icon={<Pencil aria-hidden />} shortcut="R">
          Rename
        </MenuItem>
        <MenuItem icon={<Share2 aria-hidden />}>Share</MenuItem>
        <MenuLinkItem href="#actions" icon={<FileClock aria-hidden />}>
          View audit log
        </MenuLinkItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuItem disabled icon={<Settings aria-hidden />}>
        Settings (no access)
      </MenuItem>
      <MenuItem tone="danger" icon={<Trash2 aria-hidden />} shortcut="⌫">
        Delete
      </MenuItem>
    </Menu>
  );
}

const doc: ComponentDoc = {
  slug: "menu",
  title: "Menu",
  category: "Overlays",
  description: "A dropdown menu of actions and links, with groups, separators, shortcuts, a danger tone and a non-interactive header.",
  imports: `import { Menu, MenuGroup, MenuHeader, MenuItem, MenuLinkItem, MenuSeparator } from "@/components/ui/menu/menu";`,
  baseUi: { name: "Menu", href: "https://base-ui.com/react/components/menu" },
  examples: examples(raw, [["Actions", Actions, { title: "Actions menu" }]]),
  props: [
    {
      component: "Menu",
      rows: [
        { name: "trigger", type: "ReactElement", required: true, description: "Usually a Button or IconButton." },
        { name: "side / align", type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end"', default: '"bottom" / "start"', description: "Placement." },
        { name: "sideOffset", type: "number", default: "6", description: "Gap from the trigger in px." },
        { name: "width", type: '"auto" | "trigger"', default: '"auto"', description: "Match the trigger width." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
      ],
    },
    {
      component: "MenuItem / MenuLinkItem",
      note: "Also accept Base UI Menu.Item / Menu.LinkItem props (onClick, disabled, href, render…).",
      rows: [
        { name: "icon", type: "ReactNode", description: "Decorative leading icon." },
        { name: "shortcut", type: "ReactNode", description: "Visual shortcut hint (aria-hidden)." },
        { name: "tone", type: '"default" | "danger"', default: '"default"', description: "Danger for destructive items." },
      ],
    },
    { component: "MenuGroup", rows: [{ name: "label", type: "ReactNode", description: "Group label." }] },
  ],
  a11y: [
    'The trigger gets aria-haspopup="menu" and aria-expanded.',
    "Arrow keys move between items, typeahead jumps to matches, Escape closes and focus returns to the trigger.",
    "Shortcut hints are visual only; wire real shortcuts separately.",
  ],
};

export default doc;
