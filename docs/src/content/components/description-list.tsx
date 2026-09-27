import { Clock, FileText, Globe, Layers, RefreshCw } from "lucide-react";
import { Badge, StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button } from "@/registry/bitop/ui/button/button";
import { DescriptionItem, DescriptionList, FactsLine } from "@/registry/bitop/ui/description-list/description-list";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { Time } from "@/registry/bitop/ui/time/time";
import { type ComponentDoc, examples } from "../types";
import raw from "./description-list.tsx?raw";

export function SourceDetails() {
  return (
    <DescriptionList
      dividers
      items={[
        { label: "Start URL", value: <TextLink href="https://registrar.ufl.edu" external>registrar.ufl.edu</TextLink> },
        { label: "Mode", value: "Crawl, depth 2, up to 60 pages" },
        { label: "Schedule", value: <>Weekly · next run <Time value={new Date(2026, 9, 3, 2)} format="date" /></> },
        { label: "Status", value: <StatusBadge tone="success">Ready</StatusBadge> },
        { label: "Embedding profile", value: "Nomic 768 (NaviGator)" },
        { label: "Description", value: null },
      ]}
    />
  );
}

export function DocumentSheetFacts() {
  return (
    <DescriptionList layout="stacked" columns={3} size="sm">
      <DescriptionItem label="Kind">PDF · 1.2 MB</DescriptionItem>
      <DescriptionItem label="Passages">48</DescriptionItem>
      <DescriptionItem label="Updated">
        <Time value={new Date(Date.now() - 3 * 3600_000)} format="relative" />
      </DescriptionItem>
      <DescriptionItem label="Status">
        <StatusBadge tone="danger">Failed</StatusBadge>
      </DescriptionItem>
      <DescriptionItem label="Tags">
        <span style={{ display: "inline-flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
          <Badge size="sm">policy</Badge>
          <Badge size="sm">2026</Badge>
        </span>
      </DescriptionItem>
      <DescriptionItem label="Checksum">
        <code>sha256:9f2c…41ab</code>
      </DescriptionItem>
    </DescriptionList>
  );
}

export function FactsOnADetailHeader() {
  return (
    <PageHeader
      titleAs="h3"
      title="Registrar website"
      meta={<StatusBadge tone="success">Ready</StatusBadge>}
      facts={
        <FactsLine
          items={[
            { label: "Type", value: "Website", icon: <Globe /> },
            { label: "Embedding profile", value: "Nomic 768", icon: <Layers /> },
            { value: "58 documents", icon: <FileText /> },
            { label: "Last sync", value: <>synced <Time value={new Date(Date.now() - 2 * 3600_000)} format="relative" /></>, icon: <RefreshCw /> },
            { value: <TextLink href="#facts-used-by">used by 2 agents</TextLink> },
          ]}
        />
      }
      actions={<Button>Sync now</Button>}
    />
  );
}

export function FactsWithLabels() {
  return (
    <FactsLine
      size="sm"
      showLabels
      items={[
        { label: "Owner", value: "Alex Dev" },
        { label: "Classification", value: "Open" },
        { label: "Results per query", value: "8" },
        { label: "Created", value: <Time value={new Date(2026, 7, 14)} format="date" />, icon: <Clock /> },
      ]}
    />
  );
}

const doc: ComponentDoc = {
  slug: "description-list",
  title: "Description list",
  category: "Display",
  description:
    "Key/value facts: a label column or stacked grid of pairs for detail pages and sheets, and a wrapping facts line (a · b · c) for detail-page headers. Values can be badges, links or times.",
  imports: `import { DescriptionItem, DescriptionList, FactsLine } from "@/components/ui/description-list/description-list";`,
  examples: examples(raw, [
    ["SourceDetails", SourceDetails, { title: "Label column with dividers", description: "Rich values; an empty value shows a dash, read as “Not set”.", wide: true }],
    ["DocumentSheetFacts", DocumentSheetFacts, { title: "Stacked in columns (document sheet)", wide: true }],
    ["FactsOnADetailHeader", FactsOnADetailHeader, { title: "Facts line on a detail header", description: "PageHeader's facts slot. Narrow the window: separators never start a line.", wide: true }],
    ["FactsWithLabels", FactsWithLabels, { title: "Facts with visible labels", wide: true }],
  ]),
  props: [
    {
      component: "DescriptionList",
      note: "Also accepts <dl> props.",
      rows: [
        { name: "items", type: "{ label, value, id? }[]", description: "Pairs to render (or pass DescriptionItem children)." },
        { name: "layout", type: '"grid" | "stacked"', default: '"grid"', description: "Label column next to the value (drops below when narrow), or label above value." },
        { name: "columns", type: "1 | 2 | 3 | 4", default: "1", description: "Columns of pairs in the stacked layout; fewer on narrow containers." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Text size." },
        { name: "dividers", type: "boolean", default: "false", description: "Hairlines between grid rows." },
      ],
    },
    {
      component: "DescriptionItem",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "The term (<dt>)." },
        { name: "children", type: "ReactNode", description: "The value (<dd>)." },
        { name: "empty", type: "ReactNode", default: "“—” (Not set)", description: "Shown when there is no value." },
      ],
    },
    {
      component: "FactsLine",
      note: "Also accepts <ul> props, e.g. aria-label. Children can be FactsLineItem elements.",
      rows: [
        { name: "items", type: "{ value, label?, icon?, id? }[]", description: "The facts." },
        { name: "showLabels", type: "boolean", default: "false", description: "Show “Label: value”; otherwise labels are read by screen readers only." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Text size." },
      ],
    },
  ],
  a11y: [
    "DescriptionList is a <dl>; each pair is a <div> with a <dt> and a <dd>, so screen readers announce terms and definitions.",
    "An empty value shows a dash that is hidden from assistive technology and read as “Not set”.",
    "FactsLine is a list, so its length is announced. Each fact's label is read before its value even when it is hidden visually.",
    "The “·” separators are CSS generated content with empty alternative text, so they aren't read out; icons are decorative.",
  ],
};

export default doc;
