"use client";

import { NavigationMenu as BaseNavigationMenu } from "@base-ui/react/navigation-menu";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./navigation-menu.module.css";

/*
 * Site navigation on Base UI NavigationMenu: a <nav> with top-level links and
 * triggers that reveal content panels in one shared, animated popup. Panels
 * open on hover or click; ArrowDown opens the focused trigger's panel, Tab
 * moves into it, Escape closes it and returns focus to the trigger.
 *
 *   <NavigationMenu aria-label="Main">
 *     <NavigationMenuList>
 *       <NavigationMenuItem>
 *         <NavigationMenuTrigger>Products</NavigationMenuTrigger>
 *         <NavigationMenuContent>
 *           <NavigationMenuLink href="/deploy" description="Ship from git.">Deployments</NavigationMenuLink>
 *         </NavigationMenuContent>
 *       </NavigationMenuItem>
 *       <NavigationMenuItem>
 *         <NavigationMenuLink render={<Link to="/pricing" />} active={path === "/pricing"}>Pricing</NavigationMenuLink>
 *       </NavigationMenuItem>
 *     </NavigationMenuList>
 *   </NavigationMenu>
 *
 * Top-level links look like triggers; links inside a panel are list rows
 * with an optional description.
 */

export type NavigationMenuProps = Omit<BaseNavigationMenu.Root.Props, "className"> & {
  className?: string;
  /** Alignment of the popup against the active trigger. */
  align?: "start" | "center" | "end";
  /** Gap between the trigger and the popup in px. */
  sideOffset?: number;
};

/**
 * The root <nav>. Give it an `aria-label` (e.g. "Main") when the page has
 * more than one navigation landmark. Renders the shared popup/viewport.
 */
export function NavigationMenu({ className, align = "start", sideOffset = 8, children, ...props }: NavigationMenuProps) {
  return (
    <BaseNavigationMenu.Root {...props} className={cx(styles.root, className)}>
      {children}
      <BaseNavigationMenu.Portal>
        <BaseNavigationMenu.Positioner
          className={styles.positioner}
          side="bottom"
          align={align}
          sideOffset={sideOffset}
          collisionPadding={{ top: 5, bottom: 5, left: 16, right: 16 }}
          collisionAvoidance={{ side: "none" }}
        >
          <BaseNavigationMenu.Popup className={styles.popup}>
            <BaseNavigationMenu.Viewport className={styles.viewport} />
          </BaseNavigationMenu.Popup>
        </BaseNavigationMenu.Positioner>
      </BaseNavigationMenu.Portal>
    </BaseNavigationMenu.Root>
  );
}

export type NavigationMenuListProps = Omit<BaseNavigationMenu.List.Props, "className"> & { className?: string };

/** The list (<ul>) of top-level items. */
export function NavigationMenuList({ className, ...props }: NavigationMenuListProps) {
  return <BaseNavigationMenu.List {...props} className={cx(styles.list, className)} />;
}

export type NavigationMenuItemProps = Omit<BaseNavigationMenu.Item.Props, "className"> & { className?: string };

/** One top-level entry (<li>): a trigger with content, or a single link. */
export function NavigationMenuItem({ className, ...props }: NavigationMenuItemProps) {
  return <BaseNavigationMenu.Item {...props} className={cx(styles.item, className)} />;
}

export type NavigationMenuTriggerProps = Omit<BaseNavigationMenu.Trigger.Props, "className"> & { className?: string };

/** A button that reveals its item's NavigationMenuContent (aria-expanded). */
export function NavigationMenuTrigger({ className, children, ...props }: NavigationMenuTriggerProps) {
  return (
    <BaseNavigationMenu.Trigger {...props} className={cx(styles.trigger, className)}>
      {children}
      <BaseNavigationMenu.Icon className={styles.icon}>
        <ChevronDown aria-hidden />
      </BaseNavigationMenu.Icon>
    </BaseNavigationMenu.Trigger>
  );
}

export type NavigationMenuContentProps = Omit<BaseNavigationMenu.Content.Props, "className"> & {
  className?: string;
  /** Lay the panel's children out in a grid with this many columns (one column on narrow screens). */
  columns?: 1 | 2 | 3;
};

/** The panel shown in the popup while its item is active. */
export function NavigationMenuContent({ className, columns = 1, ...props }: NavigationMenuContentProps) {
  return <BaseNavigationMenu.Content {...props} className={cx(styles.content, className)} data-columns={columns} />;
}

export type NavigationMenuLinkProps = Omit<BaseNavigationMenu.Link.Props, "className"> & {
  className?: string;
  /** Supporting text under the title (panel links only). */
  description?: ReactNode;
  /** Decorative leading icon (panel links only). */
  icon?: ReactNode;
};

/**
 * A link. Pass `href`, or `render={<Link to=… />}` for client-side routing.
 * `active` marks the current page (aria-current="page"). Inside
 * NavigationMenuContent it renders as a list item; at the top level it looks
 * like a trigger.
 */
export function NavigationMenuLink({ className, description, icon, children, ...props }: NavigationMenuLinkProps) {
  return (
    <BaseNavigationMenu.Link {...props} className={cx(styles.link, className)}>
      {description !== undefined || icon !== undefined ? (
        <>
          {icon && <span className={styles.linkIcon}>{icon}</span>}
          <span className={styles.linkText}>
            <span className={styles.linkTitle}>{children}</span>
            {description !== undefined && <span className={styles.linkDescription}>{description}</span>}
          </span>
        </>
      ) : (
        children
      )}
    </BaseNavigationMenu.Link>
  );
}
