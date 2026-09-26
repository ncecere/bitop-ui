"use client";

import { Menu as BaseMenu } from "@base-ui/react/menu";
import type { ReactElement, ReactNode } from "react";
import popup from "@/registry/bitop/ui/styles/popup.module.css";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./menu.module.css";

/*
 * Dropdown menu on Base UI Menu: roving focus, typeahead, Escape to close,
 * focus returns to the trigger.
 *
 *   <Menu trigger={<Button variant="secondary">Actions</Button>}>
 *     <MenuItem icon={<Pencil aria-hidden />} onClick={rename}>Rename</MenuItem>
 *     <MenuLinkItem render={<Link to="/settings" />}>Settings</MenuLinkItem>
 *     <MenuSeparator />
 *     <MenuItem tone="danger" onClick={remove}>Delete</MenuItem>
 *   </Menu>
 */

export type MenuProps = {
  /** The trigger element, usually a Button or IconButton. */
  trigger: ReactElement;
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Popup width hint. */
  width?: "auto" | "trigger";
  className?: string;
};

export function Menu({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  width = "auto",
  className,
}: MenuProps) {
  return (
    <BaseMenu.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}>
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner className={popup.positioner} side={side} align={align} sideOffset={sideOffset}>
          <BaseMenu.Popup className={cx(popup.popup, className)} data-width={width}>
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

type ItemExtras = {
  icon?: ReactNode;
  /** A keyboard shortcut hint shown on the right (visual only). */
  shortcut?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
};

export type MenuItemProps = Omit<BaseMenu.Item.Props, "className"> & ItemExtras;

export function MenuItem({ icon, shortcut, tone = "default", className, children, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item {...props} className={cx(popup.item, tone === "danger" && popup.itemDanger, className)}>
      {icon}
      <span className={styles.label}>{children}</span>
      {shortcut && (
        <span aria-hidden className={popup.itemShortcut}>
          {shortcut}
        </span>
      )}
    </BaseMenu.Item>
  );
}

export type MenuLinkItemProps = Omit<BaseMenu.LinkItem.Props, "className"> & ItemExtras;

/** A menu item that navigates. Pass `href`, or `render={<Link to=… />}` for router links. */
export function MenuLinkItem({ icon, shortcut, tone = "default", className, children, ...props }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem {...props} className={cx(popup.item, tone === "danger" && popup.itemDanger, className)}>
      {icon}
      <span className={styles.label}>{children}</span>
      {shortcut && (
        <span aria-hidden className={popup.itemShortcut}>
          {shortcut}
        </span>
      )}
    </BaseMenu.LinkItem>
  );
}

export function MenuSeparator({ className }: { className?: string }) {
  return <BaseMenu.Separator className={cx(popup.separator, className)} />;
}

export type MenuGroupProps = { label?: ReactNode; children: ReactNode; className?: string };

export function MenuGroup({ label, children, className }: MenuGroupProps) {
  return (
    <BaseMenu.Group className={className}>
      {label && <BaseMenu.GroupLabel className={popup.groupLabel}>{label}</BaseMenu.GroupLabel>}
      {children}
    </BaseMenu.Group>
  );
}

/** Non-interactive header content (e.g. the signed-in user's name and email). */
export function MenuHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.header, className)}>{children}</div>;
}
