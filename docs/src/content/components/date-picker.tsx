import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import type { DateRange } from "@/registry/bitop/ui/calendar/calendar";
import { DatePicker } from "@/registry/bitop/ui/date-picker/date-picker";
import { Field } from "@/registry/bitop/ui/field/field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./date-picker.tsx?raw";

export function InAField() {
  const [start, setStart] = useState<Date | null>(null);
  return (
    <Field label="Rollout start" description="The first day the new policy applies." error={start && start.getDay() === 0 ? "Pick a weekday." : undefined}>
      <DatePicker name="start" value={start} onValueChange={setStart} min={new Date()} />
    </Field>
  );
}

export function RangeWithPresets() {
  const [range, setRange] = useState<DateRange | null>(null);
  const [open, setOpen] = useState(false);
  const lastDays = (n: number) => {
    const to = new Date();
    setRange({ from: new Date(to.getFullYear(), to.getMonth(), to.getDate() - (n - 1)), to });
    setOpen(false);
  };
  return (
    <Field label="Report period">
      <DatePicker
        mode="range"
        numberOfMonths={2}
        value={range}
        onValueChange={setRange}
        open={open}
        onOpenChange={setOpen}
        max={new Date()}
        formatOptions={{ month: "short", day: "numeric", year: "numeric" }}
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => lastDays(7)}>
              Last 7 days
            </Button>
            <Button size="sm" variant="secondary" onClick={() => lastDays(30)}>
              Last 30 days
            </Button>
          </>
        }
      />
    </Field>
  );
}

export function DateOfBirth() {
  return (
    <Stack gap={4}>
      <Field label="Date of birth">
        <DatePicker
          captionLayout="dropdown"
          max={new Date()}
          yearRange={[1920, new Date().getFullYear()]}
          formatOptions={{ dateStyle: "long" }}
          placeholder="Select your birthday"
        />
      </Field>
      <DatePicker aria-label="Fecha de entrega" locale="es-ES" weekStartsOn={1} size="sm" placeholder="Elegir fecha" labels={{ dialog: "Elegir fecha", previousMonth: "Mes anterior", nextMonth: "Mes siguiente" }} />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "date-picker",
  title: "Date picker",
  category: "Forms",
  description:
    "A trigger button that opens a Calendar in a popover. Picks a single date or a range, shows the value formatted with Intl, submits it as an ISO date, and works inside Field.",
  imports: `import { DatePicker } from "@/components/ui/date-picker/date-picker";`,
  baseUi: { name: "Popover", href: "https://base-ui.com/react/components/popover" },
  examples: examples(raw, [
    ["InAField", InAField, { title: "Inside a Field" }],
    ["RangeWithPresets", RangeWithPresets, { title: "Range with presets (controlled open)" }],
    ["DateOfBirth", DateOfBirth, { title: "Month / year selects and another locale" }],
  ]),
  props: [
    {
      component: "DatePicker",
      note: "Also accepts the Calendar options min, max, isDateDisabled, weekStartsOn, showOutsideDays, numberOfMonths, captionLayout, yearRange, today, renderDayContent and locale.",
      rows: [
        { name: "mode", type: '"single" | "range"', default: '"single"', description: "Selection model." },
        { name: "value / defaultValue / onValueChange", type: "Date | null, or DateRange | null", description: "Controlled or uncontrolled value." },
        { name: "placeholder", type: "string", default: '"Pick a date"', description: "Shown when nothing is selected." },
        { name: "formatOptions", type: "Intl.DateTimeFormatOptions", default: '{ dateStyle: "medium" }', description: "How the trigger shows the value." },
        { name: "name", type: "string", description: "Submits YYYY-MM-DD (a range as YYYY-MM-DD/YYYY-MM-DD). Inside a Field, the Field's name is used." },
        { name: "aria-label", type: "string", description: "Accessible name when the picker is not inside a labelled Field." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled popup." },
        { name: "closeOnSelect", type: "boolean", default: "true", description: "Close once a date (or a whole range) is picked." },
        { name: "footer", type: "ReactNode", description: "Content under the calendar, e.g. presets." },
        { name: "side / align", type: '"top" | "bottom" / "start" | "center" | "end"', default: '"bottom" / "start"', description: "Popup placement." },
        { name: "size / block", type: '"sm" | "md" / boolean', default: '"md"', description: "Trigger height / full width." },
        { name: "labels", type: "Partial<CalendarLabels & DatePickerLabels>", description: "Translate the popup name (dialog), range separator and calendar labels." },
        { name: "disabled", type: "boolean", description: "Disables the trigger." },
      ],
    },
  ],
  a11y: [
    "The trigger is a Base UI Field control: inside a Field it is labelled by the label, described by the description and error, and aria-invalid when there is an error. Its accessible name also includes the current value.",
    'The trigger exposes aria-haspopup and aria-expanded; the popup is a dialog named "Choose date" (or "Choose dates").',
    "Opening moves focus to the selected day, or today. The calendar keeps its full keyboard model (see Calendar).",
    "Picking a date (or finishing a range) and Escape close the popup, and focus returns to the trigger.",
  ],
};

export default doc;
