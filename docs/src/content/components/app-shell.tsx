import { Bell, Boxes, FileText, Globe, Home, KeyRound, LayoutDashboard, Layers, LogOut, Plus, Rocket, Settings, Shield, Users } from "lucide-react";
import {
  AppShell,
  Brand,
  Main,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarModeSwitch,
  SidebarNav,
  SidebarSection,
  SidebarUser,
  TopBar,
  WorkspaceSwitcher,
} from "@/registry/bitop/ui/app-shell/app-shell";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { CommandPaletteTrigger } from "@/registry/bitop/ui/command-palette/command-palette";
import { MenuGroup, MenuHeader, MenuItem, MenuSeparator } from "@/registry/bitop/ui/menu/menu";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { useState } from "react";
import { type ComponentDoc, examples } from "../types";
import styles from "./app-shell.module.css";
import raw from "./app-shell.tsx?raw";

export function Dashboard() {
  return (
    <div className={styles.frame}>
      <AppShell
        skipTo={null}
        className={styles.shell}
        sidebar={
          <Sidebar label="App sidebar (example)" className={styles.sidebar}>
            <SidebarHeader>
              <Brand name="Acme Cloud" href="#dashboard" />
              <SidebarModeSwitch
                label="Portal"
                items={[
                  { label: "Workspace", icon: <LayoutDashboard aria-hidden />, href: "#dashboard", current: true },
                  { label: "Admin", icon: <Shield aria-hidden />, href: "#dashboard", current: false },
                ]}
              />
              <WorkspaceSwitcher name="Acme Inc" description="Owner">
                <MenuGroup label="Workspaces">
                  <MenuItem icon={<Boxes aria-hidden />}>Acme Inc</MenuItem>
                  <MenuItem icon={<Boxes aria-hidden />}>Side project</MenuItem>
                </MenuGroup>
                <MenuSeparator />
                <MenuItem icon={<Plus aria-hidden />}>New workspace</MenuItem>
              </WorkspaceSwitcher>
            </SidebarHeader>
            <SidebarContent>
              <SidebarNav aria-label="Workspace (example)">
                <SidebarSection>
                  <SidebarItem href="#dashboard" icon={<Home aria-hidden />} label="Overview" current />
                  <SidebarItem href="#dashboard" icon={<Rocket aria-hidden />} label="Deployments" trailing="12" />
                  <SidebarItem href="#dashboard" icon={<Layers aria-hidden />} label="Projects" />
                  <SidebarItem href="#dashboard" icon={<KeyRound aria-hidden />} label="API tokens" dot />
                </SidebarSection>
                <SidebarSection label="Settings">
                  <SidebarItem href="#dashboard" icon={<Users aria-hidden />} label="Members" />
                  <SidebarItem href="#dashboard" icon={<Settings aria-hidden />} label="General" />
                </SidebarSection>
              </SidebarNav>
            </SidebarContent>
            <SidebarFooter>
              <SidebarUser name="Ada Lovelace" email="ada@example.com">
                <MenuHeader>
                  <strong>Ada Lovelace</strong>
                  ada@example.com
                </MenuHeader>
                <MenuSeparator />
                <MenuItem icon={<Settings aria-hidden />}>Preferences</MenuItem>
                <MenuItem icon={<LogOut aria-hidden />}>Sign out</MenuItem>
              </SidebarUser>
            </SidebarFooter>
          </Sidebar>
        }
        topbar={
          <TopBar
            className={styles.topbar}
            start={<Breadcrumbs label="Breadcrumb (shell example)" items={[{ label: "Acme Inc", href: "#dashboard" }, { label: "Overview" }]} />}
            end={
              <>
                <CommandPaletteTrigger onClick={() => toast.info("Open your CommandPalette here")} label="Search…" />
                <IconButton icon={<Bell aria-hidden />} label="Notifications" />
              </>
            }
          />
        }
      >
        <Main id="shell-example-main" render={<div />}>
          <PageHeader title="Overview" titleAs="h3" description="Your workspace at a glance." />
          <div className={styles.stats}>
            <StatCard label="Projects" value="8" icon={<Layers />} />
            <StatCard label="Deployments" value="1,284" icon={<Rocket />} delta={{ value: "12%", trend: "up" }} />
            <StatCard label="Visitors today" value="12,902" icon={<Globe />} />
            <StatCard label="Open incidents" value="0" icon={<FileText />} hint="Last 30 days" />
          </div>
        </Main>
      </AppShell>
    </div>
  );
}

