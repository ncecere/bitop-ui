import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./aspect-ratio.module.css";

/*
 * AspectRatio: a box that keeps a width-to-height ratio (CSS aspect-ratio).
 * Images, videos and iframes inside fill it and are cropped with
 * object-fit: cover.
 *
 *   <AspectRatio ratio={16 / 9}><img src="…" alt="…" /></AspectRatio>
 *
 * It is purely presentational; give media inside it their own alt text or
 * title.
 */

export type AspectRatioProps = ComponentPropsWithRef<"div"> & {
  /** Width divided by height, e.g. `16 / 9` (default 1). */
  ratio?: number;
  /** Rounded corners and a sunken background while media loads. */
  framed?: boolean;
};

export function AspectRatio({ ratio = 1, framed = false, className, style, ...props }: AspectRatioProps) {
  return (
    <div
      {...props}
      data-framed={framed ? "" : undefined}
      className={cx(styles.ratio, className)}
      style={{ "--aspect-ratio": ratio, ...style } as CSSProperties}
    />
  );
}
