import { useState } from "react";
import { Checkbox, CheckboxGroup } from "@/registry/bitop/ui/checkbox/checkbox";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./checkbox.tsx?raw";

export function Group() {
  const [scopes, setScopes] = useState<string[]>(["read"]);
  return (
    <CheckboxGroup legend="Scopes" description="What this token can do." value={scopes} onValueChange={setScopes}>
      <Checkbox value="read" label="Read" description="List projects and deployments." />
      <Checkbox value="write" label="Write" description="Create and update deployments." />
      <Checkbox value="admin" label="Admin" description="Manage members and billing." disabled />
    </CheckboxGroup>
  );
}

export function Single() {
  return (
    <Stack gap={4}>
      <Checkbox label="Email me when a build fails" defaultChecked />
      <Checkbox label="Partially selected" indeterminate />
      <Checkbox label="Disabled" disabled />
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "checkbox",
  title: "Checkbox",
  category: "Forms",
  description: "A labelled checkbox with an optional description, and CheckboxGroup for a fieldset of related options.",
  imports: `import { Checkbox, CheckboxGroup } from "@/components/ui/checkbox/checkbox";`,
  baseUi: { name: "Checkbox", href: "https://base-ui.com/react/components/checkbox" },
  examples: examples(raw, [
    ["Group", Group, { title: "Checkbox group" }],
    ["Single", Single, { title: "Single checkboxes", description: "Checked, indeterminate and disabled." }],
  ]),
  props: [
    {
      component: "Checkbox",
      note: "Also accepts Base UI Checkbox.Root props (checked, defaultChecked, onCheckedChange, indeterminate, value, name…).",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Visible label and accessible name." },
        { name: "description", type: "ReactNode", description: "Help text, announced as the description." },
      ],
    },
    {
      component: "CheckboxGroup",
      note: "Also accepts Base UI CheckboxGroup props (value, defaultValue, onValueChange, allValues…).",
      rows: [
        { name: "legend", type: "ReactNode", required: true, description: "Group label (a fieldset legend)." },
        { name: "description", type: "ReactNode", description: "Help text for the group." },
        { name: "error", type: "ReactNode", description: "Error message; marks the group invalid." },
        { name: "orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Layout." },
      ],
    },
  ],
  a11y: [
    "Every checkbox requires a label; the whole row is the click target.",
    "Descriptions are wired with aria-describedby.",
    "Groups are a fieldset with a legend, so screen readers announce the group name.",
    "The box boundary meets 3:1 against its background (WCAG 1.4.11).",
  ],
};

export default doc;
