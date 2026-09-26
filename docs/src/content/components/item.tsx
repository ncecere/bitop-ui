import { BadgeCheck, ChevronRight, CreditCard, GitBranch, KeyRound, MessageSquare } from "lucide-react";
import { Button } from "@/registry/bitop/ui/button/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/registry/bitop/ui/item/item";
import { type ComponentDoc, examples } from "../types";
import raw from "./item.tsx?raw";

export function Integrations() {
  return (
    <ItemGroup aria-label="Integrations">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <GitBranch aria-hidden />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>GitHub</ItemTitle>
          <ItemDescription>Deploy on every push and comment preview links on pull requests.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="secondary">
            Configure
          </Button>
        </ItemActions>
      </Item>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <MessageSquare aria-hidden />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Slack</ItemTitle>
          <ItemDescription>Post deployment and incident updates to a channel.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm">Connect</Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  );
}

export function LinkList() {
  return (
    <ItemGroup aria-label="Account settings">
      <Item size="sm" render={<a href="#billing" />}>
        <ItemMedia>
          <CreditCard aria-hidden />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Billing</ItemTitle>
        </ItemContent>
        <ChevronRight aria-hidden size={16} />
      </Item>
      <ItemSeparator />
      <Item size="sm" render={<a href="#tokens" />}>
        <ItemMedia>
          <KeyRound aria-hidden />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>API tokens</ItemTitle>
        </ItemContent>
        <ChevronRight aria-hidden size={16} />
      </Item>
    </ItemGroup>
  );
}

export function Muted() {
  return (
    <Item variant="muted" size="xs">
      <ItemMedia>
        <BadgeCheck aria-hidden />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Your email address is verified.</ItemTitle>
      </ItemContent>
    </Item>
  );
}

const doc: ComponentDoc = {
  slug: "item",
  title: "Item",
  category: "Display",
  description: "A flexible row with media, a title, a description and actions, for settings lists, integrations and link lists.",
  imports: `import {
  Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup,
  ItemHeader, ItemMedia, ItemSeparator, ItemTitle,
} from "@/components/ui/item/item";`,
  examples: examples(raw, [
    ["Integrations", Integrations, { title: "Outline items with actions", wide: true }],
    ["LinkList", LinkList, { title: "Link items (render)", wide: true }],
    ["Muted", Muted, { title: "Muted, extra small", wide: true }],
  ]),
  props: [
    {
      component: "Item",
      note: "Also accepts native <div> props.",
      rows: [
        { name: "variant", type: '"default" | "outline" | "muted"', default: '"default"', description: "Surface style." },
        { name: "size", type: '"md" | "sm" | "xs"', default: '"md"', description: "Padding and gap." },
        { name: "render", type: "ReactElement | (props) => ReactElement", description: "Render a link or router <Link /> instead of a <div>." },
      ],
    },
    { component: "ItemMedia", rows: [{ name: "variant", type: '"default" | "icon" | "image"', default: '"default"', description: "Icon tile or cropped image." }] },
    {
      component: "ItemGroup",
      note: "ItemContent, ItemTitle, ItemDescription, ItemActions, ItemHeader, ItemFooter and ItemSeparator accept their native element props.",
      rows: [{ name: "aria-label", type: "string", description: "Names the list when the context doesn't." }],
    },
  ],
  a11y: [
    'ItemGroup is a list; each Item inside it is wrapped in a listitem, so link items keep role="link".',
    "Link items are a single focusable link: don't nest other controls inside them.",
    "ItemSeparator is decorative and hidden from assistive technology.",
    "Mark icons in ItemMedia aria-hidden; the title carries the meaning.",
  ],
};

export default doc;
