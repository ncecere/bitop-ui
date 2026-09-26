"use client";

import { Bookmark, RotateCcw } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./checkpoint.module.css";

/*
 * Checkpoint: a divider in the conversation marking a saved state, with a
 * "Restore" button to roll the chat (or the agent's files) back to it.
 *
 *   <Checkpoint time="10:42" onRestore={() => restore(id)} />
 *
 * It's a labelled group ("Checkpoint, 10:42"); the restore button's name
 * includes the checkpoint so several restore buttons are distinguishable.
 */

export type CheckpointProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  label?: string;
  /** When it was taken, e.g. "10:42" or a <time> element. */
  time?: ReactNode;
  onRestore?: () => void;
  restoreLabel?: string;
  /** Plain-text description used in the restore button's accessible name. */
  name?: string;
};

export function Checkpoint({ label = "Checkpoint", time, onRestore, restoreLabel = "Restore", name, className, ...props }: CheckpointProps) {
  const described = name ?? (typeof time === "string" ? `${label} ${time}` : label);
  return (
    <div {...props} role="group" aria-label={described} className={cx(styles.root, className)}>
      <span aria-hidden className={styles.line} />
      <span className={styles.label}>
        <Bookmark aria-hidden className={styles.icon} />
        {label}
        {time && <span className={styles.time}>{time}</span>}
      </span>
      {onRestore && (
        <Button variant="ghost" size="sm" onClick={onRestore} aria-label={`${restoreLabel} ${described.toLowerCase()}`} className={styles.restore}>
          <RotateCcw aria-hidden />
          <span aria-hidden>{restoreLabel}</span>
        </Button>
      )}
      <span aria-hidden className={styles.line} />
    </div>
  );
}
