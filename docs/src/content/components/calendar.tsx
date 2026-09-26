import { useState } from "react";
import { Calendar, type DateRange } from "@/registry/bitop/ui/calendar/calendar";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./calendar.tsx?raw";

export function Single() {
  const [day, setDay] = useState<Date | null>(new Date());
  return (
    <Stack gap={2}>
      <Calendar value={day} onValueChange={setDay} />
      <p className={styles.muted} aria-live="polite">
        {day ? `Selected: ${day.toLocaleDateString(undefined, { dateStyle: "long" })}` : "No date selected"}
      </p>
    </Stack>
  );
}

export function Range() {
  const today = new Date();
  const [range, setRange] = useState<DateRange | null>({
    from: new Date(today.getFullYear(), today.getMonth(), 8),
    to: new Date(today.getFullYear(), today.getMonth(), 14),
  });
  return <Calendar mode="range" numberOfMonths={2} value={range} onValueChange={setRange} />;
}

export function Availability() {
  const today = new Date();
  const booked = [3, 4, 17, 18].map((d) => new Date(today.getFullYear(), today.getMonth(), d).toDateString());
  return (
    <Calendar
      mode="multiple"
      maxSelected={3}
      min={today}
      max={new Date(today.getFullYear(), today.getMonth() + 3, 0)}
      isDateDisabled={(d) => d.getDay() === 0 || d.getDay() === 6 || booked.includes(d.toDateString())}
      weekStartsOn={1}
      showOutsideDays={false}
    />
  );
}

export function MonthAndYear() {
  return <Calendar captionLayout="dropdown" defaultMonth={new Date(1990, 5, 1)} yearRange={[1920, new Date().getFullYear()]} locale="fr-FR" weekStartsOn={1} />;
}

const doc: ComponentDoc = {
  slug: "calendar",
  title: "Calendar",
  category: "Forms",
  description:
    "A dependency-free month grid. Select one date, several dates or a range; limit it with min / max and a disabled-date predicate; show several months; and localise month and weekday names through Intl.",
  imports: `import { Calendar, type DateRange } from "@/components/ui/calendar/calendar";`,
  baseUi: { name: "useRender", href: "https://base-ui.com/react/utils/use-render" },
  examples: examples(raw, [
    ["Single", Single, { title: "Single date" }],
    ["Range", Range, { title: "Range over two months", wide: true }],
    ["Availability", Availability, { title: "Several dates, weekends and booked days unavailable" }],
    ["MonthAndYear", MonthAndYear, { title: "Month and year selects, French locale" }],
  ]),
  props: [
    {
      component: "Calendar",
      note: "Also accepts <div> props. The value props depend on mode: Date | null (single), Date[] (multiple) or { from, to? } | null (range).",
      rows: [
        { name: "mode", type: '"single" | "multiple" | "range"', default: '"single"', description: "Selection model." },
        { name: "value / defaultValue / onValueChange", type: "per mode", description: "Controlled or uncontrolled selection." },
        { name: "required", type: "boolean", description: "Single mode: clicking the selected day keeps it instead of clearing it." },
        { name: "maxSelected", type: "number", description: "Multiple mode: most days that can be selected." },
        { name: "month / defaultMonth / onMonthChange", type: "Date / Date / (month) => void", description: "Controlled or uncontrolled first displayed month." },
        { name: "numberOfMonths", type: "number", default: "1", description: "Months shown side by side." },
        { name: "min / max", type: "Date", description: "Earliest and latest selectable dates; navigation stops there." },
        { name: "isDateDisabled", type: "(date: Date) => boolean", description: "Marks dates unavailable (still focusable, announced as disabled)." },
        { name: "weekStartsOn", type: "0 – 6", default: "0 (Sunday)", description: "First day of the week." },
        { name: "showOutsideDays", type: "boolean", default: "true", description: "Show days from the adjacent months." },
        { name: "captionLayout", type: '"label" | "dropdown"', default: '"label"', description: "Dropdown adds month and year selects." },
        { name: "yearRange", type: "[number, number]", description: "Years in the year select (defaults to min / max, else −100 / +10 years)." },
        { name: "locale", type: "string", description: "BCP 47 locale for Intl month and weekday names." },
        { name: "today", type: "Date", description: 'Overrides "today" (tests, time zones).' },
        { name: "renderDayContent", type: "(date: Date) => ReactNode", description: "Extra content in each day, e.g. a price." },
        { name: "renderDay", type: "useRender.RenderProp", description: "Replace the day button element." },
        { name: "labels", type: "Partial<CalendarLabels>", description: "Translate the navigation labels and day names (previousMonth, nextMonth, month, year, day)." },
        { name: "disabled", type: "boolean", description: "Disables the whole calendar." },
      ],
    },
  ],
  a11y: [
    'Each month is a role="grid" table named by its month label; the label is aria-live="polite", so changing month is announced.',
    "Weekday headers are column headers whose abbr gives the full weekday name. Day buttons are named with the full date (Intl dateStyle \"full\").",
    "Only one day is in the tab order (roving tabindex). Arrow keys move by day and week, Home / End to the start / end of the week, PageUp / PageDown by month, Shift+PageUp / PageDown by year; Enter or Space selects. Arrow keys are mirrored in right-to-left layouts.",
    'Selected cells have aria-selected="true" and a filled day; today has aria-current="date" and is bold and underlined; unavailable days are aria-disabled and struck through. None of these rely on colour alone.',
  ],
};

export default doc;
