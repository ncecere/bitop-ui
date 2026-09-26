import { useState } from "react";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/registry/bitop/ui/accordion/accordion";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./accordion.tsx?raw";

export function Faq() {
  return (
    <Accordion defaultValue={["plans"]}>
      <AccordionItem value="plans">
        <AccordionTrigger>Can I change plans later?</AccordionTrigger>
        <AccordionPanel>
          Yes. Upgrades take effect immediately and are prorated; downgrades apply at the end of the billing period.
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem value="seats">
        <AccordionTrigger>How are seats counted?</AccordionTrigger>
        <AccordionPanel>Every member with access to at least one project counts as a seat. Guests are free.</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="export">
        <AccordionTrigger>Can I export my data?</AccordionTrigger>
        <AccordionPanel>Owners can export projects, deployments and audit logs as JSON from Settings → Data.</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

export function Multiple() {
  const [open, setOpen] = useState<string[]>(["build"]);
  return (
    <Stack gap={3}>
      <Accordion variant="outline" multiple value={open} onValueChange={(v) => setOpen(v as string[])} headingLevel={4}>
        <AccordionItem value="build">
          <AccordionTrigger meta="3 settings">Build</AccordionTrigger>
          <AccordionPanel>Node 22, npm ci, output directory dist.</AccordionPanel>
        </AccordionItem>
        <AccordionItem value="env">
          <AccordionTrigger meta="12 variables">Environment</AccordionTrigger>
          <AccordionPanel>Variables are encrypted at rest and injected at build and run time.</AccordionPanel>
        </AccordionItem>
        <AccordionItem value="danger" disabled>
          <AccordionTrigger meta="Owners only">Danger zone</AccordionTrigger>
          <AccordionPanel>Transfer or delete the project.</AccordionPanel>
        </AccordionItem>
      </Accordion>
      <p>Open: {open.length ? open.join(", ") : "none"}</p>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "accordion",
  title: "Accordion",
  category: "Layout",
  description: "A stack of headings that show and hide their sections. One section opens at a time unless multiple is set.",
  imports: `import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/components/ui/accordion/accordion";`,
  baseUi: { name: "Accordion", href: "https://base-ui.com/react/components/accordion" },
  examples: examples(raw, [
    ["Faq", Faq, { title: "Single (FAQ)", wide: true }],
    ["Multiple", Multiple, { title: "Multiple, controlled, outline", wide: true }],
  ]),
  props: [
    {
      component: "Accordion",
      note: "Also accepts Base UI Accordion.Root props (hiddenUntilFound, keepMounted, disabled…).",
      rows: [
        { name: "value / defaultValue / onValueChange", type: "Value[] / Value[] / (value) => void", description: "Open items (always an array)." },
        { name: "multiple", type: "boolean", default: "false", description: "Allow several items open at once." },
        { name: "headingLevel", type: "2 | 3 | 4 | 5 | 6", default: "3", description: "Heading level wrapping each trigger." },
        { name: "variant", type: '"plain" | "outline"', default: '"plain"', description: "Hairline rows, or a card around the items." },
      ],
    },
    { component: "AccordionItem", rows: [{ name: "value", type: "any", description: "Identifies the item (generated if omitted)." }, { name: "disabled", type: "boolean", description: "Can't be toggled." }] },
    {
      component: "AccordionTrigger",
      rows: [
        { name: "children", type: "ReactNode", required: true, description: "Heading text; the button's accessible name." },
        { name: "meta", type: "ReactNode", description: "Muted text after the title." },
        { name: "headingLevel", type: "2 | 3 | 4 | 5 | 6", description: "Overrides the Accordion's level." },
      ],
    },
    { component: "AccordionPanel", note: "Alias: AccordionContent.", rows: [{ name: "contentClassName", type: "string", description: "Class for the padded inner wrapper." }] },
  ],
  a11y: [
    "Each trigger is a native button inside a real heading (h3 by default), with aria-expanded and aria-controls.",
    "Tab moves between triggers; Enter or Space toggles. Disabled items are skipped by assistive technology interaction.",
    "Panels are labelled by their trigger.",
    "The height animation and chevron rotation are switched off under prefers-reduced-motion.",
    "Pick headingLevel so the headings fit the page outline.",
  ],
};

export default doc;
