import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Checklist, type ChecklistStep } from "@/registry/bitop/ui/checklist/checklist";
import { type ComponentDoc, examples } from "../types";
import raw from "./checklist.tsx?raw";

export function GettingStarted() {
  const [done, setDone] = useState<string[]>(["source"]);
  const [dismissed, setDismissed] = useState(false);
  const finish = (id: string) => setDone((d) => [...d, id]);
  const steps: ChecklistStep[] = [
    { id: "source", title: "Add a data source", description: "A website to crawl or files to upload.", done: done.includes("source") },
    {
      id: "kb",
      title: "Create a knowledge base",
      description: "Group sources that answer the same kind of question.",
      done: done.includes("kb"),
      action: { label: "Create knowledge base", onClick: () => finish("kb") },
    },
    {
      id: "agent",
      title: "Build an agent",
      description: "Pick a model and the knowledge bases it may search.",
      done: done.includes("agent"),
      action: { label: "New agent", onClick: () => finish("agent") },
    },
    {
      id: "share",
      title: "Share it with your team",
      done: done.includes("share"),
      action: { label: "Open Share", href: "#getting-started" },
    },
  ];
  if (dismissed) {
    return (
      <Button variant="secondary" onClick={() => setDismissed(false)}>
        Show “Get started” again
      </Button>
    );
  }
  return (
    <Checklist
      title="Get started"
      description="Four steps to your first answering agent."
      steps={steps}
      onDismiss={() => setDismissed(true)}
      complete="All set. Your agent is ready to answer questions."
    />
  );
}

export function AdminSetup() {
  const steps: ChecklistStep[] = [
    { id: "conn", title: "Connect a model provider", done: true },
    { id: "chat", title: "Add a chat model", done: true },
    { id: "embed", title: "Add an embedding model", done: false, action: { label: "Add model", href: "#admin-setup" } },
    { id: "profile", title: "Choose a default embedding profile", done: false, action: { label: "Profiles", href: "#admin-setup" } },
    { id: "team", title: "Create the first team", done: false, action: { label: "New team", href: "#admin-setup" } },
  ];
  return <Checklist title="Finish setting up" headingLevel={3} steps={steps} hideProgress />;
}

const doc: ComponentDoc = {
  slug: "checklist",
  title: "Checklist",
  category: "Display",
  description: "Onboarding steps with done states: a titled list with a “2 of 4 done” summary, one link or button per step, the current step highlighted, and an optional dismiss button.",
  imports: `import { Checklist, type ChecklistStep } from "@/components/ui/checklist/checklist";`,
  examples: examples(raw, [
    ["GettingStarted", GettingStarted, { title: "Getting started (dismissible)", description: "Finish the steps to see the completion message.", wide: true }],
    ["AdminSetup", AdminSetup, { title: "Setup list with links", wide: true }],
  ]),
  props: [
    {
      component: "Checklist",
      note: "Also accepts <section> props.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Heading; names the section." },
        { name: "steps", type: "ChecklistStep[]", required: true, description: "{ id, title, description?, done, action? } in order." },
        { name: "description", type: "ReactNode", description: "Muted text under the title." },
        { name: "headingLevel", type: "2 | 3 | 4", default: "2", description: "Level of the title heading." },
        { name: "onDismiss", type: "() => void", description: "Adds a Dismiss (×) button; persist the choice yourself." },
        { name: "complete", type: "ReactNode", description: "Shown instead of the progress summary once every step is done." },
        { name: "hideProgress", type: "boolean", default: "false", description: "Text summary only, no bar." },
        { name: "labels", type: "Partial<ChecklistLabels>", description: "Translate the summary, Done / To do and Dismiss." },
      ],
    },
    {
      component: "ChecklistStep.action",
      rows: [
        { name: "{ label, onClick }", type: "object", description: "A button. The current (first open) step's button is primary, the others secondary." },
        { name: "{ label, href } / { label, render }", type: "object", description: "A link, or a router link via render={<Link to=… />}." },
        { name: "ReactNode", type: "element", description: "Any element, for full control. Actions are hidden once the step is done." },
      ],
    },
  ],
  a11y: [
    "A <section> named by its heading, with an ordered list of steps.",
    "Each step's state is read before its title (“Done: Add a data source”, “To do: Build an agent”); the check icon and step number are decorative.",
    "The summary is a labelled progress bar (“2 of 4 done”), or plain text with hideProgress.",
    "The Dismiss button is named after the checklist (“Dismiss Get started”).",
  ],
};

export default doc;
