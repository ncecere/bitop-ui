"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Check, ChevronDown, Circle, ListTree } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Shimmer } from "@/registry/bitop/ui/shimmer/shimmer";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./chain-of-thought.module.css";

/*
 * ChainOfThought: an agent's visible steps ("Searched the handbook",
 * "Read 3 documents", "Drafting the answer") in a collapsible timeline
 * (Base UI Collapsible). Each step's status is spelled out for assistive
 * technology; the active step's label shimmers.
 *
 *   <ChainOfThought defaultOpen>
 *     <ChainOfThoughtHeader />
 *     <ChainOfThoughtContent>
 *       <ChainOfThoughtStep status="complete" label="Searched the handbook">
 *         <ChainOfThoughtSearchResults>
 *           <ChainOfThoughtSearchResult>handbook.pdf</ChainOfThoughtSearchResult>
 *         </ChainOfThoughtSearchResults>
 *       </ChainOfThoughtStep>
 *       <ChainOfThoughtStep status="active" label="Drafting the answer" />
 *     </ChainOfThoughtContent>
 *   </ChainOfThought>
 */

export type StepStatus = "complete" | "active" | "pending";

const statusText: Record<StepStatus, string> = { complete: "complete", active: "in progress", pending: "not started" };

export type ChainOfThoughtProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function ChainOfThought({ className, onOpenChange, ...props }: ChainOfThoughtProps) {
  return <Collapsible.Root {...props} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined} className={cx(styles.root, className)} />;
}

export type ChainOfThoughtHeaderProps = { children?: ReactNode; icon?: ReactNode; className?: string };

export function ChainOfThoughtHeader({ children = "Chain of thought", icon, className }: ChainOfThoughtHeaderProps) {
  return (
    <Collapsible.Trigger className={cx(styles.trigger, className)}>
      <span aria-hidden className={styles.triggerIcon}>
        {icon ?? <ListTree />}
      </span>
      <span>{children}</span>
      <ChevronDown aria-hidden className={styles.chevron} />
    </Collapsible.Trigger>
  );
}

export type ChainOfThoughtContentProps = { className?: string; children: ReactNode; label?: string };

export function ChainOfThoughtContent({ className, children, label = "Steps" }: ChainOfThoughtContentProps) {
  return (
    <Collapsible.Panel className={cx(styles.panel, className)}>
      <ol aria-label={label} className={styles.steps}>
        {children}
      </ol>
    </Collapsible.Panel>
  );
}

export type ChainOfThoughtStepProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  label: ReactNode;
  description?: ReactNode;
  status?: StepStatus;
  /** Decorative icon replacing the status marker. */
  icon?: ReactNode;
  children?: ReactNode;
};

export function ChainOfThoughtStep({ label, description, status = "complete", icon, className, children, ...props }: ChainOfThoughtStepProps) {
  return (
    <li {...props} data-status={status} aria-current={status === "active" ? "step" : undefined} className={cx(styles.step, className)}>
      <span aria-hidden className={styles.marker}>
        {icon ?? (status === "complete" ? <Check /> : <Circle />)}
      </span>
      <div className={styles.body}>
        <span className={styles.label}>
          {status === "active" ? <Shimmer>{label}</Shimmer> : label}
          {" "}
          <span className="sr-only">({statusText[status]})</span>
        </span>
        {description && <span className={styles.description}>{description}</span>}
        {children}
      </div>
    </li>
  );
}

export function ChainOfThoughtSearchResults({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.results, className)} />;
}

export function ChainOfThoughtSearchResult({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} className={cx(styles.result, className)} />;
}
