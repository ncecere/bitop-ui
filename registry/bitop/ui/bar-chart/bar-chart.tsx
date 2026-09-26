import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./bar-chart.module.css";

/*
 * A small bar chart drawn with CSS: one slot per point, one bar per series,
 * either overlapping (drawn back to front, so put the largest series first)
 * or stacked. To assistive technology the plot is a single image named by
 * `summary`; render the same data as a table next to it for anyone who
 * needs the numbers.
 */

export type BarChartTone = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

export type BarChartSeries<K extends string = string> = {
  key: K;
  label: ReactNode;
  tone?: BarChartTone;
};

export type BarChartPoint<K extends string = string> = {
  /** The point's label, e.g. a date; shown on the axis and in the hover title. */
  label: string;
  values: Record<K, number>;
};

export type BarChartProps<K extends string = string> = {
  data: BarChartPoint<K>[];
  series: BarChartSeries<K>[];
  /** Text alternative of the whole chart, e.g. "Answers per day: 1,204 in total, most on 12 Sep (96)". */
  summary: string;
  /** overlap: bars share the slot, first series at the back; stack: bars add up. */
  layout?: "overlap" | "stack";
  size?: "sm" | "md" | "lg";
  /** Formats values for the peak label and hover titles. */
  formatValue?: (value: number) => string;
  /** Show the legend (default true). */
  legend?: boolean;
  /** Show the first and last labels and the peak value (default true). */
  axis?: boolean;
  className?: string;
};

const defaultTones: BarChartTone[] = ["primary", "info", "success", "warning", "danger", "neutral"];

/** A CSS bar chart with a legend; role="img" with a text summary. */
export function BarChart<K extends string>({
  data,
  series,
  summary,
  layout = "overlap",
  size = "md",
  formatValue = (v) => v.toLocaleString(),
  legend = true,
  axis = true,
  className,
}: BarChartProps<K>) {
  const total = (p: BarChartPoint<K>) => series.reduce((sum, s) => sum + Math.max(0, p.values[s.key] ?? 0), 0);
  const top = (p: BarChartPoint<K>) => Math.max(0, ...series.map((s) => p.values[s.key] ?? 0));
  const peak = Math.max(0, ...data.map(layout === "stack" ? total : top));
  const tone = (s: BarChartSeries<K>, i: number) => s.tone ?? defaultTones[i % defaultTones.length];
  const pct = (v: number) => `${peak > 0 ? (Math.max(0, v) / peak) * 100 : 0}%`;

  return (
    <figure className={cx(styles.root, className)} data-size={size}>
      {legend && series.length > 0 && (
        <ul className={styles.legend}>
          {series.map((s, i) => (
            <li key={s.key} className={styles.legendItem}>
              <span aria-hidden className={styles.swatch} data-tone={tone(s, i)} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div className={styles.plot} role="img" aria-label={summary}>
        {axis && <span className={styles.peak}>{formatValue(peak)}</span>}
        <div className={styles.bars} data-layout={layout}>
          {data.map((p) => (
            <div key={p.label} className={styles.slot} title={`${p.label}: ${series.map((s) => `${formatValue(p.values[s.key] ?? 0)} ${typeof s.label === "string" ? s.label : s.key}`).join(", ")}`}>
              {series.map((s, i) => (
                <span key={s.key} className={styles.bar} data-tone={tone(s, i)} style={{ "--bar-size": pct(p.values[s.key] ?? 0) } as CSSProperties} />
              ))}
            </div>
          ))}
        </div>
      </div>
      {axis && data.length > 0 && (
        <div aria-hidden className={styles.axis}>
          <span>{data[0]!.label}</span>
          {data.length > 1 && <span>{data[data.length - 1]!.label}</span>}
        </div>
      )}
    </figure>
  );
}
