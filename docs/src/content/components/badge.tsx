import { Badge, StatusBadge, StatusDot } from "@/registry/bitop/ui/badge/badge";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./badge.tsx?raw";

export function Tones() {
  return (
    <Stack gap={3} align="center">
      <Inline gap={2}>
        <Badge>Neutral</Badge>
        <Badge tone="info">Info</Badge>
        <Badge tone="success">Success</Badge>
        <Badge tone="warning">Warning</Badge>
        <Badge tone="danger">Danger</Badge>
      </Inline>
      <Inline gap={2}>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="outline" tone="info">
          Beta
        </Badge>
        <Badge size="sm" tone="info">
          sm
        </Badge>
      </Inline>
    </Stack>
  );
}

export function Status() {
  return (
    <Stack gap={3} align="center">
      <Inline gap={2}>
        <StatusBadge tone="success">Live</StatusBadge>
        <StatusBadge tone="info" pulse>
          Building
        </StatusBadge>
        <StatusBadge tone="neutral">Queued</StatusBadge>
        <StatusBadge tone="warning">Degraded</StatusBadge>
        <StatusBadge tone="danger">Failed</StatusBadge>
      </Inline>
      <Inline gap={3}>
        <Inline gap={2}>
          <StatusDot tone="success" /> <span>Healthy</span>
        </Inline>
        <StatusDot tone="danger" pulse label="Gateway down" />
      </Inline>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "badge",
  title: "Badge",
  category: "Display",
  description: "Small labels in five tones. StatusBadge adds a status dot (optionally pulsing); StatusDot is the dot on its own.",
  imports: `import { Badge, StatusBadge, StatusDot } from "@/components/ui/badge/badge";`,
  examples: examples(raw, [
    ["Tones", Tones, { title: "Tones, variants and sizes" }],
    ["Status", Status, { title: "Status", description: "Status is always shown with text, never by colour alone." }],
  ]),
  props: [
    {
      component: "Badge",
      note: "Also accepts native <span> props. StatusBadge takes the same props (without dot).",
      rows: [
        { name: "tone", type: '"neutral" | "info" | "success" | "warning" | "danger"', default: '"neutral"', description: "Colour." },
        { name: "variant", type: '"soft" | "outline"', default: '"soft"', description: "Tinted fill or hairline ring." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Height and padding." },
        { name: "dot", type: "boolean", description: "Leading status dot." },
        { name: "pulse", type: "boolean", description: "Pulse the dot (in-progress states)." },
      ],
    },
    {
      component: "StatusDot",
      rows: [
        { name: "tone", type: "Tone", default: '"neutral"', description: "Colour." },
        { name: "pulse", type: "boolean", description: "Pulse (off under reduced motion)." },
        { name: "label", type: "string", description: "Accessible text; without it the dot is decorative." },
      ],
    },
  ],
  a11y: [
    "Soft badge text meets 4.5:1 on its tint in every theme.",
    "A bare StatusDot is aria-hidden unless you give it a label; put the status in adjacent text otherwise.",
    "The pulse animation is disabled by prefers-reduced-motion.",
  ],
};

export default doc;
