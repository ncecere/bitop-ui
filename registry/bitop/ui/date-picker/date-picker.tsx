"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { CalendarDays } from "lucide-react";
import { type ReactNode, type Ref, useId, useMemo, useRef, useState } from "react";
import {
  Calendar,
  type CalendarProps,
  type DateRange,
  toISODate,
} from "@/registry/bitop/ui/calendar/calendar";
import popup from "@/registry/bitop/ui/styles/popup.module.css";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./date-picker.module.css";

/*
 * DatePicker: a trigger button that opens a Calendar in a Base UI Popover.
 *
 *   <Field label="Start date" description="The first day of the rollout.">
 *     <DatePicker value={day} onValueChange={setDay} />
 *   </Field>
 *   <DatePicker mode="range" aria-label="Report period" numberOfMonths={2} />
 *
 * The trigger is a Base UI Field control, so inside a <Field> it is labelled
 * by the field label, described by its description / error and marked
 * invalid. Its accessible name also includes the current value. Opening moves
 * focus to the selected day (or today); choosing a date (or finishing a range)
 * closes the popup and focus returns to the trigger. With `name`, the value is
 * submitted as `YYYY-MM-DD` (a range as `YYYY-MM-DD/YYYY-MM-DD`).
 */

type CalendarPassThrough = Pick<
  CalendarProps,
  | "locale"
  | "weekStartsOn"
  | "showOutsideDays"
  | "numberOfMonths"
  | "min"
  | "max"
  | "isDateDisabled"
  | "captionLayout"
  | "yearRange"
  | "today"
  | "renderDayContent"
  | "labels"
>;

export type DatePickerLabels = {
  /** Accessible name of the popup (dialog). */
  dialog: string;
  /** Joins the two ends of a range in the trigger. */
  rangeSeparator: string;
};

type DatePickerBaseProps = CalendarPassThrough & {
  /** Shown when nothing is selected. */
  placeholder?: string;
  /** Intl.DateTimeFormat options for the trigger text. */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Name for form submission (a hidden input). Inside a Field, the Field's name is used. */
  name?: string;
  disabled?: boolean;
  /** Accessible name when the picker is not inside a labelled Field. */
  "aria-label"?: string;
  id?: string;
  size?: "sm" | "md";
  /** Stretch the trigger to the container width. */
  block?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Close the popup once a date (or a full range) is picked. */
  closeOnSelect?: boolean;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  /** Extra content under the calendar, e.g. preset buttons. */
  footer?: ReactNode;
  labels?: CalendarProps["labels"] & Partial<DatePickerLabels>;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
};

export type DatePickerSingleProps = DatePickerBaseProps & {
  mode?: "single";
  value?: Date | null;
  defaultValue?: Date | null;
  onValueChange?: (value: Date | null) => void;
};

export type DatePickerRangeProps = DatePickerBaseProps & {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (value: DateRange | null) => void;
};

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

type Value = Date | DateRange | null;

export function DatePicker(props: DatePickerProps) {
  const {
    mode = "single",
    value: valueProp,
    defaultValue,
    onValueChange,
    placeholder = mode === "range" ? "Pick a date range" : "Pick a date",
    formatOptions,
    name,
    disabled,
    "aria-label": ariaLabel,
    id,
    size = "md",
    block,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    closeOnSelect = true,
    side = "bottom",
    align = "start",
    footer,
    labels,
    className,
    ref,
    locale,
    ...calendarProps
  } = props;

  const [innerValue, setInnerValue] = useState<Value>(defaultValue ?? null);
  const value: Value = valueProp !== undefined ? valueProp : innerValue;
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const valueId = useId();
  const ownLabelId = useId();
  const popupRef = useRef<HTMLDivElement | null>(null);

  const formatter = useMemo(() => new Intl.DateTimeFormat(locale, formatOptions ?? { dateStyle: "medium" }), [locale, formatOptions]);
  const separator = labels?.rangeSeparator ?? " – ";

  let text: string | null = null;
  let serialized = "";
  if (value instanceof Date) {
    text = formatter.format(value);
    serialized = toISODate(value);
  } else if (value) {
    text = value.to ? `${formatter.format(value.from)}${separator}${formatter.format(value.to)}` : `${formatter.format(value.from)}${separator}…`;
    serialized = value.to ? `${toISODate(value.from)}/${toISODate(value.to)}` : toISODate(value.from);
  }

  function handleChange(next: Value) {
    if (valueProp === undefined) setInnerValue(next);
    (onValueChange as ((v: Value) => void) | undefined)?.(next);
    if (!closeOnSelect || !next) return;
    if (next instanceof Date || next.to) setOpen(false);
  }

  const calendar =
    mode === "range" ? (
      <Calendar
        {...calendarProps}
        locale={locale}
        labels={labels}
        mode="range"
        value={value as DateRange | null}
        onValueChange={handleChange}
      />
    ) : (
      <Calendar
        {...calendarProps}
        locale={locale}
        labels={labels}
        mode="single"
        required
        value={value as Date | null}
        onValueChange={handleChange}
      />
    );

  return (
    <BasePopover.Root open={open} onOpenChange={(o) => setOpen(o)}>
      <BaseField.Control
        id={id}
        disabled={disabled}
        value={serialized}
        render={(controlProps) => {
          // Keep what a button understands from the Field control: id, label / description
          // wiring, validity and focus tracking. Drop input-only props.
          const {
            value: _value,
            defaultValue: _defaultValue,
            onChange: _onChange,
            name: fieldName,
            autoFocus: _autoFocus,
            type: _type,
            "aria-labelledby": fieldLabelId,
            ...buttonProps
          } = controlProps as typeof controlProps & {
            "aria-labelledby"?: string;
            type?: string;
            value?: unknown;
            name?: string;
          };
          const labelledBy = [fieldLabelId ?? (ariaLabel ? ownLabelId : undefined), valueId].filter(Boolean).join(" ");
          const submitName = name ?? fieldName;
          return (
            <>
              <BasePopover.Trigger
                {...buttonProps}
                ref={ref ? mergeRefs(buttonProps.ref, ref) : buttonProps.ref}
                aria-labelledby={labelledBy}
                className={cx(styles.trigger, className)}
                data-size={size}
                data-block={block ? "" : undefined}
                data-placeholder={text ? undefined : ""}
              >
                <CalendarDays aria-hidden className={styles.icon} />
                {ariaLabel && !fieldLabelId && (
                  <span id={ownLabelId} className="sr-only">
                    {ariaLabel}
                  </span>
                )}
                <span id={valueId} className={styles.value}>
                  {text ?? placeholder}
                </span>
              </BasePopover.Trigger>
              {submitName && <input type="hidden" name={submitName} value={serialized} disabled={disabled} />}
            </>
          );
        }}
      />
      <BasePopover.Portal>
        <BasePopover.Positioner className={popup.positioner} side={side} align={align} sideOffset={6}>
          <BasePopover.Popup
            ref={popupRef}
            aria-label={labels?.dialog ?? (mode === "range" ? "Choose dates" : "Choose date")}
            className={cx(popup.popup, styles.popup)}
            initialFocus={() => popupRef.current?.querySelector<HTMLElement>('[data-day][tabindex="0"]') ?? true}
          >
            {calendar}
            {footer && <div className={styles.footer}>{footer}</div>}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(node);
      else if (r) (r as { current: T | null }).current = node;
    }
  };
}
