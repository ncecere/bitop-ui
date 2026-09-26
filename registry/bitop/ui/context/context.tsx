"use client";

import { Meter } from "@base-ui/react/meter";
import { Popover } from "@base-ui/react/popover";
import type { CSSProperties } from "react";
import popup from "@/registry/bitop/ui/styles/popup.module.css";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./context.module.css";

/*
 * Context: how much of the model's context window a conversation uses.
 * A compact trigger (ring + percentage) opens a card (Base UI Popover, on
 * hover or click / Enter) with a Base UI Meter and a token breakdown
 * (input, output, reasoning, cached) and optional cost.
 *
 *   <Context usedTokens={42_000} maxTokens={200_000}
 *     usage={{ input: 30_000, output: 9_000, reasoning: 2_000, cached: 1_000 }}
 *     cost={{ total: 0.084 }} modelName="Claude Sonnet" />
 *
 * The trigger's accessible name carries the numbers ("Context window: 21%
 * used, 42,000 of 200,000 tokens"); the level is never colour-only.
 */

export type ContextUsage = { input?: number; output?: number; reasoning?: number; cached?: number };
export type ContextCost = ContextUsage & { total?: number };

export type ContextProps = {
  usedTokens: number;
  maxTokens: number;
  usage?: ContextUsage;
  /** Cost in `currency` units (e.g. USD). */
  cost?: ContextCost;
  currency?: string;
  modelName?: string;
  label?: string;
  locale?: string;
  className?: string;
};

const rows: [keyof ContextUsage, string][] = [
  ["input", "Input"],
  ["output", "Output"],
  ["reasoning", "Reasoning"],
  ["cached", "Cached"],
];

/** 42_000 → "42K", 1_250_000 → "1.3M". */
export function compactTokens(n: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function Context({ usedTokens, maxTokens, usage, cost, currency = "USD", modelName, label = "Context window", locale, className }: ContextProps) {
  const ratio = maxTokens > 0 ? Math.min(1, Math.max(0, usedTokens / maxTokens)) : 0;
  const percent = Math.round(ratio * 100);
  const level = ratio >= 0.9 ? "critical" : ratio >= 0.75 ? "high" : "normal";
  const number = new Intl.NumberFormat(locale);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 4 });
  const name = `${label}: ${percent}% used, ${number.format(usedTokens)} of ${number.format(maxTokens)} tokens`;
  const breakdown = rows.filter(([key]) => usage?.[key] !== undefined || cost?.[key] !== undefined);

  return (
    <Popover.Root>
      <Popover.Trigger openOnHover delay={200} className={cx(styles.trigger, className)} data-level={level} aria-label={name}>
        <svg aria-hidden viewBox="0 0 20 20" className={styles.ring} style={{ "--ratio": ratio } as CSSProperties}>
          <circle cx="10" cy="10" r="8" className={styles.ringTrack} />
          <circle cx="10" cy="10" r="8" pathLength={100} className={styles.ringValue} />
        </svg>
        <span aria-hidden>{percent}%</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={popup.positioner} side="top" sideOffset={8} collisionPadding={8}>
          <Popover.Popup aria-label={label} className={cx(popup.popup, styles.card)}>
            <Meter.Root value={usedTokens} max={maxTokens} className={styles.meter} data-level={level}>
              <div className={styles.meterHead}>
                <Meter.Label className={styles.meterLabel}>
                  {label}
                </Meter.Label>
                <span className={styles.meterValue}>
                  {percent}% · {compactTokens(usedTokens, locale)} / {compactTokens(maxTokens, locale)}
                </span>
              </div>
              <Meter.Track className={styles.track}>
                <Meter.Indicator className={styles.indicator} />
              </Meter.Track>
            </Meter.Root>
            {modelName && <p className={styles.model}>{modelName}</p>}
            {breakdown.length > 0 && (
              <dl className={styles.rows}>
                {breakdown.map(([key, text]) => (
                  <div key={key} className={styles.row}>
                    <dt>{text}</dt>
                    <dd>
                      {usage?.[key] !== undefined && <span>{number.format(usage[key]!)} tokens</span>}
                      {cost?.[key] !== undefined && <span className={styles.cost}>{money.format(cost[key]!)}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {cost?.total !== undefined && (
              <div className={cx(styles.row, styles.total)}>
                <span>Total cost</span>
                <span>{money.format(cost.total)}</span>
              </div>
            )}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
