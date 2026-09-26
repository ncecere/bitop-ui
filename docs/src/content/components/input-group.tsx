import { Eye, EyeOff, Globe, Search, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { Field } from "@/registry/bitop/ui/field/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/bitop/ui/input-group/input-group";
import { Kbd } from "@/registry/bitop/ui/kbd/kbd";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./input-group.tsx?raw";

export function Addons() {
  return (
    <Stack gap={5}>
      <Field label="Search" hideLabel>
        <InputGroup>
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput type="search" placeholder="Search documentation…" />
          <InputGroupAddon align="end">
            <Kbd>/</Kbd>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field label="Website" description="Shown on your public profile.">
        <InputGroup>
          <InputGroupAddon>
            <Globe aria-hidden />
            <InputGroupText>https://</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
        </InputGroup>
      </Field>
      <Field label="Monthly budget" error="Enter an amount above $10.">
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>$</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput inputMode="decimal" defaultValue="5" />
          <InputGroupAddon align="end">
            <InputGroupText>USD</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </Stack>
  );
}

export function WithButtons() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <Stack gap={5}>
      <Field label="API key">
        <InputGroup>
          <InputGroupInput type={visible ? "text" : "password"} defaultValue="sk-live-8f2c1e9a" autoComplete="off" spellCheck={false} />
          <InputGroupAddon align="end">
            <InputGroupButton iconOnly aria-label="Show API key" aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
              {visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
      <Field label="Invite by email" description="We'll send a link that expires in 7 days.">
        <InputGroup size="sm">
          <InputGroupInput type="email" placeholder="name@company.com" value={query} onChange={(e) => setQuery(e.target.value)} />
          <InputGroupAddon align="end">
            <InputGroupButton variant="secondary" disabled={!query.includes("@")}>
              Invite
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>
    </Stack>
  );
}

export function WithTextarea() {
  const [text, setText] = useState("");
  return (
    <Field label="Reply">
      <InputGroup>
        <InputGroupTextarea placeholder="Write a reply…" value={text} onChange={(e) => setText(e.target.value)} maxLength={280} />
        <InputGroupAddon align="block-end">
          <InputGroupText>{text.length} / 280</InputGroupText>
          <InputGroupButton variant="primary" style={{ marginInlineStart: "auto" }} disabled={!text.trim()}>
            <SendHorizontal aria-hidden />
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}

const doc: ComponentDoc = {
  slug: "input-group",
  title: "Input group",
  category: "Forms",
  description:
    "An Input or Textarea with addons inside one boundary: icons, prefixes and suffixes, key hints and buttons. The control stays a Field control, so labels, descriptions and errors work as usual.",
  imports: `import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group/input-group";`,
  baseUi: { name: "Input", href: "https://base-ui.com/react/components/input" },
  examples: examples(raw, [
    ["Addons", Addons, { title: "Icons, text and key hints", wide: true }],
    ["WithButtons", WithButtons, { title: "Buttons", wide: true }],
    ["WithTextarea", WithTextarea, { title: "Textarea with a toolbar", wide: true }],
  ]),
  props: [
    { component: "InputGroup", note: "Native <div> props.", rows: [{ name: "size", type: '"sm" | "md"', default: '"md"', description: "Height of the group, its control and buttons." }] },
    {
      component: "InputGroupAddon",
      note: "Native <div> props. Clicking a non-interactive part focuses the control.",
      rows: [
        {
          name: "align",
          type: '"start" | "end" | "block-start" | "block-end"',
          default: '"start"',
          description: "Before or after the control, or a full-width row above/below a textarea.",
        },
      ],
    },
    { component: "InputGroupInput", note: "Input props (without startIcon and size; the group sets the size).", rows: [] },
    { component: "InputGroupTextarea", note: "Textarea props.", rows: [] },
    { component: "InputGroupButton", note: "Button props; defaults to variant ghost and size sm. iconOnly requires aria-label.", rows: [] },
    { component: "InputGroupText", note: "Native <span> props: static text such as a unit or prefix.", rows: [] },
  ],
  a11y: [
    "The control keeps its Field wiring: label, aria-describedby for description and error, and aria-invalid.",
    "Icons and text addons are decorative or visible text; put anything essential (units, prefixes) in the label or description too.",
    "Addon buttons are real buttons in the tab order after the control; icon-only ones must have an aria-label.",
    "The group shows the focus ring and error border (3:1 boundary), and errors also show text and an icon.",
  ],
};

export default doc;
