"use client";

import { ContextMenu as BaseContextMenu } from "@base-ui/react/context-menu";
import type { ReactElement, ReactNode } from "react";
import {
  MenuCheckboxItem,
  type MenuCheckboxItemProps,
  MenuGroup,
  type MenuGroupProps,
  MenuHeader,
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
import styles from "./context-menu.module.css";

/*
 * Context menu on Base UI ContextMenu: opens at the pointer on right-click
 * or long-press, with roving focus, typeahead, submenus and Escape to close.
 * The items are the bitop Menu items (Base UI shares them between Menu,
 * ContextMenu and Menubar), re-exported under ContextMenu* names so it looks
 * and behaves exactly like the dropdown Menu.
 *
 *   <ContextMenu trigger={<div className={styles.area}>Right-click here</div>}>
 *     <ContextMenuItem shortcut="⌘C" onClick={copy}>Copy</ContextMenuItem>
 *     <ContextMenuSubmenu label="Share">…</ContextMenuSubmenu>
 *     <ContextMenuSeparator />
 *     <ContextMenuItem tone="danger" onClick={remove}>Delete</ContextMenuItem>
 *   </ContextMenu>
 *
 * A context menu is an enhancement: always offer the same actions through a
 * visible control too (touch, keyboard and screen-reader users may never
 * open it).
 */

export type ContextMenuProps = {
  /**
   * The area that opens the menu on right-click or long-press. Rendered
   * through Base UI's `render`, so it must accept a ref and spread props.
   */
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Ignore right-clicks (the browser's own menu shows instead). */
  disabled?: boolean;
  /** Class for the popup. */
  className?: string;
};

export function ContextMenu({ trigger, children, open, defaultOpen, onOpenChange, disabled, className }: ContextMenuProps) {
  return (
    <BaseContextMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      disabled={disabled}
    >
      <BaseContextMenu.Trigger render={trigger} className={styles.trigger} />
      <BaseContextMenu.Portal>
        {/* Base UI anchors the popup at the pointer (start-aligned, just below-right). */}
        <BaseContextMenu.Positioner className={popup.positioner}>
          <BaseContextMenu.Popup className={cx(popup.popup, className)}>{children}</BaseContextMenu.Popup>
        </BaseContextMenu.Positioner>
      </BaseContextMenu.Portal>
    </BaseContextMenu.Root>
  );
}

export type ContextMenuItemProps = MenuItemProps;
/** An action. Accepts Base UI Menu.Item props plus `icon`, `shortcut` and `tone="danger"`. */
export const ContextMenuItem = MenuItem;

export type ContextMenuLinkItemProps = MenuLinkItemProps;
/** An item that navigates: pass `href`, or `render={<Link to=… />}` for router links. */
export const ContextMenuLinkItem = MenuLinkItem;

export type ContextMenuCheckboxItemProps = MenuCheckboxItemProps;
/** A toggle (role="menuitemcheckbox"). */
export const ContextMenuCheckboxItem = MenuCheckboxItem;

export type ContextMenuRadioGroupProps = MenuRadioGroupProps;
/** A labelled set of ContextMenuRadioItems. */
export const ContextMenuRadioGroup = MenuRadioGroup;

export type ContextMenuRadioItemProps = MenuRadioItemProps;
/** One option of a ContextMenuRadioGroup (role="menuitemradio"). */
export const ContextMenuRadioItem = MenuRadioItem;

export type ContextMenuSubmenuProps = MenuSubmenuProps;
/** A nested menu opened from an item. */
export const ContextMenuSubmenu = MenuSubmenu;

export type ContextMenuGroupProps = MenuGroupProps;
/** A labelled group of items. */
export const ContextMenuGroup = MenuGroup;

/** A hairline between groups of items. */
export const ContextMenuSeparator = MenuSeparator;

/** Non-interactive header content. */
export const ContextMenuHeader = MenuHeader;
