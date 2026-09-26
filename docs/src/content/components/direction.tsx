import { useState } from "react";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/registry/bitop/ui/accordion/accordion";
import { DirectionProvider, type Direction } from "@/registry/bitop/ui/direction/direction";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Tab, Tabs, TabsList } from "@/registry/bitop/ui/tabs/tabs";
import { type ComponentDoc, examples } from "../types";
import raw from "./direction.tsx?raw";

export function RightToLeft() {
  const [direction, setDirection] = useState<Direction>("rtl");
  return (
    <Stack gap={3}>
      <Tabs value={direction} onValueChange={(v) => setDirection(v as Direction)}>
        <TabsList variant="pills" aria-label="Reading direction">
          <Tab value="ltr">Left to right</Tab>
          <Tab value="rtl">Right to left</Tab>
        </TabsList>
      </Tabs>
      <div dir={direction} lang={direction === "rtl" ? "ar" : "en"}>
        <DirectionProvider direction={direction}>
          <Stack gap={3}>
            <Tabs defaultValue="a">
              <TabsList aria-label={direction === "rtl" ? "الأقسام" : "Sections"}>
                <Tab value="a">{direction === "rtl" ? "عام" : "General"}</Tab>
                <Tab value="b">{direction === "rtl" ? "الفوترة" : "Billing"}</Tab>
                <Tab value="c">{direction === "rtl" ? "الأعضاء" : "Members"}</Tab>
              </TabsList>
            </Tabs>
            <Accordion>
              <AccordionItem>
                <AccordionTrigger>{direction === "rtl" ? "كيف أبدأ؟" : "How do I get started?"}</AccordionTrigger>
                <AccordionPanel>{direction === "rtl" ? "أنشئ مشروعًا جديدًا من لوحة التحكم." : "Create a new project from the dashboard."}</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Stack>
        </DirectionProvider>
      </div>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "direction",
  title: "Direction",
  category: "Layout",
  description:
    "DirectionProvider tells Base UI components whether text reads left-to-right or right-to-left, so arrow keys, popup placement and scrollbars follow the reading direction.",
  imports: `import { DirectionProvider, useDirection } from "@/components/ui/direction/direction";`,
  baseUi: { name: "Direction Provider", href: "https://base-ui.com/react/utils/direction-provider" },
  examples: examples(raw, [["RightToLeft", RightToLeft, { title: "Right-to-left subtree (arrow keys in the tabs follow the direction)", wide: true }]]),
  props: [
    {
      component: "DirectionProvider",
      rows: [
        { name: "direction", type: '"ltr" | "rtl"', default: '"ltr"', description: "Reading direction for Base UI components inside." },
        { name: "children", type: "ReactNode", description: "Your app or subtree." },
      ],
    },
    { component: "useDirection()", rows: [{ name: "returns", type: '"ltr" | "rtl"', description: "Direction from the nearest provider (\"ltr\" without one)." }] },
  ],
  a11y: [
    "The provider does not set the HTML dir attribute: set dir (and lang) on <html> or the subtree too, so text, bidi and CSS logical properties lay out correctly.",
    "bitop components use logical properties (inline-start/end); chevrons in pagination and carousel flip under :dir(rtl).",
    "Portaled popups render outside the subtree; read useDirection() to pass the direction on if you build your own.",
  ],
};

export default doc;
