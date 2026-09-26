import { ArrowDown, ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/bitop/ui/button-group/button-group";
import { Input } from "@/registry/bitop/ui/input/input";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { Menu, MenuItem } from "@/registry/bitop/ui/menu/menu";
import { type ComponentDoc, examples } from "../types";
import raw from "./button-group.tsx?raw";

export function Basic() {
  const [page, setPage] = useState(2);
  return (
    <Stack gap={4}>
      <ButtonGroup aria-label="Pagination">
        <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          <ChevronLeft aria-hidden />
          Previous
        </Button>
        <ButtonGroupText>Page {page} of 9</ButtonGroupText>
        <Button variant="secondary" disabled={page === 9} onClick={() => setPage((p) => p + 1)}>
          Next
          <ChevronRight aria-hidden />
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Merge">
        <Button>Merge pull request</Button>
        <ButtonGroupSeparator />
        <Menu trigger={<IconButton variant="primary" icon={<ChevronDown aria-hidden />} label="More merge options" />}>
          <MenuItem>Squash and merge</MenuItem>
          <MenuItem>Rebase and merge</MenuItem>
        </Menu>
      </ButtonGroup>
    </Stack>
  );
}

export function Orientation() {
  const [replicas, setReplicas] = useState(3);
  return (
    <Inline gap={6} align="start">
      <ButtonGroup aria-label="Reorder" orientation="vertical">
        <IconButton variant="secondary" icon={<ArrowUp aria-hidden />} label="Move up" />
        <IconButton variant="secondary" icon={<ArrowDown aria-hidden />} label="Move down" />
      </ButtonGroup>
      <ButtonGroup aria-labelledby="replicas-label">
        <ButtonGroupText render={<label htmlFor="replicas" id="replicas-label" />}>Replicas</ButtonGroupText>
        <Input id="replicas" inputMode="numeric" value={String(replicas)} readOnly style={{ width: "4rem", textAlign: "center" }} />
        <IconButton variant="secondary" icon={<Minus aria-hidden />} label="Remove replica" disabled={replicas <= 1} onClick={() => setReplicas((r) => r - 1)} />
        <IconButton variant="secondary" icon={<Plus aria-hidden />} label="Add replica" onClick={() => setReplicas((r) => r + 1)} />
      </ButtonGroup>
    </Inline>
  );
}

export function Toolbar() {
  return (
    <ButtonGroup aria-label="Editor actions" spaced>
      <ButtonGroup aria-label="History">
        <Button variant="secondary" size="sm">
          Undo
        </Button>
        <Button variant="secondary" size="sm">
          Redo
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Publish">
        <Button variant="secondary" size="sm">
          Save draft
        </Button>
        <Button size="sm">Publish</Button>
      </ButtonGroup>
    </ButtonGroup>
  );
}

const doc: ComponentDoc = {
  slug: "button-group",
  title: "Button group",
  category: "Actions",
  description:
    "Joins related buttons into one unit with shared borders: pagination, split buttons, steppers. Also takes text segments, separators and inputs. The group must be named.",
  imports: `import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/components/ui/button-group/button-group";`,
  examples: examples(raw, [
    ["Basic", Basic, { title: "Text segments and a split button" }],
    ["Orientation", Orientation, { title: "Vertical, and with an input" }],
    ["Toolbar", Toolbar, { title: "Nested groups" }],
  ]),
  props: [
    {
      component: "ButtonGroup",
      note: "Native <div> props (role is always group).",
      rows: [
        { name: "aria-label / aria-labelledby", type: "string", required: true, description: "Names the group (one of the two is required)." },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Join side by side or stacked." },
        { name: "spaced", type: "boolean", default: "false", description: "Keep children apart instead of joining them (a group of groups)." },
      ],
    },
    { component: "ButtonGroupText", note: "Native <div> props plus render (e.g. a <label>).", rows: [] },
    { component: "ButtonGroupSeparator", note: "Separator props; orientation defaults to vertical.", rows: [] },
  ],
  a11y: [
    'Renders role="group" with a required accessible name, so assistive technology announces what the buttons belong to.',
    "Buttons keep their own semantics and Tab order; for arrow-key navigation between options use ToggleGroup.",
    "Focused and hovered buttons are raised so the focus outline is never hidden by a neighbour.",
    "The separator is decorative (Base UI Separator); split-button menus need their own label.",
  ],
};

export default doc;
