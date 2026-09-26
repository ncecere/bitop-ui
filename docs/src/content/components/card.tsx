import { Avatar } from "@/registry/bitop/ui/avatar/avatar";
import { Badge } from "@/registry/bitop/ui/badge/badge";
import { Button } from "@/registry/bitop/ui/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/registry/bitop/ui/card/card";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./card.tsx?raw";

export function Shorthand() {
  return (
    <Card title="Members" titleAs="h4" description="People who can access this workspace." actions={<Button size="sm" variant="secondary">Invite</Button>}>
      <Stack gap={3} render={<ul style={{ listStyle: "none", padding: 0 }} />}>
        {[
          ["Ada Lovelace", "Owner"],
          ["Grace Hopper", "Admin"],
          ["Alan Turing", "Member"],
        ].map(([name, role]) => (
          <Inline key={name} gap={3} render={<li />}>
            <Avatar name={name!} size="sm" decorative />
            <span style={{ flex: 1 }}>{name}</span>
            <Badge variant="outline">{role}</Badge>
          </Inline>
        ))}
      </Stack>
    </Card>
  );
}

export function Composable() {
  return (
    <Card aria-label="Danger zone">
      <CardHeader title="Danger zone" titleAs="h4" description="Archiving makes the project read-only." />
      <CardBody>
        <p>Deployments stay online, but settings and environment variables can't be changed.</p>
      </CardBody>
      <CardFooter>
        <Button variant="danger" size="sm">
          Archive project
        </Button>
      </CardFooter>
    </Card>
  );
}

const doc: ComponentDoc = {
  slug: "card",
  title: "Card",
  category: "Display",
  description: "A raised surface with a hairline ring. Use the shorthand props or compose CardHeader, CardBody and CardFooter.",
  imports: `import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card/card";`,
  examples: examples(raw, [
    ["Shorthand", Shorthand, { title: "Shorthand", wide: true }],
    ["Composable", Composable, { title: "Composable", wide: true }],
  ]),
  props: [
    {
      component: "Card",
      note: "Also accepts native <section> props.",
      rows: [
        { name: "title", type: "ReactNode", description: "Renders a CardHeader and wraps children in CardBody." },
        { name: "description", type: "ReactNode", description: "Muted text under the title." },
        { name: "actions", type: "ReactNode", description: "Header actions on the right." },
        { name: "titleAs", type: '"h2" | "h3" | "h4"', default: '"h2"', description: "Heading level; match your page outline." },
        { name: "footer", type: "ReactNode", description: "Footer content." },
        { name: "flush", type: "boolean", description: "Remove body padding (full-bleed tables)." },
        { name: "interactive", type: "boolean", description: "Lift slightly on hover." },
      ],
    },
  ],
  a11y: [
    "A card with a title is a <section> labelled by its heading, so it shows up as a region.",
    "Pick titleAs so headings follow the page outline.",
    "Without a title, pass aria-label if the card should be a named region.",
  ],
};

export default doc;
