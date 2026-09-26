"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Check, ChevronsUpDown, Circle } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useId } from "react";
import { Shimmer } from "@/registry/bitop/ui/shimmer/shimmer";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./plan.module.css";

/*
 * Plan: a card with the agent's proposed steps, which can stream in and be
 * collapsed (Base UI Collapsible). While `streaming`, the title and
 * description shimmer and the card is aria-busy.
 *
 *   <Plan streaming={isStreaming} defaultOpen>
 *     <PlanHeader title="Migrate the billing service" description="4 steps" />
 *     <PlanContent>
 *       <PlanStep status="complete">Snapshot the database</PlanStep>
 *       <PlanStep status="active">Run the migration</PlanStep>
 *     </PlanContent>
 *     <PlanFooter><Button>Approve plan</Button></PlanFooter>
 *   </Plan>
 */

type PlanContextValue = { streaming: boolean; titleId: string };
const PlanContext = createContext<PlanContextValue>({ streaming: false, titleId: "" });

export type PlanStepStatus = "complete" | "active" | "pending";

export type PlanProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  streaming?: boolean;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function Plan({ streaming = false, className, onOpenChange, defaultOpen = true, ...props }: PlanProps) {
  const titleId = useId();
  return (
    <PlanContext.Provider value={{ streaming, titleId }}>
      <Collapsible.Root
        {...props}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
        render={<section aria-labelledby={titleId} aria-busy={streaming || undefined} />}
        className={cx(styles.root, className)}
        data-streaming={streaming ? "" : undefined}
      />
    </PlanContext.Provider>
  );
}

export type PlanHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Extra header actions, before the collapse toggle. */
  actions?: ReactNode;
  /** Accessible name of the collapse toggle. */
  toggleLabel?: string;
  className?: string;
};

export function PlanHeader({ title, description, actions, toggleLabel = "Show steps", className }: PlanHeaderProps) {
  const { streaming, titleId } = useContext(PlanContext);
  return (
    <div className={cx(styles.header, className)}>
      <div className={styles.headings}>
        <p id={titleId} className={styles.title}>
          {streaming ? <Shimmer>{title}</Shimmer> : title}
        </p>
        {description && <p className={styles.description}>{streaming ? <Shimmer>{description}</Shimmer> : description}</p>}
      </div>
      <div className={styles.actions}>
        {actions}
        <Collapsible.Trigger className={styles.toggle} aria-label={toggleLabel}>
          <ChevronsUpDown aria-hidden />
        </Collapsible.Trigger>
      </div>
    </div>
  );
}

export type PlanContentProps = { className?: string; children: ReactNode; label?: string };

export function PlanContent({ className, children, label = "Steps" }: PlanContentProps) {
  return (
    <Collapsible.Panel className={cx(styles.panel, className)}>
      <ol aria-label={label} className={styles.steps}>
        {children}
      </ol>
    </Collapsible.Panel>
  );
}

const stepStatusText: Record<PlanStepStatus, string> = { complete: "done", active: "in progress", pending: "to do" };

export type PlanStepProps = ComponentPropsWithRef<"li"> & { status?: PlanStepStatus };

export function PlanStep({ status = "pending", className, children, ...props }: PlanStepProps) {
  return (
    <li {...props} data-status={status} aria-current={status === "active" ? "step" : undefined} className={cx(styles.step, className)}>
      <span aria-hidden className={styles.marker}>
        {status === "complete" ? <Check /> : <Circle />}
      </span>
      <span className={styles.stepText}>
        {children}
        {" "}
        <span className="sr-only">({stepStatusText[status]})</span>
      </span>
    </li>
  );
}

export function PlanFooter({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.footer, className)} />;
}
