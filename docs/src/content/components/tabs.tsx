import { NavTab, NavTabs, Tab, Tabs, TabsList, TabsPanel } from "@/registry/bitop/ui/tabs/tabs";
import { type ComponentDoc, examples } from "../types";
import raw from "./tabs.tsx?raw";

export function Underline() {
  return (
    <Tabs defaultValue="deployments">
      <TabsList aria-label="Project views">
        <Tab value="deployments" count={42}>
          Deployments
        </Tab>
        <Tab value="domains">Domains</Tab>
        <Tab value="settings">Settings</Tab>
      </TabsList>
      <TabsPanel value="deployments">
        <p>Deployments panel.</p>
      </TabsPanel>
      <TabsPanel value="domains">
        <p>Domains panel.</p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p>Settings panel.</p>
      </TabsPanel>
    </Tabs>
  );
}

export function Pills() {
  return (
    <Tabs defaultValue="day">
      <TabsList variant="pills" aria-label="Range">
        <Tab value="day">24h</Tab>
        <Tab value="week">7d</Tab>
        <Tab value="month">30d</Tab>
      </TabsList>
    </Tabs>
  );
}

export function RouteTabs() {
  return (
    <NavTabs aria-label="Project sections (example)">
      <NavTab href="#route-tabs" current>
        Overview
      </NavTab>
      <NavTab href="#route-tabs" count={3}>
        Domains
      </NavTab>
      <NavTab href="#route-tabs">Analytics</NavTab>
      <NavTab href="#route-tabs">Settings</NavTab>
    </NavTabs>
  );
}

const doc: ComponentDoc = {
  slug: "tabs",
  title: "Tabs",
  category: "Navigation",
  description: "Tabs switch panels in place (underline or pills). NavTabs look the same but are links between pages.",
  imports: `import { NavTab, NavTabs, Tab, Tabs, TabsList, TabsPanel } from "@/components/ui/tabs/tabs";`,
  baseUi: { name: "Tabs", href: "https://base-ui.com/react/components/tabs" },
  examples: examples(raw, [
    ["Underline", Underline, { title: "Tabs", wide: true }],
    ["Pills", Pills, { title: "Pills" }],
    ["RouteTabs", RouteTabs, { title: "NavTabs (route tabs)", wide: true }],
  ]),
  props: [
    { component: "Tabs", note: "Base UI Tabs.Root props (value, defaultValue, onValueChange, orientation…).", rows: [] },
    { component: "TabsList", rows: [{ name: "variant", type: '"underline" | "pills"', default: '"underline"', description: "Style. Give the list an aria-label." }] },
    {
      component: "Tab",
      rows: [
        { name: "value", type: "any", required: true, description: "Matches a TabsPanel value." },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
        { name: "count", type: "number", description: "Small count after the label." },
      ],
    },
    {
      component: "NavTab",
      note: "Native <a> props plus:",
      rows: [
        { name: "current", type: "boolean", description: 'Sets aria-current="page".' },
        { name: "render", type: "RenderProp", description: "Router link, e.g. <Link to=… />." },
        { name: "icon / count", type: "ReactNode / number", description: "Extras." },
      ],
    },
  ],
  a11y: [
    "Tabs use the tablist/tab/tabpanel pattern: arrow keys move between tabs, and panels are labelled by their tab.",
    "A tab list wider than its container (a phone) scrolls sideways instead of squeezing the tabs: icons keep their size, the edge where tabs are hidden fades out, and arrow keys scroll the focused tab into view.",
    'NavTabs are a <nav> of links with aria-current="page"; don\'t use the tab roles for navigation.',
  ],
};

export default doc;
