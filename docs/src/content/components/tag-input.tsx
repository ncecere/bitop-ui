import { useState } from "react";
import { Field } from "@/registry/bitop/ui/field/field";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { TagInput } from "@/registry/bitop/ui/tag-input/tag-input";
import { type ComponentDoc, examples } from "../types";
import raw from "./tag-input.tsx?raw";

export function Tags() {
  const [tags, setTags] = useState(["handbook", "policy"]);
  return (
    <Field label="Tags" description="Press Enter or comma after each tag. Paste a comma-separated list to add several.">
      <TagInput value={tags} onValueChange={setTags} maxTags={10} />
    </Field>
  );
}

export function CaseSensitive() {
  const [labels, setLabels] = useState<string[]>([]);
  return (
    <Stack gap={4}>
      <Field label="Labels" description="Kept as typed (custom normalize), up to 3.">
        <TagInput value={labels} onValueChange={setLabels} maxTags={3} normalize={(t) => t.trim()} size="sm" placeholder="Add a label…" />
      </Field>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "tag-input",
  title: "Tag input",
  category: "Forms",
  description:
    "A list of short text tags with an inline input. Enter, comma or Tab adds the typed tag, Backspace in the empty input removes the last one, pasting a list adds several, and pending text is added on blur so it isn't lost on submit.",
  imports: `import { TagInput } from "@/components/ui/tag-input/tag-input";`,
  baseUi: { name: "Input", href: "https://base-ui.com/react/components/input" },
  examples: examples(raw, [
    ["Tags", Tags, { title: "Tags with a limit" }],
    ["CaseSensitive", CaseSensitive, { title: "Custom normalisation, small size" }],
  ]),
  props: [
    {
      component: "TagInput",
      note: "Also accepts native <input> props (name, placeholder, aria-*, onBlur…). Inside a Field the input gets the label, description and invalid state.",
      rows: [
        { name: "value", type: "string[]", required: true, description: "The tags." },
        { name: "onValueChange", type: "(tags: string[]) => void", required: true, description: "Called with the new list after an add or remove." },
        { name: "maxTags", type: "number", description: "Most tags allowed; the input is disabled and says so when reached." },
        { name: "maxTagLength", type: "number", default: "64", description: "Longer tags are cut to this length." },
        { name: "normalize", type: "(tag: string) => string", default: "trim + lower-case", description: 'Cleans a typed tag; return "" to drop it. Duplicates are ignored.' },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Control height." },
        { name: "disabled", type: "boolean", description: "Disables the input and hides the remove buttons." },
      ],
    },
  ],
  a11y: [
    "The tags are a labelled list; each has its own “Remove tag …” button, and removing one returns focus to the input.",
    "A polite status message announces “Added tag …” / “Removed tag …”.",
    "An empty Enter doesn't submit the surrounding form by accident; Enter that confirms an IME composition never adds a tag.",
    "The wrapper shows the focus ring of the inner input (:focus-within) and the danger border when the Field is invalid.",
  ],
};

export default doc;
