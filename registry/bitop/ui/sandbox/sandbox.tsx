"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, CircleAlert, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { CodeBlock, type CodeBlockProps } from "@/registry/bitop/ui/code-block/code-block";
import { Tab, Tabs, TabsList, TabsPanel, type TabProps, type TabsListProps, type TabsPanelProps, type TabsProps } from "@/registry/bitop/ui/tabs/tabs";
import { cx, type Tone } from "@/registry/bitop/lib/bitop-utils";
import styles from "./sandbox.module.css";

/*
 * Sandbox: a collapsible panel (Base UI Collapsible) for code the assistant
 * ran in an execution sandbox, with a status badge and Code / Output tabs
 * (bitop Tabs, CodeBlock).
 *
 *   <Sandbox>
 *     <SandboxHeader title="analyze.py" state="completed" />
 *     <SandboxContent>
 *       <SandboxTabs defaultValue="code">
 *         <SandboxTabsList>
 *           <SandboxTab value="code">Code</SandboxTab>
 *           <SandboxTab value="output">Output</SandboxTab>
 *         </SandboxTabsList>
 *         <SandboxTabPanel value="code"><SandboxCode code={code} language="python" /></SandboxTabPanel>
 *         <SandboxTabPanel value="output"><SandboxOutput output={stdout} /></SandboxTabPanel>
 *       </SandboxTabs>
 *     </SandboxContent>
 *   </Sandbox>
 *
 * The state is always written in the badge ("Running"), not colour only,
 * and is part of the header button's accessible name.
 */

export type SandboxState = "pending" | "running" | "completed" | "error";

const stateBadge: Record<SandboxState, { tone: Tone; label: string; pulse?: boolean }> = {
  pending: { tone: "neutral", label: "Pending" },
  running: { tone: "info", label: "Running", pulse: true },
  completed: { tone: "success", label: "Completed" },
  error: { tone: "danger", label: "Error" },
};

export type SandboxProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

/** Open by default; pass `defaultOpen={false}` or `open` to control it. */
export function Sandbox({ className, onOpenChange, defaultOpen = true, ...props }: SandboxProps) {
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen}
      {...props}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      className={cx(styles.root, className)}
    />
  );
}

export type SandboxHeaderProps = {
  /** e.g. the file name or "Python sandbox". */
  title: ReactNode;
  state: SandboxState;
  /** Override the badge text. */
  stateLabel?: string;
  /** Short text after the badge, e.g. "exit code 1" or "2.3 s". */
  summary?: ReactNode;
  /** Decorative icon (default: a terminal). */
  icon?: ReactNode;
  className?: string;
};

export function SandboxHeader({ title, state, stateLabel, summary, icon, className }: SandboxHeaderProps) {
  const badge = stateBadge[state];
  return (
    <Collapsible.Trigger className={cx(styles.trigger, className)} data-state={state}>
      <span aria-hidden className={styles.icon}>
        {icon ?? <SquareTerminal />}
      </span>
      <span className={styles.title}>{title}</span>{" "}
      <StatusBadge tone={badge.tone} pulse={badge.pulse} size="sm" className={styles.badge}>
        {stateLabel ?? badge.label}
      </StatusBadge>
      {summary && (
        <>
          {" "}
          <span className={styles.summary}>{summary}</span>
        </>
      )}
      <ChevronDown aria-hidden className={styles.chevron} />
    </Collapsible.Trigger>
  );
}

export type SandboxContentProps = { className?: string; children: ReactNode };

export function SandboxContent({ className, children }: SandboxContentProps) {
  return (
    <Collapsible.Panel className={cx(styles.panel, className)}>
      <div className={styles.content}>{children}</div>
    </Collapsible.Panel>
  );
}

export type SandboxTabsProps = TabsProps;

export function SandboxTabs({ className, ...props }: SandboxTabsProps) {
  return <Tabs {...props} className={cx(styles.tabs, className)} />;
}

export type SandboxTabsListProps = TabsListProps & {
  /** Extra controls on the right of the tab bar, e.g. a Run again button. */
  actions?: ReactNode;
};

export function SandboxTabsList({ className, actions, ...props }: SandboxTabsListProps) {
  return (
    <div className={styles.bar}>
      <TabsList {...props} className={cx(styles.list, className)} />
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}

export type SandboxTabProps = TabProps;

export function SandboxTab({ className, ...props }: SandboxTabProps) {
  return <Tab {...props} className={cx(styles.tab, className)} />;
}

export type SandboxTabPanelProps = TabsPanelProps;

export function SandboxTabPanel({ className, ...props }: SandboxTabPanelProps) {
  return <TabsPanel {...props} className={cx(styles.tabPanel, className)} />;
}

export type SandboxCodeProps = CodeBlockProps;

/** The executed source (a CodeBlock with a copy button). */
export function SandboxCode({ maxHeight = "24rem", ...props }: SandboxCodeProps) {
  return <CodeBlock {...props} maxHeight={maxHeight} />;
}

export type SandboxOutputProps = {
  /** stdout / result text. */
  output?: string;
  /** stderr or an error message; shown as an error. */
  errorText?: ReactNode;
  /** Shown when there is neither output nor error yet (default "No output"). */
  emptyText?: ReactNode;
  className?: string;
};

/** Program output as plain text, and/or an error. */
export function SandboxOutput({ output, errorText, emptyText = "No output", className }: SandboxOutputProps) {
  const hasOutput = output !== undefined && output !== "";
  return (
    <div className={cx(styles.output, className)}>
      {hasOutput && <CodeBlock code={output} language="text" filename="Output" maxHeight="24rem" />}
      {errorText && (
        <div className={styles.error}>
          <CircleAlert aria-hidden className={styles.errorIcon} />
          <div>
            <span className="sr-only">Error: </span>
            {errorText}
          </div>
        </div>
      )}
      {!hasOutput && !errorText && <p className={styles.empty}>{emptyText}</p>}
    </div>
  );
}
