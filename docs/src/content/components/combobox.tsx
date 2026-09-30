import { useEffect, useState } from "react";
import { Combobox, type ComboboxOption } from "@/registry/bitop/ui/combobox/combobox";
import { Field } from "@/registry/bitop/ui/field/field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./combobox.tsx?raw";

export function Single() {
  const timezones: ComboboxOption[] = [
    { value: "America/New_York", label: "New York", hint: "UTC−5" },
    { value: "America/Chicago", label: "Chicago", hint: "UTC−6" },
    { value: "America/Denver", label: "Denver", hint: "UTC−7" },
    { value: "America/Los_Angeles", label: "Los Angeles", hint: "UTC−8" },
    { value: "Europe/London", label: "London", hint: "UTC+0" },
    { value: "Europe/Berlin", label: "Berlin", hint: "UTC+1" },
    { value: "Asia/Tokyo", label: "Tokyo", hint: "UTC+9" },
    { value: "Australia/Sydney", label: "Sydney", hint: "UTC+10" },
  ];
  const [zone, setZone] = useState<string | null>("Europe/Berlin");
  return (
    <Field label="Time zone" description="Used for scheduled deployments.">
      <Combobox items={timezones} value={zone} onValueChange={setZone} placeholder="Search cities…" clearable />
    </Field>
  );
}

export function Grouped() {
  const regions: ComboboxOption[] = [
    { value: "iad1", label: "Washington, D.C.", hint: "iad1", group: "Americas" },
    { value: "sfo1", label: "San Francisco", hint: "sfo1", group: "Americas" },
    { value: "gru1", label: "São Paulo", hint: "gru1", group: "Americas" },
    { value: "fra1", label: "Frankfurt", hint: "fra1", group: "Europe" },
    { value: "lhr1", label: "London", hint: "lhr1", group: "Europe" },
    { value: "cdg1", label: "Paris", hint: "cdg1", group: "Europe" },
    { value: "hnd1", label: "Tokyo", hint: "hnd1", group: "Asia Pacific" },
    { value: "syd1", label: "Sydney", hint: "syd1", group: "Asia Pacific", disabled: true },
  ];
  return (
    <Field label="Function region">
      <Combobox items={regions} placeholder="Search regions…" emptyText="No region matches that name." autoHighlight />
    </Field>
  );
}

export function Multiple() {
  const people: ComboboxOption[] = [
    { value: "ana", label: "Ana Silva" },
    { value: "ben", label: "Ben Okafor" },
    { value: "chen", label: "Chen Wei" },
    { value: "dara", label: "Dara Novak" },
    { value: "eli", label: "Eli Cohen" },
    { value: "fatima", label: "Fatima Zahra" },
  ];
  const [reviewers, setReviewers] = useState<string[]>(["ana", "chen"]);
  return (
    <Stack gap={5}>
      <Field label="Reviewers" description="Everyone listed must approve before merging." error={reviewers.length === 0 ? "Add at least one reviewer." : undefined}>
        <Combobox multiple items={people} value={reviewers} onValueChange={setReviewers} chipsLabel="Selected reviewers" placeholder="Add people…" clearable />
      </Field>
      <Field label="Labels" labelHint="Optional">
        <Combobox
          multiple
          size="sm"
          items={[
            { value: "bug", label: "bug" },
            { value: "docs", label: "documentation" },
            { value: "perf", label: "performance" },
            { value: "a11y", label: "accessibility" },
          ]}
          chipsLabel="Selected labels"
        />
      </Field>
    </Stack>
  );
}

const catalogue: ComboboxOption[] = [
  { value: "doc-1", label: "Transcript requests", hint: "transcripts.pdf" },
  { value: "doc-2", label: "Parking permits", hint: "parking.md" },
  { value: "doc-3", label: "Academic calendar", hint: "calendar.html" },
  { value: "doc-4", label: "Records privacy", hint: "privacy.html" },
];

/** Stands in for a search endpoint that also matches file names. */
function useDocumentSearch(query: string) {
  const [results, setResults] = useState<ComboboxOption[]>(catalogue);
  useEffect(() => {
    const q = query.trim().toLowerCase();
    const id = setTimeout(() => setResults(catalogue.filter((d) => `${d.label} ${d.hint}`.toLowerCase().includes(q))), 150);
    return () => clearTimeout(id);
  }, [query]);
  return results;
}

export function ServerFiltered() {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const results = useDocumentSearch(query);
  return (
    <Field label="Document" description="Search by title or file name, for example parking.md.">
      <Combobox items={results} filter={null} onInputValueChange={setQuery} value={picked} onValueChange={setPicked} emptyText="No matching documents." />
    </Field>
  );
}

