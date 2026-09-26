"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentPropsWithRef } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./marker.module.css";

/*
 * Marker: an inline row in a conversation or activity feed: a status update
 * ("Explored 4 files"), a system note, a bordered row, or a labelled
 * separator ("Today").
 *
 *   <Marker>
 *     <MarkerIcon><FileText /></MarkerIcon>
 *     <MarkerContent>Explored 4 files</MarkerContent>
 *   </Marker>
 *
 * It has no behaviour of its own. For in-progress markers whose text
 * changes, pass role="status" so updates are announced. `render` swaps the
 * element, e.g. `render={<a href="…" />}` or a router link.
 */

export type MarkerVariant = "default" | "border" | "separator";

export type MarkerProps = ComponentPropsWithRef<"div"> & {
  variant?: MarkerVariant;
  /** Render another element, e.g. a link: `render={<a href="/runs/42" />}`. */
  render?: useRender.RenderProp;
};

export function Marker({ variant = "default", className, render, ref, ...props }: MarkerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    ref,
    props: { ...props, className: cx(styles.marker, className), "data-variant": variant },
  });
}

export type MarkerIconProps = ComponentPropsWithRef<"span">;

/** A decorative icon slot (hidden from assistive technology). */
export function MarkerIcon({ className, ...props }: MarkerIconProps) {
  return <span aria-hidden="true" {...props} className={cx(styles.icon, className)} />;
}

export type MarkerContentProps = ComponentPropsWithRef<"span">;

export function MarkerContent({ className, ...props }: MarkerContentProps) {
  return <span {...props} className={cx(styles.content, className)} />;
}