export function CollapsibleSections() {
  const [open, setOpen] = useState<Record<string, boolean>>({ Settings: true });
  const section = (label: string) => ({ collapsible: true, open: open[label] ?? false, onOpenChange: (o: boolean) => setOpen((s) => ({ ...s, [label]: o })) });
  return (
    <div className={styles.frameShort}>
      <Sidebar label="Sidebar with collapsible sections (example)" className={styles.sidebar}>
        <SidebarContent>
          <SidebarNav aria-label="Admin (example)">
            <SidebarSection>
              <SidebarItem href="#dashboard" icon={<Home aria-hidden />} label="Overview" />
            </SidebarSection>
            <SidebarSection label="People" {...section("People")}>
              <SidebarItem href="#dashboard" icon={<Users aria-hidden />} label="Users" />
            </SidebarSection>
            <SidebarSection label="Settings" {...section("Settings")}>
              <SidebarItem href="#dashboard" icon={<Settings aria-hidden />} label="General" current />
              <SidebarItem href="#dashboard" icon={<KeyRound aria-hidden />} label="API tokens" />
            </SidebarSection>
            <SidebarSection label="Recent">
              <SidebarItem href="#dashboard" icon={<FileText aria-hidden />} label="Quarterly report" description="Finance · yesterday" />
              <SidebarItem href="#dashboard" icon={<FileText aria-hidden />} label="Quarterly report" description="Sales · last week" />
            </SidebarSection>
          </SidebarNav>
        </SidebarContent>
      </Sidebar>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "app-shell",
  title: "App shell",
  category: "Layout",
  description:
    "Generic application chrome: a collapsible sidebar (brand, mode switch, workspace switcher, sections, user menu), a top bar and a main landmark with a skip link.",
  imports: `import {
  AppShell, Brand, Main, Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarItem, SidebarModeSwitch, SidebarNav, SidebarSection, SidebarToggle,
  SidebarUser, TopBar, WorkspaceSwitcher, useAppShell,
} from "@/components/ui/app-shell/app-shell";`,
  examples: examples(raw, [
    [
      "Dashboard",
      Dashboard,
      {
        title: "Dashboard",
        description: "Use the toggle at the top left to collapse the sidebar; collapsed labels become tooltips. In an app, drop skipTo={null} and render={<div />} and let the shell fill the viewport.",
        wide: true,
      },
    ],
    [
      "CollapsibleSections",
      CollapsibleSections,
      {
        title: "Collapsible sections and two-line items",
        description:
          "A long sidebar keeps the current page's section and the top section open and the others collapsed to their headers; remember the choice. The current item scrolls into view. Items with the same label get a description.",
      },
    ],
  ]),
  props: [
    {
      component: "AppShell",
      rows: [
        { name: "sidebar / topbar", type: "ReactNode", description: "Usually <Sidebar> and <TopBar>." },
        { name: "collapsed / defaultCollapsed / onCollapsedChange", type: "boolean / boolean / (c) => void", description: "Sidebar state." },
        { name: "skipTo", type: "string | null", default: '"main"', description: "Skip-link target id; null omits the link." },
        {
          name: "drawerQuery / drawerLabel",
          type: "string | null / string",
          default: 'SIDEBAR_DRAWER_QUERY (600px) / "Navigation"',
          description: "Below this width there is no rail: the sidebar is a modal drawer opened from the toggle. null keeps the rail on every width.",
        },
      ],
    },
    {
      component: "Sidebar / SidebarContent",
      note: "Sidebar is an <aside> with SidebarHeader, SidebarContent and SidebarFooter. SidebarContent scrolls in a ScrollArea, so the header and the footer's account menu stay pinned at short heights.",
      rows: [
        { name: "label (Sidebar)", type: "string", default: '"Sidebar"', description: "Names the complementary landmark; give each sidebar on a page its own name." },
        { name: "scrollLabel (SidebarContent)", type: "string", default: '"Sidebar navigation"', description: "Names the scroll region when the content overflows (it then becomes focusable)." },
      ],
    },
    {
      component: "SidebarItem",
      rows: [
        { name: "label", type: "ReactNode", required: true, description: "Text; becomes a tooltip when collapsed." },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
        { name: "href / render", type: "string / RenderProp", description: "Plain link or router link." },
        { name: "current", type: "boolean", description: 'aria-current="page" for plain links.' },
        { name: "trailing", type: "ReactNode", description: "Count or badge." },
        { name: "dot", type: "boolean", description: 'Decorative "new" dot (say it in the label if it matters).' },
        { name: "description", type: "ReactNode", description: "A muted second line, e.g. to tell items with the same label apart." },
      ],
    },
    {
      component: "SidebarSection",
      rows: [
        { name: "label", type: "ReactNode", description: "Small uppercase heading of the list." },
        { name: "collapsible", type: "boolean", description: "The label becomes a button that shows or hides the items (all items show on the icon rail)." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", default: "– / true / –", description: "Open state of a collapsible section." },
      ],
    },
    {
      component: "Brand",
      rows: [
        { name: "name", type: "ReactNode", required: true, description: "Product name (link text)." },
        { name: "logo", type: "ReactNode", description: "Your logo; defaults to a primary tile with a highlight accent." },
        { name: "href / render", type: "string / RenderProp", default: '"/"', description: "Home link." },
      ],
    },
    {
      component: "SidebarModeSwitch",
      rows: [
        { name: "label", type: "string", required: true, description: "Name of the small navigation landmark." },
        { name: "items", type: "{ label, icon, href?, render?, current }[]", required: true, description: "Top-level modes, e.g. Workspace and Admin." },
      ],
    },
    {
      component: "WorkspaceSwitcher / SidebarUser",
      note: "Children are Menu content (MenuItem, MenuGroup, MenuSeparator, MenuHeader).",
      rows: [
        { name: "name", type: "string", required: true, description: "Workspace or user name." },
        { name: "description / email", type: "ReactNode / string", description: "Second line." },
        { name: "avatarSrc", type: "string", description: "SidebarUser only." },
      ],
    },
    {
      component: "TopBar",
      rows: [
        { name: "start / end", type: "ReactNode", description: "Left (breadcrumbs) and right (search, actions) content." },
        { name: "sidebarToggle", type: "boolean", default: "true", description: "Show the collapse button." },
      ],
    },
    {
      component: "Main",
      rows: [
        { name: "id", type: "string", default: '"main"', description: "Skip-link target." },
        { name: "contained", type: "boolean", default: "true", description: "Wrap in the 1200px Container." },
        { name: "render", type: "ReactElement", description: "Render another element (e.g. inside a page's <main>)." },
      ],
    },
  ],
  a11y: [
    "A skip link to #main is the first focusable element; Main is focusable (tabIndex -1) so the skip lands there.",
    "The sidebar is an <aside> landmark named by label (default “Sidebar”); inside it, the navigation is a named <nav>, sections are labelled lists and the current page has aria-current=\"page\".",
    "The sidebar content scrolls on its own (a ScrollArea that becomes a focusable, named region only when it overflows), so the account menu in the footer is always reachable.",
    "The collapse toggle has aria-expanded and aria-controls; collapsed labels stay in the accessibility tree and show as tooltips.",
    "On a narrow window (below 600px) the same toggle (“Open navigation”) opens the sidebar as a modal dialog: focus moves into it and returns to the toggle; Escape, the backdrop, its close button or following a link close it.",
    "A collapsible section's heading is a button with aria-expanded and aria-controls; its list is hidden (not just invisible) while closed.",
    "The workspace switcher and user menu announce their purpose (“Current workspace: …”, “Account: …”).",
  ],
};

export default doc;