export function FreeText() {
  const groups: ComboboxOption[] = [
    { value: "registrar-staff", label: "registrar-staff", hint: "12 people" },
    { value: "advising-staff", label: "advising-staff", hint: "8 people" },
    { value: "it-admins", label: "it-admins", hint: "3 people" },
  ];
  const [group, setGroup] = useState("");
  return (
    <Field label="Directory group" description="Pick a group seen at sign-in, or type any group name.">
      <Combobox freeText items={groups} value={group} onValueChange={setGroup} placeholder="registrar-staff" clearable />
    </Field>
  );
}

const doc: ComponentDoc = {
  slug: "combobox",
  title: "Combobox",
  category: "Forms",
  description:
    "A filterable select for long option lists: single or multiple selection with chips, grouped options, an empty state and an optional clear button. Put it in a Field for the label, description and error.",
  imports: `import { Combobox, type ComboboxOption } from "@/components/ui/combobox/combobox";`,
  baseUi: { name: "Combobox", href: "https://base-ui.com/react/components/combobox" },
  examples: examples(raw, [
    ["Single", Single, { title: "Single selection with a clear button", wide: true }],
    ["Grouped", Grouped, { title: "Groups, disabled options and an empty state", wide: true }],
    ["Multiple", Multiple, { title: "Multiple selection with chips", wide: true }],
    ["ServerFiltered", ServerFiltered, { title: "Items filtered by the server (filter={null})", wide: true }],
    ["FreeText", FreeText, { title: "Free text with suggestions (freeText)", wide: true }],
  ]),
  props: [
    {
      component: "Combobox",
      note: "Values are the options' string `value`s. The input shows and filters by `label`.",
      rows: [
        { name: "items", type: "{ value, label, icon?, hint?, group?, disabled? }[]", required: true, description: "Options. Options sharing a `group` are listed under a heading." },
        { name: "multiple", type: "boolean", default: "false", description: "Select several values; they show as removable chips." },
        {
          name: "filter",
          type: "((option, query) => boolean) | null",
          description: "How options match the typed text (default: the label contains it). `null` shows `items` unfiltered, for results the server already filtered.",
        },
        {
          name: "freeText",
          type: "boolean",
          default: "false",
          description: "Accept any text, with `items` as suggestions: `value` / `onValueChange` are the text, and a picked suggestion fills in its `value`. Not with `multiple`.",
        },
        { name: "value / defaultValue", type: "V | null (V[] when multiple)", description: "Controlled or uncontrolled selection." },
        { name: "onValueChange", type: "(value, option) => void", description: "Called with the new value(s) and the matching option(s)." },
        { name: "placeholder", type: "string", description: "Shown in the empty input." },
        { name: "emptyText", type: "ReactNode", default: '"No results."', description: "Shown and announced when nothing matches." },
        { name: "clearable", type: "boolean", default: "false", description: "Show a clear button while there is a selection." },
        { name: "clearLabel / triggerLabel", type: "string", default: '"Clear selection" / "Show options"', description: "Accessible names of the icon buttons." },
        { name: "chipsLabel", type: "string", default: '"Selected"', description: "Multiple only: name of the chip toolbar." },
        { name: "aria-label", type: "string", description: "Accessible name when not inside a labelled Field." },
        { name: "autoHighlight", type: "boolean", description: "Highlight the first match while typing, so Enter picks it." },
        { name: "onInputValueChange", type: "(text: string) => void", description: "Called as the user types." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Control the popup." },
        { name: "name / required / disabled / readOnly", type: "string / boolean", description: "Form integration." },
        { name: "limit", type: "number", description: "Most options rendered at once." },
        {
          name: "submitOnEnter",
          type: "boolean",
          default: "false (true with freeText)",
          description: "Let Enter submit a surrounding form when no option is highlighted. By default Enter only picks options, so a closed list never sends a half-filled form.",
        },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Control height." },
      ],
    },
  ],
  a11y: [
    'The input has role="combobox" with aria-expanded and aria-activedescendant; the list is a listbox and groups are named by their headings.',
    "Inside a Field, the input is labelled by the Field label, described by its description and error, and marked aria-invalid.",
    "↑/↓ move through options, Enter selects, Escape closes; typing filters. The empty message is a polite live region.",
    "Enter never submits a surrounding form or dialog (unless submitOnEnter), even after Escape has closed the list: the form's own submit button does.",
    "In multiple mode the chips form a named toolbar: ← from the start of the input moves onto them and Backspace/Delete removes the focused chip. Each chip also has a named remove button.",
    "The clear and open buttons are icon-only and have accessible names; selection is shown with a check icon, not colour alone.",
    "With freeText the input is still a combobox (Base UI Autocomplete) with a listbox of suggestions; the text is the value, so leaving the field keeps what was typed.",
  ],
};

export default doc;
