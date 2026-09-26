import { Copy, Download, FileText, Pencil, Share2, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLinkItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSubmenu,
} from "@/registry/bitop/ui/context-menu/context-menu";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import styles from "./overlay-examples.module.css";
import raw from "./context-menu.tsx?raw";

export function FileActions() {
  return (
    <ContextMenu
      trigger={
        <div className={styles.fileRow}>
          <FileText aria-hidden />
          quarterly-report.pdf
          <span className={styles.fileMeta}>2.4 MB</span>
        </div>
      }
    >
      <ContextMenuItem icon={<Pencil aria-hidden />} shortcut="F2" onClick={() => toast.add({ title: "Rename" })}>
        Rename
      </ContextMenuItem>
      <ContextMenuItem icon={<Copy aria-hidden />} shortcut="⌘D" onClick={() => toast.add({ title: "Duplicated" })}>
        Duplicate
      </ContextMenuItem>
      <ContextMenuLinkItem href="#file-actions" icon={<Download aria-hidden />}>
        Download
      </ContextMenuLinkItem>
      <ContextMenuSubmenu label="Share" icon={<Share2 aria-hidden />}>
        <ContextMenuItem onClick={() => toast.add({ title: "Link copied" })}>Copy link</ContextMenuItem>
        <ContextMenuItem>Email…</ContextMenuItem>
        <ContextMenuItem>Slack…</ContextMenuItem>
      </ContextMenuSubmenu>
      <ContextMenuSeparator />
      <ContextMenuItem tone="danger" icon={<Trash2 aria-hidden />} shortcut="⌫">
        Move to trash
      </ContextMenuItem>
    </ContextMenu>
  );
}

export function Options() {
  const [showHidden, setShowHidden] = useState(false);
  const [showExtensions, setShowExtensions] = useState(true);
  const [sort, setSort] = useState("name");
  return (
    <ContextMenu trigger={<div className={styles.area}>Right-click (or long-press) in this area</div>}>
      <ContextMenuGroup label="View">
        <ContextMenuCheckboxItem checked={showHidden} onCheckedChange={setShowHidden} shortcut="⌘⇧.">
          Show hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={showExtensions} onCheckedChange={setShowExtensions}>
          Show file extensions
        </ContextMenuCheckboxItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
        <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
        <ContextMenuRadioItem value="modified">Date modified</ContextMenuRadioItem>
        <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
      <ContextMenuSeparator />
      <ContextMenuItem disabled>Paste (clipboard is empty)</ContextMenuItem>
    </ContextMenu>
  );
}

const doc: ComponentDoc = {
  slug: "context-menu",
  title: "Context menu",
  category: "Overlays",
  description:
    "A menu that opens at the pointer on right-click or long-press, with the same items as Menu: link items, checkbox and radio items, submenus, groups, shortcuts and a danger tone.",
  imports: `import {
  ContextMenu, ContextMenuCheckboxItem, ContextMenuGroup, ContextMenuItem, ContextMenuLinkItem,
  ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuSubmenu,
} from "@/components/ui/context-menu/context-menu";`,
  baseUi: { name: "Context Menu", href: "https://base-ui.com/react/components/context-menu" },
  examples: examples(raw, [
    ["FileActions", FileActions, { title: "File actions", description: "Right-click the file row. Share opens a submenu." }],
    ["Options", Options, { title: "Checkbox and radio items" }],
  ]),
  props: [
    {
      component: "ContextMenu",
      rows: [
        { name: "trigger", type: "ReactElement", required: true, description: "The area that opens the menu; must accept a ref and spread props." },
        { name: "children", type: "ReactNode", required: true, description: "The items." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
        { name: "disabled", type: "boolean", description: "Let the browser's own context menu show instead." },
        { name: "className", type: "string", description: "Class for the popup." },
      ],
    },
    {
      component: "ContextMenuItem / ContextMenuLinkItem",
      note: "The Menu items under ContextMenu names. Also accept Base UI Menu.Item / Menu.LinkItem props (onClick, disabled, href, render, closeOnClick…).",
      rows: [
        { name: "icon", type: "ReactNode", description: "Decorative leading icon." },
        { name: "shortcut", type: "ReactNode", description: "Visual shortcut hint (aria-hidden)." },
        { name: "tone", type: '"default" | "danger"', default: '"default"', description: "Danger for destructive items." },
      ],
    },
    {
      component: "ContextMenuCheckboxItem",
      note: "Also accepts Base UI Menu.CheckboxItem props (closeOnClick, disabled…).",
      rows: [
        { name: "checked / defaultChecked / onCheckedChange", type: "boolean / boolean / (checked) => void", description: "Controlled or uncontrolled." },
        { name: "shortcut", type: "ReactNode", description: "Visual shortcut hint." },
      ],
    },
    {
      component: "ContextMenuRadioGroup / ContextMenuRadioItem",
      rows: [
        { name: "label", type: "ReactNode", description: "Group label; names the group." },
        { name: "value / defaultValue / onValueChange", type: "any / any / (value) => void", description: "On the group." },
        { name: "value", type: "any", required: true, description: "On each item." },
      ],
    },
    {
      component: "ContextMenuSubmenu",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Text of the item that opens the submenu." },
        { name: "icon", type: "ReactNode", description: "Decorative leading icon." },
        { name: "textValue", type: "string", description: "Typeahead text when label isn't a string." },
        { name: "disabled", type: "boolean", description: "Disable the submenu." },
      ],
    },
    { component: "ContextMenuGroup / ContextMenuSeparator / ContextMenuHeader", note: "Group with an optional label, a hairline, and non-interactive header content.", rows: [] },
  ],
  a11y: [
    'The popup is role="menu"; items are menuitem, menuitemcheckbox (aria-checked) or menuitemradio.',
    "Arrow keys move between items, typeahead jumps to matches, ArrowRight/ArrowLeft open and close submenus, Escape closes and restores focus.",
    "Checked state is exposed as aria-checked, not only by the check mark.",
    "A context menu is hidden by nature: always offer the same actions through a visible control (a Menu button, toolbar or keyboard shortcut).",
    "Shortcut hints are visual only; wire real shortcuts separately.",
  ],
};

export default doc;
