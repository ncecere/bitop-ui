"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown, FileText, GitCommitHorizontal } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Avatar, type AvatarProps } from "@/registry/bitop/ui/avatar/avatar";
import { CopyButton, type CopyButtonProps } from "@/registry/bitop/ui/copy-button/copy-button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./commit.module.css";

/*
 * Commit: a commit summary (message, author, time, hash with a copy button)
 * with a collapsible list of changed files (Base UI Collapsible).
 *
 *   <Commit>
 *     <CommitHeader>
 *       <CommitAuthorAvatar name="Ada Lovelace" />
 *       <CommitInfo>
 *         <CommitMessage>Fix token refresh race</CommitMessage>
 *         <CommitMetadata>
 *           <CommitAuthor>Ada Lovelace</CommitAuthor>
 *           <CommitSeparator />
 *           <CommitTimestamp date={date} />
 *         </CommitMetadata>
 *       </CommitInfo>
 *       <CommitActions>
 *         <CommitHash hash={sha} />
 *         <CommitCopyButton hash={sha} />
 *       </CommitActions>
 *     </CommitHeader>
 *     <CommitTrigger fileCount={2} additions={14} deletions={3} />
 *     <CommitContent>
 *       <CommitFiles>
 *         <CommitFile path="src/auth.ts" status="modified" additions={12} deletions={3} />
 *         <CommitFile path="src/auth.test.ts" status="added" additions={2} />
 *       </CommitFiles>
 *     </CommitContent>
 *   </Commit>
 *
 * File status is a letter (A / M / D / R) plus hidden text ("Modified"), and
 * line counts carry +/− signs, so nothing depends on colour alone.
 */

export type CommitFileStatus = "added" | "modified" | "deleted" | "renamed";

export type CommitProps = Omit<Collapsible.Root.Props, "className" | "onOpenChange"> & {
  className?: string;
  onOpenChange?: (open: boolean) => void;
};

export function Commit({ className, onOpenChange, ...props }: CommitProps) {
  return <Collapsible.Root {...props} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined} className={cx(styles.root, className)} />;
}

export function CommitHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type CommitAuthorAvatarProps = Omit<AvatarProps, "size"> & { size?: AvatarProps["size"] };

/** The author's avatar. Pass `decorative` when the name is shown next to it. */
export function CommitAuthorAvatar({ size = "sm", className, ...props }: CommitAuthorAvatarProps) {
  return <Avatar {...props} size={size} className={cx(styles.avatar, className)} />;
}

export function CommitInfo({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.info, className)} />;
}

export type CommitMessageProps = ComponentPropsWithRef<"p">;

/** The commit subject line. */
export function CommitMessage({ className, ...props }: CommitMessageProps) {
  return <p {...props} className={cx(styles.message, className)} />;
}

export function CommitMetadata({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.metadata, className)} />;
}

export function CommitAuthor({ className, ...props }: ComponentPropsWithRef<"span">) {
  return <span {...props} className={cx(styles.author, className)} />;
}

/** A decorative "•" between metadata items. */
export function CommitSeparator({ className, children, ...props }: ComponentPropsWithRef<"span">) {
  return (
    <span aria-hidden {...props} className={cx(styles.separator, className)}>
      {children ?? "•"}
    </span>
  );
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/** "3 hours ago", "yesterday", "in 2 days". */
export function formatRelativeTime(date: Date, now: Date = new Date(), locale?: string): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size || unit === "second") return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

export type CommitTimestampProps = Omit<ComponentPropsWithRef<"time">, "dateTime"> & {
  date: Date;
  /** Reference time for the relative label (default: now). */
  now?: Date;
  locale?: string;
};

/** A <time> with a relative label ("2 days ago") and the full date as a tooltip. */
export function CommitTimestamp({ date, now, locale, className, children, title, ...props }: CommitTimestampProps) {
  return (
    <time
      {...props}
      dateTime={date.toISOString()}
      title={title ?? date.toLocaleString(locale)}
      suppressHydrationWarning
      className={cx(styles.timestamp, className)}
    >
      {children ?? formatRelativeTime(date, now, locale)}
    </time>
  );
}

export function CommitActions({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.actions, className)} />;
}

export type CommitHashProps = Omit<ComponentPropsWithRef<"code">, "children"> & {
  hash: string;
  /** Characters to show (default 7); the full hash is in the title. */
  length?: number;
};

