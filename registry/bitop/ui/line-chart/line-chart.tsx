import type { CSSProperties } from "react";
import {
  ChartData,
  ChartLegend,
  chartToneClass,
  seriesName,
  seriesPattern,
  seriesTone,
  type ChartDataOptions,
  type ChartPoint,
  type ChartSeries,
  type ChartTone,
} from "@/registry/bitop/ui/chart/chart";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./line-chart.module.css";

/*
 * LineChart: one or more series over an ordered set of points, as lines or
 * filled areas, drawn in SVG (no chart library).
 *
 *   <LineChart
 *     summary="Answers per day, 1–14 Sep: 1,204 in total, rising from 61 to 96."
 *     series={[{ key: "answers", label: "Answers" }, { key: "chats", label: "Conversations" }]}
 *     data={days}                       // [{ label: "Sep 1", values: { answers: 61, chats: 20 } }, …]
 *     variant="area"
 *     dataTable={{ caption: "Answers per day" }}
 *   />
 *
 * To assistive technology the plot is one image named by `summary` (say
 * what the chart shows: the range, the total, the trend and the extremes);
 * `dataTable` adds a "Show data" disclosure with every number in a table.
 * Series differ by colour and line pattern (solid, dashed, dotted). Colours,
 * legend and data table are shared with BarChart (see chart). The scale
 * starts at 0 and tops out at the largest value, shown as the peak line.
 */

export type LineChartTone = ChartTone;
export type LineChartSeries<K extends string = string> = ChartSeries<K>;
export type LineChartPoint<K extends string = string> = ChartPoint<K>;

export type LineChartProps<K extends string = string> = {
  data: LineChartPoint<K>[];
  series: LineChartSeries<K>[];
  /** Text alternative of the whole chart (required). */
  summary: string;
  /** line: strokes only; area: strokes over a soft fill. */
  variant?: "line" | "area";
  size?: "sm" | "md" | "lg";
  /** Formats values for the peak label, hover titles and data table. */
  formatValue?: (value: number) => string;
  /** Show the legend (default true). */
  legend?: boolean;
  /** Show the first and last labels and the peak value (default true). */
  axis?: boolean;
  /** Mark every point with a dot (default: only when there is a single point). */
  points?: boolean;
  /** Adds a "Show data" disclosure with the numbers in a table. */
  dataTable?: ChartDataOptions;
  className?: string;
};

// The plot's coordinate system; the SVG stretches to its box (strokes don't scale).
const W = 1000;
const H = 100;

/** A line or area chart with a legend; role="img" with a text summary and an optional data table. */
export function LineChart<K extends string>({
  data,
  series,
  summary,
  variant = "line",
  size = "md",
  formatValue = (v) => v.toLocaleString(),
  legend = true,
  axis = true,
  points,
  dataTable,
  className,
}: LineChartProps<K>) {
  const peak = Math.max(0, ...data.flatMap((p) => series.map((s) => p.values[s.key] ?? 0)));
  const n = data.length;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => (peak > 0 ? H - (Math.max(0, v) / peak) * H : H);
  const showPoints = points ?? n === 1;

  return (
    <figure className={cx(styles.root, className)} data-size={size} data-variant={variant}>
      {legend && <ChartLegend series={series} swatch={variant === "area" ? "square" : "line"} />}
      <div className={styles.plot} role="img" aria-label={summary}>
        {axis && <span className={styles.peak}>{formatValue(peak)}</span>}
        <div className={styles.area}>
          <svg aria-hidden focusable="false" className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {n > 1 &&
              series.map((s, i) => {
                const line = data.map((p, j) => `${j === 0 ? "M" : "L"}${x(j).toFixed(2)},${y(p.values[s.key] ?? 0).toFixed(2)}`).join(" ");
                return (
                  <g key={s.key} className={chartToneClass} data-tone={seriesTone(s, i)}>
                    {variant === "area" && <path className={styles.fill} d={`${line} L${W},${H} L0,${H} Z`} />}
                    <path className={styles.line} data-pattern={seriesPattern(s, i)} d={line} vectorEffect="non-scaling-stroke" />
                  </g>
                );
              })}
          </svg>
          {showPoints &&
            series.map((s, i) =>
              data.map((p, j) => (
                <span
                  key={`${s.key}-${p.label}`}
                  aria-hidden
                  className={cx(chartToneClass, styles.point)}
                  data-tone={seriesTone(s, i)}
                  style={{ "--x": `${(x(j) / W) * 100}%`, "--y": `${(y(p.values[s.key] ?? 0) / H) * 100}%` } as CSSProperties}
                />
              )),
            )}
          {/* Hover targets: one column per point with its values as a title. */}
          <div className={styles.slots}>
            {data.map((p) => (
              <span
                key={p.label}
                className={styles.slot}
                title={`${p.label}: ${series.map((s) => `${formatValue(p.values[s.key] ?? 0)} ${seriesName(s)}`).join(", ")}`}
              />
            ))}
          </div>
        </div>
      </div>
      {axis && n > 0 && (
        <div aria-hidden className={styles.axis}>
          <span>{data[0]!.label}</span>
          {n > 1 && <span>{data[n - 1]!.label}</span>}
        </div>
      )}
      {dataTable && (
        <ChartData
          caption={dataTable.caption}
          labelHeader={dataTable.labelHeader}
          defaultOpen={dataTable.defaultOpen}
          series={series}
          data={data}
          formatValue={formatValue}
        />
      )}
    </figure>
  );
}
