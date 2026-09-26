"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, FileText, Search } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Loader } from "@/registry/bitop/ui/loader/loader";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./task.module.css";

/*
 * Task: a collapsible unit of agent work with the items it touched
 * ("Searching the policy library" → files found, pages read). Base UI
 * Collapsible; items are a plain list.
 *
 *   <Task defaultOpen>
 *     <TaskTrigger title="Searched 3 folders" />
 *     <TaskContent>
 *       <TaskItem>Read <TaskItemFile>refunds.md</TaskItemFile></TaskItem>
 *     </TaskContent>
 *   </Task>
 */

export type TaskProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function Task({ className, onOpenChange, ...props }: TaskProps) {
  return <Collapsible.Root {...props} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined} className={cx(styles.root, className)} />;
}

export type TaskTriggerProps = {
  title: ReactNode;
  /** Shows a loader and "(in progress)" for assistive technology. */
  running?: boolean;
  icon?: ReactNode;
  className?: string;
};

export function TaskTrigger({ title, running = false, icon, className }: TaskTriggerProps) {
  return (
    <Collapsible.Trigger className={cx(styles.trigger, className)}>
      <span aria-hidden className={styles.icon}>
        {icon ?? <Search />}
      </span>
      <span className={styles.title}>
        {title}
        {running && " "}
        {running && <span className="sr-only">(in progress)</span>}
      </span>
      {running && <Loader size="sm" />}
      <ChevronDown aria-hidden className={styles.chevron} />
    </Collapsible.Trigger>
  );
}

export type TaskContentProps = { className?: string; children: ReactNode };

export function TaskContent({ className, children }: TaskContentProps) {
  return (
    <Collapsible.Panel className={cx(styles.panel, className)}>
      <ul className={styles.items}>{children}</ul>
    </Collapsible.Panel>
  );
}

export function TaskItem({ className, ...props }: ComponentPropsWithRef<"li">) {
  return <li {...props} className={cx(styles.item, className)} />;
}

export type TaskItemFileProps = ComponentPropsWithRef<"span"> & { icon?: ReactNode };

/** An inline file chip inside a TaskItem. */
export function TaskItemFile({ icon, className, children, ...props }: TaskItemFileProps) {
  return (
    <span {...props} className={cx(styles.file, className)}>
      <span aria-hidden className={styles.fileIcon}>
        {icon ?? <FileText />}
      </span>
      {children}
    </span>
  );
}
