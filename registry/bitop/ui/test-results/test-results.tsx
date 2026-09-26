"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { Meter } from "@base-ui/react/meter";
import { ChevronRight, CircleCheck, CircleMinus, CircleX, LoaderCircle } from "lucide-react";
import { type ComponentPropsWithRef, type CSSProperties, type ReactNode, createContext, useContext, useMemo } from "react";
import { Badge } from "@/registry/bitop/ui/badge/badge";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./test-results.module.css";

/*
 * TestResults: a test run: summary counts, duration and a pass-rate bar
 * (Base UI Meter), then suites (Base UI Collapsible) of tests whose error
 * details fold open.
 *
 *   <TestResults summary={{ passed: 18, failed: 1, skipped: 1, total: 20, duration: 4210 }}>
 *     <TestResultsHeader><TestResultsSummary /><TestResultsDuration /></TestResultsHeader>
 *     <TestResultsProgress />
 *     <TestResultsContent>
 *       <TestSuite name="auth.test.ts" status="failed" defaultOpen>
 *         <TestSuiteName><TestSuiteStats passed={3} failed={1} /></TestSuiteName>
 *         <TestSuiteContent>
 *           <Test name="refreshes the token" status="passed" duration={12} />
 *           <Test name="rejects expired tokens" status="failed" duration={40}>
 *             <TestError><TestErrorMessage>Expected 401, got 200</TestErrorMessage></TestError>
 *           </Test>
 *         </TestSuiteContent>
 *       </TestSuite>
 *     </TestResultsContent>
 *   </TestResults>
 *
 * Statuses use distinct icon shapes plus hidden text ("Failed:"), and counts
 * are written out ("1 failed"), so nothing relies on colour.
 */

export type TestStatus = "passed" | "failed" | "skipped" | "running";

export type TestRunSummary = {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  /** Milliseconds. */
  duration?: number;
};

/** 12 → "12ms", 4210 → "4.21s", 65000 → "1m 5s". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2).replace(/\.?0+$/, "")}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return seconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
}

const statusLabel: Record<TestStatus, string> = { passed: "Passed", failed: "Failed", skipped: "Skipped", running: "Running" };

const statusIcon: Record<TestStatus, ReactNode> = {
  passed: <CircleCheck aria-hidden />,
  failed: <CircleX aria-hidden />,
  skipped: <CircleMinus aria-hidden />,
  running: <LoaderCircle aria-hidden />,
};

export type TestStatusIconProps = Omit<ComponentPropsWithRef<"span">, "children"> & {
  status: TestStatus;
  /** Hide the "Passed:" text for assistive tech (when it's said elsewhere). */
  decorative?: boolean;
};

/** A status icon with hidden status text. The running icon spins unless reduced motion is set. */
export function TestStatusIcon({ status, decorative = false, className, ...props }: TestStatusIconProps) {
  return (
    <span {...props} className={cx(styles.statusIcon, className)} data-status={status}>
      {statusIcon[status]}
      {!decorative && <span className="sr-only">{statusLabel[status]}:</span>}
    </span>
  );
}

const TestResultsContext = createContext<{ summary?: TestRunSummary }>({});

export type TestResultsProps = ComponentPropsWithRef<"div"> & {
  summary?: TestRunSummary;
};

/** The run container. Without children it renders the summary header and progress bar. */
export function TestResults({ summary, className, children, ...props }: TestResultsProps) {
  const ctx = useMemo(() => ({ summary }), [summary]);
  return (
    <TestResultsContext.Provider value={ctx}>
      <div {...props} className={cx(styles.root, className)}>
        {children ??
          (summary && (
            <>
              <TestResultsHeader>
                <TestResultsSummary />
                <TestResultsDuration />
              </TestResultsHeader>
              <TestResultsProgress />
            </>
          ))}
      </div>
    </TestResultsContext.Provider>
  );
}

export function TestResultsHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

/** "18 passed · 1 failed · 1 skipped" badges (zero counts other than passed are omitted). */
export function TestResultsSummary({ className, children, ...props }: ComponentPropsWithRef<"div">) {
  const { summary } = useContext(TestResultsContext);
  if (!summary && !children) return null;
  return (
    <div {...props} className={cx(styles.summary, className)}>
      {children ??
        (summary && (
          <>
            <Badge tone="success" className={styles.summaryBadge}>
              <CircleCheck aria-hidden />
              {summary.passed} passed
            </Badge>
            {summary.failed > 0 && (
              <Badge tone="danger" className={styles.summaryBadge}>
                <CircleX aria-hidden />
                {summary.failed} failed
              </Badge>
            )}
            {summary.skipped > 0 && (
              <Badge tone="warning" className={styles.summaryBadge}>
                <CircleMinus aria-hidden />
                {summary.skipped} skipped
              </Badge>
            )}
          </>
        ))}
    </div>
  );
}

export function TestResultsDuration({ className, children, ...props }: ComponentPropsWithRef<"span">) {
  const { summary } = useContext(TestResultsContext);
  if (children === undefined && summary?.duration === undefined) return null;
  return (
    <span {...props} className={cx(styles.duration, className)}>
      {children ?? (
        <>
          <span className="sr-only">Duration: </span>
          {formatDuration(summary!.duration!)}
        </>
      )}
    </span>
  );
}

export type TestResultsProgressProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** Meter label (default "Tests passed"). */
  label?: string;
};

