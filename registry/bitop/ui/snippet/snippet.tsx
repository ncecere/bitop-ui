"use client";

import type { ComponentPropsWithRef } from "react";
import { CopyButton } from "@/registry/bitop/ui/copy-button/copy-button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./snippet.module.css";

/*
 * Snippet: a one-line command with a copy button, e.g. an install command
 * in an answer. The prefix ("$") is decorative and never copied.
 *
 *   <Snippet code="npm install react-markdown" />
 */

export type SnippetProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  code: string;
  /** Decorative prompt, e.g. "$" or ">". Set to "" to hide. */
  prefix?: string;
  /** What is copied, for the button's name: "Copy command". */
  label?: string;
};

export function Snippet({ code, prefix = "$", label = "command", className, ...props }: SnippetProps) {
  return (
    <div {...props} className={cx(styles.root, className)}>
      {prefix && (
        <span aria-hidden className={styles.prefix}>
          {prefix}
        </span>
      )}
      {/* Long commands scroll sideways; a scroll container must be focusable (WCAG 2.1.1). */}
      <code tabIndex={0} className={styles.code}>
        {code}
      </code>
      <CopyButton value={code} label={label} className={styles.copy} />
    </div>
  );
}
