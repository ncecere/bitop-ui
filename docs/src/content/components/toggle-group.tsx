import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Strikethrough, Underline } from "lucide-react";
import { useState } from "react";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { ToggleGroup, ToggleGroupItem } from "@/registry/bitop/ui/toggle-group/toggle-group";
import { type ComponentDoc, examples } from "../types";
import raw from "./toggle-group.tsx?raw";

export function Single() {
  const [align, setAlign] = useState<string[]>(["left"]);
  return (
    <Stack gap={4}>
      <ToggleGroup aria-label="Text alignment" value={align} onValueChange={setAlign}>
        <ToggleGroupItem value="left" iconOnly aria-label="Align left">
          <AlignLeft aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" iconOnly aria-label="Align center">
          <AlignCenter aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" iconOnly aria-label="Align right">
          <AlignRight aria-hidden />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="View" defaultValue={["list"]} variant="outline" joined>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
        <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
      </ToggleGroup>
    </Stack>
  );
}

export function Multiple() {
  return (
    <Stack gap={4}>
      <ToggleGroup aria-label="Text formatting" multiple defaultValue={["bold"]} variant="outline" size="sm" joined>
        <ToggleGroupItem value="bold" iconOnly aria-label="Bold">
          <Bold aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" iconOnly aria-label="Italic">
          <Italic aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" iconOnly aria-label="Underline">
          <Underline aria-hidden />
        </ToggleGroupItem>
        <ToggleGroupItem value="strike" iconOnly aria-label="Strikethrough">
          <Strikethrough aria-hidden />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup aria-label="Notify me about" multiple orientation="vertical" defaultValue={["mentions"]} variant="outline">
        <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
        <ToggleGroupItem value="deploys">Deployments</ToggleGroupItem>
        <ToggleGroupItem value="billing">Billing</ToggleGroupItem>
      </ToggleGroup>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "toggle-group",
  title: "Toggle group",
  category: "Actions",
  description: "A named set of toggles with shared state: one pressed item at a time, or several with multiple. Items share the group's variant and size.",
  imports: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group/toggle-group";`,
  baseUi: { name: "Toggle Group", href: "https://base-ui.com/react/components/toggle-group" },
  examples: examples(raw, [
    ["Single", Single, { title: "Single selection, spaced and joined" }],
    ["Multiple", Multiple, { title: "Multiple selection, horizontal and vertical" }],
  ]),
  props: [
    {
      component: "ToggleGroup",
      note: "Also accepts Base UI ToggleGroup props (value, defaultValue, onValueChange, disabled, loopFocus…). Values are always string arrays.",
      rows: [
        { name: "aria-label / aria-labelledby", type: "string", required: true, description: "Names the group (one of the two is required)." },
        { name: "multiple", type: "boolean", default: "false", description: "Allow several items to be pressed." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Layout and arrow-key direction." },
        { name: "variant / size", type: '"ghost" | "outline" / "sm" | "md"', default: '"ghost" / "md"', description: "Applied to every item." },
        { name: "joined", type: "boolean", default: "false", description: "Render as one segmented control with shared borders." },
      ],
    },
    {
      component: "ToggleGroupItem",
      note: "Toggle props (iconOnly requires aria-label) except variant and size.",
      rows: [{ name: "value", type: "string", required: true, description: "Identifies the item in the group's value." }],
    },
  ],
  a11y: [
    'The group is role="group" and must be named; each item is a button with aria-pressed.',
    "Only one item is in the tab order; arrow keys (in the group's orientation) move between items and Space/Enter toggle.",
    "Pressed items are marked with a tint and an inset ring, not colour alone.",
  ],
};

export default doc;