/** The short hash in monospace, with the full hash for assistive tech. */
export function CommitHash({ hash, length = 7, className, ...props }: CommitHashProps) {
  const short = hash.slice(0, length);
  return (
    <code {...props} title={hash} className={cx(styles.hash, className)}>
      <GitCommitHorizontal aria-hidden className={styles.hashIcon} />
      <span className="sr-only">Commit </span>
      {short}
    </code>
  );
}

export type CommitCopyButtonProps = Omit<CopyButtonProps, "value"> & { hash: string };

/** Copies the full hash ("Copy commit hash"). */
export function CommitCopyButton({ hash, label = "commit hash", ...props }: CommitCopyButtonProps) {
  return <CopyButton {...props} value={hash} label={label} />;
}

export type CommitTriggerProps = Omit<Collapsible.Trigger.Props, "className" | "children"> & {
  className?: string;
  /** Number of changed files, for the default label "3 files changed". */
  fileCount?: number;
  /** Total added lines, shown as "+14". */
  additions?: number;
  /** Total removed lines, shown as "−3". */
  deletions?: number;
  /** Replaces the default label. */
  children?: ReactNode;
};

/** Shows / hides the file list. */
export function CommitTrigger({ fileCount, additions, deletions, className, children, ...props }: CommitTriggerProps) {
  return (
    <Collapsible.Trigger {...props} className={cx(styles.trigger, className)}>
      <ChevronDown aria-hidden className={styles.chevron} />
      <span className={styles.triggerLabel}>
        {children ?? (fileCount === undefined ? "Changed files" : `${fileCount} ${fileCount === 1 ? "file" : "files"} changed`)}
      </span>
      <LineCounts additions={additions} deletions={deletions} />
    </Collapsible.Trigger>
  );
}

function LineCounts({ additions, deletions }: { additions?: number; deletions?: number }) {
  if (!additions && !deletions) return null;
  return (
    <span className={styles.changes}>
      {!!additions && (
        <span className={styles.additions}>
          <span aria-hidden>+{additions}</span>
          <span className="sr-only">
            , {additions} {additions === 1 ? "line" : "lines"} added
          </span>
        </span>
      )}
      {!!deletions && (
        <span className={styles.deletions}>
          <span aria-hidden>−{deletions}</span>
          <span className="sr-only">
            , {deletions} {deletions === 1 ? "line" : "lines"} removed
          </span>
        </span>
      )}
    </span>
  );
}

export type CommitContentProps = Omit<Collapsible.Panel.Props, "className"> & { className?: string };

export function CommitContent({ className, children, ...props }: CommitContentProps) {
  return (
    <Collapsible.Panel {...props} className={cx(styles.panel, className)}>
      <div className={styles.content}>{children}</div>
    </Collapsible.Panel>
  );
}

export type CommitFilesProps = ComponentPropsWithRef<"ul"> & {
  /** Accessible name of the list (default "Changed files"). */
  label?: string;
};

export function CommitFiles({ label = "Changed files", className, ...props }: CommitFilesProps) {
  return <ul aria-label={label} {...props} className={cx(styles.files, className)} />;
}

const statusText: Record<CommitFileStatus, { letter: string; label: string }> = {
  added: { letter: "A", label: "Added" },
  modified: { letter: "M", label: "Modified" },
  deleted: { letter: "D", label: "Deleted" },
  renamed: { letter: "R", label: "Renamed" },
};

export type CommitFileProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  path: string;
  status: CommitFileStatus;
  additions?: number;
  deletions?: number;
  /** For renames: the old path, shown as "old → new". */
  previousPath?: string;
  /** Decorative icon (default: a file). */
  icon?: ReactNode;
};

export function CommitFile({ path, status, additions, deletions, previousPath, icon, className, ...props }: CommitFileProps) {
  const s = statusText[status];
  return (
    <li {...props} className={cx(styles.file, className)} data-status={status}>
      <span className={styles.status}>
        <span aria-hidden>{s.letter}</span>
        <span className="sr-only">{s.label}: </span>
      </span>
      <span aria-hidden className={styles.fileIcon}>
        {icon ?? <FileText />}
      </span>
      <span className={styles.path}>
        {previousPath && (
          <>
            {previousPath}
            <span aria-hidden> → </span>
            <span className="sr-only"> to </span>
          </>
        )}
        {path}
      </span>
      <LineCounts additions={additions} deletions={deletions} />
    </li>
  );
}
