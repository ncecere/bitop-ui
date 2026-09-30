import { FileClock, Pencil, Settings, Share2, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSubmenu,
} from "@/registry/bitop/ui/menu/menu";
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

export function ViewOptions() {
  const [columns, setColumns] = useState({ status: true, branch: true, author: false });
  const [density, setDensity] = useState("comfortable");
  return (
    <Menu trigger={<Button variant="secondary">View</Button>}>
      <MenuGroup label="Columns">
        <MenuCheckboxItem checked={columns.status} onCheckedChange={(c) => setColumns((s) => ({ ...s, status: c }))}>
          Status
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={columns.branch} onCheckedChange={(c) => setColumns((s) => ({ ...s, branch: c }))}>
          Branch
        </MenuCheckboxItem>
        <MenuCheckboxItem checked={columns.author} onCheckedChange={(c) => setColumns((s) => ({ ...s, author: c }))}>
          Author
        </MenuCheckboxItem>
      </MenuGroup>
      <MenuSeparator />
      <MenuRadioGroup label="Density" value={density} onValueChange={setDensity}>
        <MenuRadioItem value="comfortable">Comfortable</MenuRadioItem>
        <MenuRadioItem value="compact">Compact</MenuRadioItem>
      </MenuRadioGroup>
      <MenuSeparator />
      <MenuSubmenu label="More options" icon={<SlidersHorizontal aria-hidden />}>
        <MenuItem>Reset columns</MenuItem>
        <MenuItem>Export as CSV</MenuItem>
      </MenuSubmenu>
    </Menu>
  );
}

const doc: ComponentDoc = {
  slug: "menu",
  title: "Menu",
  category: "Overlays",
  description:
    "A dropdown menu of actions and links, with checkbox and radio items, submenus, groups, separators, shortcuts, a danger tone and a non-interactive header.",
  imports: `import {
  Menu, MenuCheckboxItem, MenuGroup, MenuHeader, MenuItem, MenuLinkItem,
  MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuSubmenu,
} from "@/components/ui/menu/menu";`,
  baseUi: { name: "Menu", href: "https://base-ui.com/react/components/menu" },
  examples: examples(raw, [
    ["Actions", Actions, { title: "Actions menu" }],
    ["ViewOptions", ViewOptions, { title: "Checkbox, radio and submenu items" }],
  ]),
  props: [
    {
      component: "Menu",
      rows: [
        { name: "trigger", type: "ReactElement", required: true, description: "Usually a Button or IconButton." },
        { name: "side / align", type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end"', default: '"bottom" / "start"', description: "Placement." },
        { name: "sideOffset", type: "number", default: "6", description: "Gap from the trigger in px." },
        { name: "width", type: '"auto" | "trigger"', default: '"auto"', description: "Match the trigger width." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        {
          name: "container",
          type: "HTMLElement | null",
          default: "the trigger's landmark",
          description: "Where the popup is portalled. By default, the outermost landmark around the trigger (main, nav, aside…); outside any landmark, or in a dialog, <body>. null means <body>.",
        },
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
    {
      component: "MenuCheckboxItem",
      note: "Also accepts Base UI Menu.CheckboxItem props (closeOnClick, disabled…). The menu stays open on click.",
      rows: [
        { name: "checked / defaultChecked / onCheckedChange", type: "boolean / boolean / (checked) => void", description: "Controlled or uncontrolled." },
        { name: "shortcut", type: "ReactNode", description: "Visual shortcut hint." },
      ],
    },
    {
      component: "MenuRadioGroup / MenuRadioItem",
      rows: [
        { name: "label", type: "ReactNode", description: "Group label; names the group." },
        { name: "value / defaultValue / onValueChange", type: "any / any / (value) => void", description: "On the group." },
        { name: "value", type: "any", required: true, description: "On each item." },
      ],
    },
    {
      component: "MenuSubmenu",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Text of the item that opens the submenu." },
        { name: "icon", type: "ReactNode", description: "Decorative leading icon." },
        { name: "textValue", type: "string", description: "Typeahead text when label isn't a string." },
        { name: "open / defaultOpen / onOpenChange / disabled", type: "boolean / boolean / (open) => void / boolean", description: "Submenu state." },
      ],
    },
    { component: "MenuGroup", rows: [{ name: "label", type: "ReactNode", description: "Group label." }] },
  ],
  a11y: [
    'The trigger gets aria-haspopup="menu" and aria-expanded.',
    "Arrow keys move between items, typeahead jumps to matches, Escape closes and focus returns to the trigger.",
    "Checkbox and radio items are menuitemcheckbox / menuitemradio with aria-checked, so state isn't conveyed by the mark alone.",
    "Submenu triggers open with ArrowRight, Enter or Space (and on hover); ArrowLeft closes them.",
    "Shortcut hints are visual only; wire real shortcuts separately.",
    "The popup is portalled into the landmark its trigger is in (useLandmarkContainer in bitop-utils), so it is part of the page's landmarks (WAI landmark guidance; axe's region rule) rather than stray content at the end of <body>. It is positioned fixed there, so a landmark that scrolls or clips doesn't clip it.",
  ],
};

export default doc;
