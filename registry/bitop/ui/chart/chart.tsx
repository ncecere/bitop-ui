"use client";

import type { ReactNode } from "react";
import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { Table, Td, Th, Tr } from "@/registry/bitop/ui/table/table";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./chart.module.css";

/*
 * Chart primitives shared by bar-chart, line-chart and sparkline, so every
 * chart uses the same series colours, legend and "Show data" table:
 *
 *   - ChartTone and `chartToneClass`: series colours from the
 *     --color-chart-* tokens (>= 3:1 on surface and bg in every theme).
 *     Put `className={chartToneClass} data-tone={tone}` on an element and
 *     read `var(--chart-color)` in your CSS.
 *   - ChartLegend: a list of series with a swatch in the series' colour and
 *     line pattern (solid, dashed, dotted), so series differ by more than hue.
 *   - ChartData: a "Show data" disclosure with the chart's numbers as a real
 *     table, the accessible alternative to the plot for anyone who needs
 *     exact values.
 *
 *   <ChartLegend series={[{ key: "answers", label: "Answers" }, { key: "chats", label: "Conversations" }]} />
 *   <ChartData caption="Answers per day" series={series} data={points} />
 */

export type ChartTone = "primary" | "info" | "success" | "warning" | "danger" | "neutral";

/** Line pattern of a series; the second and third series get dashed and dotted lines by default. */
export type ChartPattern = "solid" | "dashed" | "dotted";

export type ChartSeries<K extends string = string> = {
  key: K;
  label: ReactNode;
  tone?: ChartTone;
  /** Line pattern (line charts and legend swatches). Default: by position. */
  pattern?: ChartPattern;
};

export type ChartPoint<K extends string = string> = {
  /** The point's label, e.g. a date; shown on the axis, in hover titles and as the table's row header. */
  label: string;
  values: Record<K, number>;
};

/** Series colours in order, for series without a tone. */
export const chartTones: ChartTone[] = ["primary", "info", "success", "warning", "danger", "neutral"];
const patterns: ChartPattern[] = ["solid", "dashed", "dotted"];

/** Put on an element with `data-tone` to get `--chart-color` for that tone. */
export const chartToneClass = styles.tone;

/** The tone of the series at `index` (its own tone, else the next in `chartTones`). */
export function seriesTone(series: { tone?: ChartTone }, index: number): ChartTone {
  return series.tone ?? chartTones[index % chartTones.length]!;
}

/** The line pattern of the series at `index`. */
export function seriesPattern(series: { pattern?: ChartPattern }, index: number): ChartPattern {
  return series.pattern ?? patterns[index % patterns.length]!;
}

/** Text of a series label for titles and summaries (non-string labels fall back to the key). */
export function seriesName(series: { key: string; label: ReactNode }): string {
  return typeof series.label === "string" || typeof series.label === "number" ? String(series.label) : series.key;
}

export type ChartLegendProps = {
  series: ChartSeries[];
  /** Swatch shape: a line (line/area charts) or a square (bar charts). */
  swatch?: "line" | "square";
  className?: string;
};

/** The series legend: a list of swatches and labels. */
export function ChartLegend({ series, swatch = "square", className }: ChartLegendProps) {
  if (series.length === 0) return null;
  return (
    <ul className={cx(styles.legend, className)}>
      {series.map((s, i) => (
        <li key={s.key} className={styles.legendItem}>
          <span
            aria-hidden
            className={cx(styles.tone, styles.swatch)}
            data-tone={seriesTone(s, i)}
            data-shape={swatch}
            data-pattern={swatch === "line" ? seriesPattern(s, i) : undefined}
          />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/** The `dataTable` option of BarChart and LineChart. */
export type ChartDataOptions = {
  /** Names the table, e.g. "Answers per day". */
  caption: string;
  /** Header of the label column (default "Date"). */
  labelHeader?: ReactNode;
  defaultOpen?: boolean;
};

export type ChartDataProps<K extends string = string> = {
  /** Names the table, e.g. "Answers per day". */
  caption: string;
  series: ChartSeries<K>[];
  data: ChartPoint<K>[];
  /** Header of the label column (default "Date"). */
  labelHeader?: ReactNode;
  formatValue?: (value: number) => string;
  /** The disclosure's text (default "Show data"). */
  toggleLabel?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/** A "Show data" disclosure with the chart's numbers in a table. */
export function ChartData<K extends string>({
  caption,
  series,
  data,
  labelHeader = "Date",
  formatValue = (v) => v.toLocaleString(),
  toggleLabel = "Show data",
  defaultOpen,
  open,
  onOpenChange,
  className,
}: ChartDataProps<K>) {
  return (
    <Disclosure title={toggleLabel} open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={cx(styles.data, className)}>
      <Table
        caption={caption}
        density="compact"
        maxHeight="16rem"
        stickyHeader
        columns={[{ label: labelHeader }, ...series.map((s) => ({ label: s.label, numeric: true }))]}
      >
        {data.map((p) => (
          <Tr key={p.label}>
            <Th>{p.label}</Th>
            {series.map((s) => (
              <Td key={s.key} numeric>
                {formatValue(p.values[s.key] ?? 0)}
              </Td>
            ))}
          </Tr>
        ))}
      </Table>
    </Disclosure>
  );
}
