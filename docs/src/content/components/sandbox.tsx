import { RotateCw } from "lucide-react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import {
  Sandbox,
  SandboxCode,
  SandboxContent,
  SandboxHeader,
  SandboxOutput,
  SandboxTab,
  SandboxTabPanel,
  SandboxTabs,
  SandboxTabsList,
} from "@/registry/bitop/ui/sandbox/sandbox";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./sandbox.tsx?raw";

const code = `import pandas as pd

df = pd.read_csv("tickets.csv", parse_dates=["opened"])
weekly = df.resample("W", on="opened").size()
print(weekly.tail(4).to_string())`;

export function Completed() {
  return (
    <div className={styles.stack}>
      <Sandbox>
        <SandboxHeader title="weekly_tickets.py" state="completed" summary="1.8 s" />
        <SandboxContent>
          <SandboxTabs defaultValue="output">
            <SandboxTabsList actions={<IconButton size="sm" label="Run again" icon={<RotateCw aria-hidden />} />}>
              <SandboxTab value="code">Code</SandboxTab>
              <SandboxTab value="output">Output</SandboxTab>
            </SandboxTabsList>
            <SandboxTabPanel value="code">
              <SandboxCode code={code} language="python" showLineNumbers />
            </SandboxTabPanel>
            <SandboxTabPanel value="output">
              <SandboxOutput output={"opened\n2026-08-30    112\n2026-09-06    138\n2026-09-13    97\n2026-09-20    121"} />
            </SandboxTabPanel>
          </SandboxTabs>
        </SandboxContent>
      </Sandbox>
    </div>
  );
}

export function Failed() {
  return (
    <div className={styles.stack}>
      <Sandbox>
        <SandboxHeader title="weekly_tickets.py" state="error" summary="exit code 1" />
        <SandboxContent>
          <SandboxTabs defaultValue="output">
            <SandboxTabsList>
              <SandboxTab value="code">Code</SandboxTab>
              <SandboxTab value="output">Output</SandboxTab>
            </SandboxTabsList>
            <SandboxTabPanel value="code">
              <SandboxCode code={code} language="python" />
            </SandboxTabPanel>
            <SandboxTabPanel value="output">
              <SandboxOutput errorText={"FileNotFoundError: [Errno 2] No such file or directory: 'tickets.csv'"} />
            </SandboxTabPanel>
          </SandboxTabs>
        </SandboxContent>
      </Sandbox>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "sandbox",
  title: "Sandbox",
  category: "AI",
  description: "A collapsible panel for code the assistant ran in an execution sandbox: a status badge and Code / Output tabs.",
  imports: `import { Sandbox, SandboxCode, SandboxContent, SandboxHeader, SandboxOutput, SandboxTab, SandboxTabPanel, SandboxTabs, SandboxTabsList } from "@/components/ui/sandbox/sandbox";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Completed", Completed, { title: "Completed run", wide: true }],
    ["Failed", Failed, { title: "Error", wide: true }],
  ]),
  props: [
    { component: "Sandbox", note: "Base UI Collapsible.Root props; open by default (defaultOpen = true).", rows: [] },
    {
      component: "SandboxHeader",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "File name or a short title." },
        { name: "state", type: '"pending" | "running" | "completed" | "error"', required: true, description: "Status badge." },
        { name: "stateLabel", type: "string", description: "Override the badge text." },
        { name: "summary", type: "ReactNode", description: 'Short text after the badge, e.g. "exit code 1".' },
        { name: "icon", type: "ReactNode", description: "Decorative icon (default: terminal)." },
      ],
    },
    { component: "SandboxContent", note: "The collapsible panel.", rows: [] },
    { component: "SandboxTabs / SandboxTab / SandboxTabPanel", note: "bitop Tabs, Tab and TabsPanel props (value, defaultValue, onValueChange…).", rows: [] },
    { component: "SandboxTabsList", note: "bitop TabsList props.", rows: [{ name: "actions", type: "ReactNode", description: "Controls on the right of the tab bar." }] },
    { component: "SandboxCode", note: "bitop CodeBlock props; maxHeight defaults to 24rem.", rows: [] },
    {
      component: "SandboxOutput",
      rows: [
        { name: "output", type: "string", description: "stdout / result text." },
        { name: "errorText", type: "ReactNode", description: "stderr or an error, shown in a danger box." },
        { name: "emptyText", type: "ReactNode", default: '"No output"', description: "When there's neither." },
      ],
    },
  ],
  a11y: [
    "The header is a button (aria-expanded) whose name includes the state, e.g. “weekly_tickets.py Completed”.",
    "Code / Output are Base UI tabs: arrow keys switch, the panel is labelled by its tab.",
    "Errors start with visually hidden “Error:” text and an icon, never colour alone; long code and output scroll in focusable blocks.",
  ],
};

export default doc;
