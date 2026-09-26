import { BookOpen, Boxes, GitBranch, Globe, LifeBuoy, Rocket, ShieldCheck } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/bitop/ui/navigation-menu/navigation-menu";
import { Link, useRouter } from "../../router";
import { type ComponentDoc, examples } from "../types";
import raw from "./navigation-menu.tsx?raw";

export function SiteNavigation() {
  return (
    <NavigationMenu aria-label="Product (example)">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent columns={2}>
            <NavigationMenuLink href="#site-navigation" icon={<Rocket aria-hidden />} description="Build and ship every push.">
              Deployments
            </NavigationMenuLink>
            <NavigationMenuLink href="#site-navigation" icon={<Globe aria-hidden />} description="Serve from 40 regions.">
              Edge network
            </NavigationMenuLink>
            <NavigationMenuLink href="#site-navigation" icon={<GitBranch aria-hidden />} description="A URL for every branch.">
              Previews
            </NavigationMenuLink>
            <NavigationMenuLink href="#site-navigation" icon={<ShieldCheck aria-hidden />} description="Firewall and bot protection.">
              Security
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#site-navigation" icon={<BookOpen aria-hidden />} description="Guides and API reference.">
              Documentation
            </NavigationMenuLink>
            <NavigationMenuLink href="#site-navigation" icon={<Boxes aria-hidden />} description="Starter projects.">
              Templates
            </NavigationMenuLink>
            <NavigationMenuLink href="#site-navigation" icon={<LifeBuoy aria-hidden />} description="Talk to a person.">
              Support
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#site-navigation">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function RouterLinks() {
  const { path } = useRouter();
  const pages = [
    { to: "/components/navigation-menu", label: "Navigation menu" },
    { to: "/components/menubar", label: "Menubar" },
    { to: "/components/breadcrumbs", label: "Breadcrumbs" },
  ];
  return (
    <NavigationMenu aria-label="Navigation components (example)">
      <NavigationMenuList>
        {pages.map((p) => (
          <NavigationMenuItem key={p.to}>
            <NavigationMenuLink render={<Link to={p.to} />} active={path === p.to}>
              {p.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Overlays</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink render={<Link to="/components/drawer" />} closeOnClick description="Swipeable edge panel.">
              Drawer
            </NavigationMenuLink>
            <NavigationMenuLink render={<Link to="/components/sheet" />} closeOnClick description="Edge-attached dialog.">
              Sheet
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const doc: ComponentDoc = {
  slug: "navigation-menu",
  title: "Navigation menu",
  category: "Navigation",
  description:
    "Site navigation with top-level links and triggers that reveal content panels in one shared, animated popup. Links take render for client-side routing and active for the current page.",
  imports: `import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu/navigation-menu";`,
  baseUi: { name: "Navigation Menu", href: "https://base-ui.com/react/components/navigation-menu" },
  examples: examples(raw, [
    ["SiteNavigation", SiteNavigation, { title: "Site navigation", description: "Hover or click a trigger; the popup resizes and slides between panels." }],
    ["RouterLinks", RouterLinks, { title: "Router links", description: "render={<Link to=… />} keeps client-side routing; active marks the current page." }],
  ]),
  props: [
    {
      component: "NavigationMenu",
      note: "Also accepts Base UI NavigationMenu.Root props (value, defaultValue, onValueChange, delay, closeDelay, orientation) and native <nav> props such as aria-label.",
      rows: [
        { name: "align", type: '"start" | "center" | "end"', default: '"start"', description: "Popup alignment against the active trigger." },
        { name: "sideOffset", type: "number", default: "8", description: "Gap between trigger and popup in px." },
      ],
    },
    { component: "NavigationMenuList / NavigationMenuItem", note: "The <ul> and its <li>s. Items take an optional value for controlled use.", rows: [] },
    { component: "NavigationMenuTrigger", note: "A button with a chevron; opens its item's content. Base UI Trigger props.", rows: [] },
    {
      component: "NavigationMenuContent",
      rows: [{ name: "columns", type: "1 | 2 | 3", default: "1", description: "Grid columns for the panel (one column on narrow screens)." }],
    },
    {
      component: "NavigationMenuLink",
      note: "Also accepts Base UI NavigationMenu.Link props and <a> props (href…).",
      rows: [
        { name: "render", type: "ReactElement | function", description: "Render a router link, e.g. <Link to=… />." },
        { name: "active", type: "boolean", description: 'Current page: sets aria-current="page".' },
        { name: "closeOnClick", type: "boolean", default: "false", description: "Close the popup when followed (useful for client-side routing)." },
        { name: "description", type: "ReactNode", description: "Supporting text under the title (panel links)." },
        { name: "icon", type: "ReactNode", description: "Decorative leading icon (panel links)." },
      ],
    },
  ],
  a11y: [
    "Renders a <nav> landmark; give it an aria-label when the page has more than one navigation.",
    "Triggers are buttons with aria-expanded; ArrowDown opens the focused trigger's panel, Tab moves into it and on to the next trigger, Escape closes it and returns focus.",
    "Links are ordinary links: Enter follows them, and active adds aria-current=\"page\". The current page is shown by an underline as well as colour.",
    "Panel transitions are switched off under prefers-reduced-motion.",
  ],
};

export default doc;
