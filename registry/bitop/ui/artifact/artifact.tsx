"use client";

import { X } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useId } from "react";
import { IconButton, type IconButtonProps } from "@/registry/bitop/ui/button/button";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./artifact.module.css";

/*
 * Artifact: a panel for something the assistant produced (a document, a
 * chart, generated code) with a header, actions and scrollable content.
 * It's a <section> named by its ArtifactTitle.
 *
 *   <Artifact>
 *     <ArtifactHeader>
 *       <div><ArtifactTitle>Q3 summary</ArtifactTitle><ArtifactDescription>Markdown · 2 min ago</ArtifactDescription></div>
 *       <ArtifactActions>
 *         <ArtifactAction label="Download" icon={<Download aria-hidden />} onClick={…} />
 *         <ArtifactClose onClick={close} />
 *       </ArtifactActions>
 *     </ArtifactHeader>
 *     <ArtifactContent>…</ArtifactContent>
 *   </Artifact>
 */

const ArtifactContext = createContext<string | undefined>(undefined);

export function Artifact({ className, children, ...props }: ComponentPropsWithRef<"section">) {
  const titleId = useId();
  return (
    <ArtifactContext.Provider value={titleId}>
      <section aria-labelledby={titleId} {...props} className={cx(styles.root, className)}>
        {children}
      </section>
    </ArtifactContext.Provider>
  );
}

export function ArtifactHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type ArtifactTitleProps = ComponentPropsWithRef<"p"> & { as?: "p" | "h2" | "h3" | "h4" };

export function ArtifactTitle({ as: Tag = "p", className, ...props }: ArtifactTitleProps) {
  const id = useContext(ArtifactContext);
  return <Tag id={id} {...props} className={cx(styles.title, className)} />;
}

export function ArtifactDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={cx(styles.description, className)} />;
}

export function ArtifactActions({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.actions, className)} />;
}

export type ArtifactActionProps = IconButtonProps & { tooltip?: ReactNode };

/** An icon button with a tooltip; `label` is its accessible name. */
export function ArtifactAction({ tooltip, label, size = "sm", ...props }: ArtifactActionProps) {
  return (
    <Tooltip content={tooltip ?? label}>
      <IconButton {...props} size={size} label={label} />
    </Tooltip>
  );
}

export function ArtifactClose({ label = "Close", ...props }: Omit<ArtifactActionProps, "icon" | "label"> & { label?: string }) {
  return <ArtifactAction {...props} label={label} icon={<X aria-hidden />} />;
}

export type ArtifactContentProps = ComponentPropsWithRef<"div"> & {
  /** Remove the padding (for full-bleed previews and code). */
  flush?: boolean;
};

/**
 * Scrollable body. Focusable so keyboard users can scroll it (WCAG 2.1.1);
 * the enclosing section already carries the name, so it adds no landmark.
 */
export function ArtifactContent({ flush, className, ...props }: ArtifactContentProps) {
  return <div tabIndex={0} {...props} data-flush={flush ? "" : undefined} className={cx(styles.content, className)} />;
}
