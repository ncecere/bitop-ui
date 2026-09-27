import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./sparkline.module.css";

/*
 * Sparkline: a tiny inline trend (no axes, no legend) for stat cards, table
 * cells and summaries. Drawn in SVG with the same series colours as
 * LineChart and BarChart (the --color-chart-* tokens).
 *
 *   <StatCard label="Answers" value="1,204" chart={
 *     <Sparkline values={daily} label="Answers per day, last 14 days: rising from 61 to 96" />
 *   } />
 *
 * It is one image named by `label`: say what the trend is, since the shape
 * alone isn't available to everyone. The last point is marked. Set
 * `decorative` when the same trend is already written out next to it.
 */

export type SparklineTone = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

type SparklineBaseProps = Omit<ComponentPropsWithRef<"span">, "children" | "aria-label"> & {
  /** The values in order (oldest first). */
  values: number[];
  variant?: "line" | "area";
  tone?: SparklineTone;
  /** sm: 1.5rem tall, md: 2.5rem. Width follows the container (or set it with className). */
  size?: "sm" | "md";
  /** Mark the last point (default true). */
  showLast?: boolean;
  /** Scale from 0 (default) or from the smallest value, which exaggerates small changes. */
  baseline?: "zero" | "min";
};

/** A sparkline needs a text alternative unless it is marked decorative. */
export type SparklineProps = SparklineBaseProps & ({ label: string; decorative?: false } | { label?: undefined; decorative: true });

const W = 100;
const H = 100;

export function Sparkline({
  values,
  variant = "line",
  tone = "primary",
  size = "md",
  showLast = true,
  baseline = "zero",
  label,
  decorative,
  className,
  ...props
}: SparklineProps) {
  const max = Math.max(0, ...values);
  const min = baseline === "min" && values.length ? Math.min(...values) : Math.min(0, ...values);
  const span = max - min;
  const n = values.length;
  const x = (i: number) => (n <= 1 ? W : (i / (n - 1)) * W);
  const y = (v: number) => (span > 0 ? H - ((v - min) / span) * H : H / 2);
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const last = n ? values[n - 1]! : 0;

  return (
    <span
      {...props}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? true : undefined}
      data-tone={tone}
      data-size={size}
      className={cx(styles.root, className)}
    >
      <svg aria-hidden focusable="false" className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {n > 1 && variant === "area" && <path className={styles.fill} d={`${line} L${W},${H} L0,${H} Z`} />}
        {n > 1 && <path className={styles.line} d={line} vectorEffect="non-scaling-stroke" />}
      </svg>
      {showLast && n > 0 && (
        <span
          className={styles.last}
          style={{ "--x": String(x(n - 1) / W), "--y": String(y(last) / H) } as CSSProperties}
        />
      )}
    </span>
  );
}
