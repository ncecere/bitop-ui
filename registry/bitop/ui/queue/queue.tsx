"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { IconButton, type IconButtonProps } from "@/registry/bitop/ui/button/button";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./queue.module.css";

/*
 * Queue: messages waiting to be sent while the assistant is busy, or an
 * agent's to-do list, in a collapsible card (Base UI Collapsible).
 *
 *   <Queue defaultOpen>
 *     <QueueHeader title="Queued" count={2} />
 *     <QueueContent>
 *       <QueueItem actions={<QueueItemAction label="Remove" icon={<X aria-hidden />} onClick={…} />}>
 *         Also compare with last year
 *       </QueueItem>
 *       <QueueItem completed>Read the policy</QueueItem>
 *     </QueueContent>
 *   </Queue>
 *
 * Completed items are struck through and say "(done)" to assistive
 * technology; row actions stay reachable by keyboard.
 */

export type QueueProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function Queue({ className, onOpenChange, ...props }: QueueProps) {
  return <Collapsible.Root {...props} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined} className={cx(styles.root, className)} />;
}

export type QueueHeaderProps = { title: ReactNode; count?: number; className?: string };

export function QueueHeader({ title, count, className }: QueueHeaderProps) {
  return (
    <Collapsible.Trigger className={cx(styles.trigger, className)}>
      <ChevronDown aria-hidden className={styles.chevron} />
      <span className={styles.title}>{title}</span>{" "}
      {count !== undefined && (
        <span className={styles.count}>
          {count}
          {" "}
          <span className="sr-only">{count === 1 ? "item" : "items"}</span>
        </span>
      )}
    </Collapsible.Trigger>
  );
}

export type QueueContentProps = { className?: string; children: ReactNode; label?: string };

export function QueueContent({ className, children, label }: QueueContentProps) {
  return (
    <Collapsible.Panel className={cx(styles.panel, className)}>
      <ul aria-label={label} className={styles.list}>
        {children}
      </ul>
    </Collapsible.Panel>
  );
}

export type QueueItemProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  children: ReactNode;
  description?: ReactNode;
  completed?: boolean;
  /** Row actions (QueueItemAction), revealed on hover / focus. */
  actions?: ReactNode;
};

export function QueueItem({ children, description, completed = false, actions, className, ...props }: QueueItemProps) {
  return (
    <li {...props} data-completed={dataFlag(completed)} className={cx(styles.item, className)}>
      <span aria-hidden className={styles.marker}>
        {completed && <Check />}
      </span>
      <span className={styles.text}>
        <span className={styles.label}>
          {children}
          {completed && " "}
          {completed && <span className="sr-only">(done)</span>}
        </span>
        {description && <span className={styles.description}>{description}</span>}
      </span>
      {actions && <span className={styles.actions}>{actions}</span>}
    </li>
  );
}

export type QueueItemActionProps = IconButtonProps;

export function QueueItemAction({ label, size = "sm", ...props }: QueueItemActionProps) {
  return (
    <Tooltip content={label}>
      <IconButton {...props} size={size} label={label} />
    </Tooltip>
  );
}
