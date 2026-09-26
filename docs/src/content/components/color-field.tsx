import { useState } from "react";
import { ColorField, contrastRatio, normalizeHex } from "@/registry/bitop/ui/color-field/color-field";
import { Field } from "@/registry/bitop/ui/field/field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./color-field.tsx?raw";

const presets = [
  { value: "#1d4ed8", label: "Blue" },
  { value: "#166534", label: "Green" },
  { value: "#9d174d", label: "Berry" },
  { value: "#334155", label: "Slate" },
];

export function AccentColour() {
  const [hex, setHex] = useState("");
  // Block saving when white text on the colour would fail AA.
  const value = normalizeHex(hex);
  const error =
    hex !== "" && value && (contrastRatio(value, "#ffffff") ?? 0) < 4.5 ? "White text on this colour is below 4.5:1. Choose a darker colour." : undefined;
  return (
    <Field label="Accent colour" description="Used for buttons and the avatar tile. Leave empty for the default." error={error}>
      <ColorField value={hex} onValueChange={setHex} defaultColor="#1d4ed8" contrastWith="#ffffff" contrastLabel="white text" presets={presets} />
    </Field>
  );
}

export function DarkText() {
  const [hex, setHex] = useState("#fde68a");
  return (
    <Stack gap={4}>
      <Field label="Highlight colour" description="Dark text is drawn on it.">
        <ColorField value={hex} onValueChange={setHex} defaultColor="#fef3c7" contrastWith="#111827" contrastLabel="dark text" />
      </Field>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "color-field",
  title: "Color field",
  category: "Forms",
  description:
    "A hex colour input with a native colour picker, optional preset swatches and a live WCAG contrast check against the text colour that will be drawn on it. It ships no colours of its own: you pass the default and the text colour.",
  imports: `import { ColorField, contrastRatio, formatRatio, normalizeHex } from "@/components/ui/color-field/color-field";`,
  baseUi: { name: "Input", href: "https://base-ui.com/react/components/input" },
  examples: examples(raw, [
    ["AccentColour", AccentColour, { title: "Brand accent with presets", description: "Validate with contrastRatio() before saving: the field reports the ratio, your form decides." }],
    ["DarkText", DarkText, { title: "Checked against dark text" }],
  ]),
  props: [
    {
      component: "ColorField",
      note: "Put it inside a Field: the hex input is the field's control, so the label, description and error attach to it.",
      rows: [
        { name: "value", type: "string", required: true, description: '"#rrggbb", or "" for the default colour.' },
        { name: "onValueChange", type: "(value: string) => void", required: true, description: "Called with the typed, picked or preset value (lower-case)." },
        { name: "defaultColor", type: "string", required: true, description: "Hex colour used while the value is empty; shown in the swatch and the placeholder." },
        { name: "contrastWith", type: "string", required: true, description: "Hex text colour drawn on this colour, for the contrast check." },
        { name: "contrastLabel", type: "string", default: '"the text colour"', description: 'How the text colour is described, e.g. "white text".' },
        { name: "minContrast", type: "number", default: "4.5", description: "Ratio that counts as passing (WCAG AA body text)." },
        { name: "presets", type: "{ value, label }[]", description: "Quick-pick swatches; each needs an accessible label." },
        { name: "pickerLabel", type: "string", default: '"Pick a colour"', description: "Accessible name of the native picker." },
        { name: "disabled", type: "boolean", description: "Disables the input, picker and presets." },
      ],
    },
    {
      component: "Helpers",
      rows: [
        { name: "normalizeHex(value)", type: "string | undefined", description: '"#rrggbb" for "#RGB", "rrggbb" or "#RRGGBB"; undefined otherwise.' },
        { name: "contrastRatio(a, b)", type: "number | undefined", description: "WCAG 2.1 contrast ratio of two hex colours (1 to 21)." },
        { name: "formatRatio(r)", type: "string", description: '"4.4:1": rounded down, so 4.46 never reads as a passing 4.5.' },
      ],
    },
  ],
  a11y: [
    "The contrast result is the hex input's description (aria-describedby) and states pass or fail in words with the ratio, not by colour alone.",
    "The native colour picker and every preset have accessible names; presets are toggle buttons with aria-pressed.",
    'The "Aa" sample is decorative (aria-hidden); the text result carries the information.',
    "An invalid hex is reported in the same description line with an example of a valid value.",
  ],
};

export default doc;
