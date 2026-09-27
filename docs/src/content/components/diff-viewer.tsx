import { DescriptionList } from "@/registry/bitop/ui/description-list/description-list";
import { DiffViewer } from "@/registry/bitop/ui/diff-viewer/diff-viewer";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./diff-viewer.tsx?raw";

export function AuditEntry() {
  const before = {
    name: "Support agent",
    model: "gpt-oss-120b",
    audience: "team",
    retrieval: { passages: 8, fusion: { keyword: 0.3, vector: 0.7 } },
    knowledgeBases: ["handbook", "it-faq"],
    welcome: "Hi! Ask me about IT services.",
  };
  const after = {
    name: "Support agent",
    model: "claude-sonnet",
    audience: "signed-in",
    retrieval: { passages: 12, fusion: { keyword: 0.3, vector: 0.7 } },
    knowledgeBases: ["handbook", "it-faq", "registrar"],
    moderation: { input: "flag" },
  };
  return (
    <Stack gap={4}>
      <DescriptionList
        size="sm"
        items={[
          { label: "Action", value: "agent.publish" },
          { label: "By", value: "Alex Dev" },
          { label: "When", value: "Sep 26, 2026, 2:14 PM" },
        ]}
      />
      <DiffViewer label="Changes to Support agent" format="json" before={before} after={after} />
    </Stack>
  );
}

export function PromptVersions() {
  const v1 = [
    "You are the IT help desk assistant for the university.",
    "Answer from the knowledge bases only.",
    "If you don't know, say so and link to the service portal.",
    "Keep answers short.",
    ...Array.from({ length: 14 }, (_, i) => `Rule ${i + 1}: follow the published service-level policy for request type ${i + 1}.`),
    "Never ask for passwords.",
  ].join("\n");
  const v2 = v1
    .replace("Keep answers short.", "Keep answers under 120 words.\nUse bullet lists for steps.")
    .replace("Never ask for passwords.", "Never ask for passwords or MFA codes.");
  return <DiffViewer label="System prompt, version 3 compared with version 4" before={v1} after={v2} defaultMode="split" />;
}

export function LargeValue() {
  const lines = Array.from({ length: 400 }, (_, i) => `passage ${String(i + 1).padStart(3, "0")}: ${"lorem ipsum ".repeat(4).trim()}`);
  const after = [...lines];
  after[120] = "passage 121: rewritten after the re-crawl";
  after.splice(300, 2);
  return <DiffViewer label="Document text before and after re-fetch" before={lines.join("\n")} after={after.join("\n")} maxHeight="16rem" contextLines={2} wrap={false} />;
}

const doc: ComponentDoc = {
  slug: "diff-viewer",
  title: "Diff viewer",
  category: "Display",
  description:
    "Before/after for text (line diff) and JSON (added, removed and changed keys with paths), unified or split, in a scroll area. Changes carry +/− signs and hidden labels, never colour alone.",
  imports: `import { DiffViewer } from "@/components/ui/diff-viewer/diff-viewer";
import { diffJson, diffText } from "@/components/ui/diff-viewer/diff";`,
  examples: examples(raw, [
    ["AuditEntry", AuditEntry, { title: "Audit entry (structural JSON diff)", description: "Switch to Split for a Field | Before | After table.", wide: true }],
    ["PromptVersions", PromptVersions, { title: "Two versions of a text, split", description: "Long unchanged runs fold into “Show N unchanged lines”.", wide: true }],
    ["LargeValue", LargeValue, { title: "Large value, no wrapping", description: "400 lines: only the changes and 2 lines of context are shown; long lines scroll sideways.", wide: true }],
  ]),
  props: [
    {
      component: "DiffViewer",
      rows: [
        { name: "label", type: "string", required: true, description: "Names the diff table and the scroll region." },
        { name: "before / after", type: "string | unknown", required: true, description: "Text, or for format=json any JSON value or JSON string." },
        { name: "format", type: '"text" | "json"', default: '"text"', description: "Line diff, or structural diff of two JSON values." },
        { name: "mode / defaultMode / onModeChange", type: '"unified" | "split"', default: '"unified"', description: "Layout; controlled or not." },
        { name: "showModeToggle", type: "boolean", default: "true", description: "The Unified / Split toggle group." },
        { name: "contextLines", type: "number", default: "3", description: "Unchanged lines kept around each change (text)." },
        { name: "maxHeight", type: "string", default: '"24rem"', description: "Height of the scroll area." },
        { name: "wrap", type: "boolean", default: "true", description: "Wrap long lines; false scrolls sideways." },
        { name: "actions", type: "ReactNode", description: "Extra header controls, e.g. a copy button." },
        { name: "labels", type: "Partial<DiffViewerLabels>", description: "Translate Before/After, Added/Removed/Changed, summaries and the toggle." },
      ],
    },
    {
      component: "diff.ts helpers",
      note: "Pure functions, usable without the viewer (e.g. “3 fields changed” in a table cell).",
      rows: [
        { name: "diffText(before, after, maxEdits?)", type: "{ lines, added, removed, approximate }", description: "Myers line diff; beyond maxEdits (4000) it falls back to remove-all/add-all and sets approximate." },
        { name: "diffJson(before, after)", type: "{ kind, path, before?, after? }[]", description: "Added, removed and changed keys with paths like limits.maxPages or tags[2]." },
        { name: "parseJsonValue / formatJsonValue", type: "(v) => unknown / (v) => string", description: "Parse JSON strings; show values as indented JSON." },
      ],
    },
  ],
  a11y: [
    "The diff is a <table> captioned by label; in unified mode its column headers are visually hidden, in split mode they read Before / After.",
    "Every changed line or key has a visible sign (+, − or ~) and a hidden word (“Added:”, “Removed:”, “Changed:”); the tints are extra.",
    "A summary above the diff says how much changed (“2 lines added, 2 removed”, “5 changes: 2 added, 1 removed, 2 changed”).",
    "The table scrolls in a ScrollArea that becomes a focusable, named region when it overflows. Folded lines expand with a real button.",
    "The Unified / Split switch is a named toggle group (aria-pressed).",
  ],
};

export default doc;
