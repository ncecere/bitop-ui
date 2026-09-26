"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import type { ReactNode } from "react";
import {
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
  MenuGroup,
  type MenuGroupProps,
  MenuItem,
  type MenuItemProps,
  MenuLinkItem,
  type MenuLinkItemProps,
  MenuRadioGroup,
  type MenuRadioGroupProps,
  MenuRadioItem,
  type MenuRadioItemProps,
  MenuSeparator,
  MenuSubmenu,
  type MenuSubmenuProps,
} from "@/registry/bitop/ui/menu/menu";
import popup from "@/registry/bitop/ui/styles/popup.module.css";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./menubar.module.css";

/*
 * Application-style menubar on Base UI Menubar + Menu (role="menubar").
 * ArrowLeft/ArrowRight move between the top-level menus, and once one menu
 * is open, moving to a sibling opens it too. The items are the bitop Menu
 * items, re-exported under Menubar* names.
 *
 *   <Menubar aria-label="Editor">
 *     <MenubarMenu label="File">
 *       <MenubarItem shortcut="⌘N" onClick={create}>New file</MenubarItem>
 *       <MenubarSubmenu label="Export">…</MenubarSubmenu>
 *     </MenubarMenu>
 *     <MenubarMenu label="View">
 *       <MenubarCheckboxItem checked={wrap} onCheckedChange={setWrap}>Word wrap</MenubarCheckboxItem>
 *     </MenubarMenu>
 *   </Menubar>
 */

export type MenubarProps = Omit<BaseMenubar.Props, "className"> & {
  className?: string;
};

export function Menubar({ className, ...props }: MenubarProps) {
  return <BaseMenubar {...props} className={cx(styles.menubar, className)} />;
}

export type MenubarMenuProps = {
  /** The top-level trigger's text, e.g. "File". */
  label: ReactNode;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Class for the menu popup. */
  className?: string;
  /** Class for the trigger button. */
  triggerClassName?: string;
};

/** One top-level menu of a Menubar: a trigger button and its popup. */
export function MenubarMenu({
  label,
  children,
  open,
  defaultOpen,
  onOpenChange,
  disabled,
  align = "start",
  sideOffset = 6,
  className,
  triggerClassName,
}: MenubarMenuProps) {
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      disabled={disabled}
    >
      <BaseMenu.Trigger className={cx(styles.trigger, triggerClassName)}>{label}</BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={popup.positioner} align={align} sideOffset={sideOffset} alignOffset={align === "start" ? -4 : 0}>
          <BaseMenu.Popup className={cx(popup.popup, className)}>{children}</BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

export type MenubarItemProps = MenuItemProps;
/** An action. Accepts Base UI Menu.Item props plus `icon`, `shortcut` and `tone="danger"`. */
export const MenubarItem = MenuItem;

export type MenubarLinkItemProps = MenuLinkItemProps;
/** An item that navigates: pass `href`, or `render={<Link to=… />}` for router links. */
export const MenubarLinkItem = MenuLinkItem;

export type MenubarCheckboxItemProps = MenuCheckboxItemProps;
/** A toggle (role="menuitemcheckbox"). */
export const MenubarCheckboxItem = MenuCheckboxItem;

export type MenubarRadioGroupProps = MenuRadioGroupProps;
/** A labelled set of MenubarRadioItems. */
export const MenubarRadioGroup = MenuRadioGroup;

export type MenubarRadioItemProps = MenuRadioItemProps;
/** One option of a MenubarRadioGroup (role="menuitemradio"). */
export const MenubarRadioItem = MenuRadioItem;

export type MenubarSubmenuProps = MenuSubmenuProps;
/** A nested menu opened from an item. */
export const MenubarSubmenu = MenuSubmenu;

export type MenubarGroupProps = MenuGroupProps;
/** A labelled group of items. */
export const MenubarGroup = MenuGroup;

/** A hairline between groups of items. */
export const MenubarSeparator = MenuSeparator;