/** Pass rate as a Base UI Meter; failed and skipped share the bar as extra segments. */
export function TestResultsProgress({ label = "Tests passed", className, style, ...props }: TestResultsProgressProps) {
  const { summary } = useContext(TestResultsContext);
  if (!summary) return null;
  const total = Math.max(summary.total, 0);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  const percent = Math.round(pct(summary.passed));
  return (
    <div
      {...props}
      className={cx(styles.progress, className)}
      style={{ "--failed": `${pct(summary.failed)}%`, "--skipped": `${pct(summary.skipped)}%`, ...style } as CSSProperties}
    >
      <Meter.Root
        value={summary.passed}
        max={total || 1}
        getAriaValueText={() => `${summary.passed} of ${total} (${percent}%)`}
        className={styles.meter}
      >
        <Meter.Track className={styles.track}>
          <Meter.Indicator className={styles.passedSegment} />
          <span aria-hidden className={styles.failedSegment} />
          <span aria-hidden className={styles.skippedSegment} />
        </Meter.Track>
        <div className={styles.progressText}>
          <Meter.Label className={styles.progressLabel}>
            {summary.passed}/{total} {label.toLowerCase()}
          </Meter.Label>
          <span aria-hidden>{percent}%</span>
        </div>
      </Meter.Root>
    </div>
  );
}

export function TestResultsContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.content, className)} />;
}

const TestSuiteContext = createContext<{ name: string; status: TestStatus }>({ name: "", status: "passed" });

export type TestSuiteProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  name: string;
  status: TestStatus;
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function TestSuite({ name, status, className, onOpenChange, ...props }: TestSuiteProps) {
  const ctx = useMemo(() => ({ name, status }), [name, status]);
  return (
    <TestSuiteContext.Provider value={ctx}>
      <Collapsible.Root
        {...props}
        onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
        className={cx(styles.suite, className)}
        data-status={status}
      />
    </TestSuiteContext.Provider>
  );
}

export type TestSuiteNameProps = Omit<Collapsible.Trigger.Props, "className"> & {
  className?: string;
  /** Extra content after the name, e.g. <TestSuiteStats />. */
  children?: ReactNode;
};

/** The suite's trigger: chevron, status, name and any children (stats). */
export function TestSuiteName({ className, children, ...props }: TestSuiteNameProps) {
  const { name, status } = useContext(TestSuiteContext);
  return (
    <Collapsible.Trigger {...props} className={cx(styles.suiteTrigger, className)}>
      <ChevronRight aria-hidden className={styles.chevron} />
      <TestStatusIcon status={status} />{" "}
      <span className={styles.suiteName}>{name}</span>
      {children && <> {children}</>}
    </Collapsible.Trigger>
  );
}

export type TestSuiteStatsProps = ComponentPropsWithRef<"span"> & {
  passed?: number;
  failed?: number;
  skipped?: number;
};

/** "3 passed, 1 failed" (zero counts omitted). */
export function TestSuiteStats({ passed = 0, failed = 0, skipped = 0, className, children, ...props }: TestSuiteStatsProps) {
  const parts: [string, number, string][] = [
    ["passed", passed, styles.statPassed!],
    ["failed", failed, styles.statFailed!],
    ["skipped", skipped, styles.statSkipped!],
  ];
  return (
    <span {...props} className={cx(styles.stats, className)}>
      {children ??
        parts
          .filter(([, n]) => n > 0)
          .map(([label, n, cls], i) => (
            <span key={label} className={cls}>
              {i > 0 && <span className="sr-only">, </span>}
              {n} {label}
            </span>
          ))}
    </span>
  );
}

export type TestSuiteContentProps = Omit<Collapsible.Panel.Props, "className"> & { className?: string };

export function TestSuiteContent({ className, children, ...props }: TestSuiteContentProps) {
  const { name } = useContext(TestSuiteContext);
  return (
    <Collapsible.Panel {...props} className={cx(styles.panel, className)}>
      <ul aria-label={name} className={styles.tests}>
        {children}
      </ul>
    </Collapsible.Panel>
  );
}

export type TestProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  name: string;
  status: TestStatus;
  /** Milliseconds. */
  duration?: number;
  /** Error details (TestError); makes the row a disclosure. */
  children?: ReactNode;
  /** Start with the details open (default: open when the test failed). */
  defaultOpen?: boolean;
};

/** One test. With children, the row toggles the details below it. */
export function Test({ name, status, duration, children, defaultOpen, className, ...props }: TestProps) {
  const row = (
    <>
      <TestStatusIcon status={status} />{" "}
      <span className={styles.testName}>{name}</span>{" "}
      {duration !== undefined && <span className={styles.testDuration}>{formatDuration(duration)}</span>}
    </>
  );
  if (!children) {
    return (
      <li {...props} className={cx(styles.test, className)} data-status={status}>
        <span className={styles.testRow}>
          <span aria-hidden className={styles.spacer} />
          {row}
        </span>
      </li>
    );
  }
  return (
    <Collapsible.Root
      defaultOpen={defaultOpen ?? status === "failed"}
      render={<li {...props} data-status={status} />}
      className={cx(styles.test, className)}
    >
      <Collapsible.Trigger className={cx(styles.testRow, styles.testTrigger)}>
        <ChevronRight aria-hidden className={styles.chevron} />
        {row}
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.panel}>
        <div className={styles.testDetails}>{children}</div>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export function TestError({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.error, className)} />;
}

export function TestErrorMessage({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={cx(styles.errorMessage, className)} />;
}

/** The error's stack or diff; scrolls sideways, so it's keyboard-focusable. */
export function TestErrorStack({ className, ...props }: ComponentPropsWithRef<"pre">) {
  return <pre tabIndex={0} {...props} className={cx(styles.errorStack, className)} />;
}
