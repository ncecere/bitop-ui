import { useState } from "react";
import { Field } from "@/registry/bitop/ui/field/field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { NumberInput } from "@/registry/bitop/ui/number-input/number-input";
import { type ComponentDoc, examples } from "../types";
import raw from "./number-input.tsx?raw";

export function Limits() {
  const [pages, setPages] = useState("50000");
  const [storage, setStorage] = useState("10");
  const valid = pages === "" || /^\d+$/.test(pages);
  return (
    <Stack gap={4}>
      <Field label="Crawled pages per day" description="Leave empty for no limit." error={valid ? undefined : "Enter a whole number."}>
        <NumberInput value={pages} onValueChange={setPages} maximumFractionDigits={0} unit="per day" placeholder="No limit" />
      </Field>
      <Field label="Storage (GiB)">
        <NumberInput value={storage} onValueChange={setStorage} unit="GiB" />
      </Field>
    </Stack>
  );
}

export function Locale() {
  const [amount, setAmount] = useState("1234567.5");
  return (
    <Field label="Betrag (de-DE)" description={`Stored value: ${amount || "empty"}`}>
      <NumberInput value={amount} onValueChange={setAmount} locale="de-DE" maximumFractionDigits={2} />
    </Field>
  );
}

const doc: ComponentDoc = {
  slug: "number-input",
  title: "Number input",
  category: "Forms",
  description:
    "A text input for amounts: shows thousands separators while not editing, the plain number while editing, and an optional unit. The value stays a string, so forms keep blank and invalid text for their own validation.",
  imports: `import { NumberInput, formatNumberText, parseNumberText } from "@/components/ui/number-input/number-input";`,
  baseUi: { name: "Input", href: "https://base-ui.com/react/components/input" },
  examples: examples(raw, [
    ["Limits", Limits, { title: "Limits with units" }],
    ["Locale", Locale, { title: "Locale-aware grouping and decimal mark" }],
  ]),
  props: [
    {
      component: "NumberInput",
      note: "Also accepts Input props (size, placeholder, disabled, name, onFocus, onBlur…). type is always text.",
      rows: [
        { name: "value", type: "string", required: true, description: "The plain value (\"50000\", \"1.5\" or \"\")." },
        { name: "onValueChange", type: "(value: string) => void", required: true, description: "Called with the typed text parsed back to a plain value (separators removed, decimal mark as \".\")." },
        { name: "locale", type: "string", description: "Locale for grouping and the decimal mark; defaults to the browser's." },
        { name: "maximumFractionDigits", type: "number", default: "3", description: "Fraction digits shown while not editing; 0 sets inputMode=\"numeric\"." },
        { name: "unit", type: "ReactNode", description: "Unit shown after the input (decorative: also put it in the label or description)." },
      ],
    },
  ],
  a11y: [
    "A native text input with inputMode numeric or decimal, so mobile keyboards show digits; it is not type=\"number\", which can't show grouping and changes value on scroll.",
    "Inside a Field it is labelled, described and marked invalid like any Input.",
    "The unit is aria-hidden to avoid reading it twice: include it in the label or description (\"Storage (GiB)\").",
  ],
};

export default doc;
