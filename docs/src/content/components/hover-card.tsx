import { CalendarDays, GitFork, Star } from "lucide-react";
import { Avatar } from "@/registry/bitop/ui/avatar/avatar";
import { HoverCard } from "@/registry/bitop/ui/hover-card/hover-card";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { type ComponentDoc, examples } from "../types";
import styles from "./overlay-examples.module.css";
import raw from "./hover-card.tsx?raw";

export function Profile() {
  return (
    <p>
      Deployed by{" "}
      <HoverCard trigger={<TextLink href="#profile">@ada</TextLink>}>
        <div className={styles.profile}>
          <Avatar name="Ada Lovelace" size="lg" decorative />
          <div className={styles.profileText}>
            <strong>Ada Lovelace</strong>
            Platform engineer. Maintains the build pipeline and the analytical engine.
            <span className={styles.meta}>
              <CalendarDays aria-hidden /> Joined March 2021
            </span>
          </div>
        </div>
      </HoverCard>{" "}
      two hours ago.
    </p>
  );
}

export function Placement() {
  return (
    <div className={styles.row}>
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <HoverCard
          key={side}
          side={side}
          delay={200}
          closeDelay={100}
          trigger={<TextLink href="#placement">bitop/ui ({side})</TextLink>}
        >
          <div className={styles.profileText}>
            <strong>bitop/ui</strong>
            Copy-and-own React components on Base UI and CSS Modules.
            <span className={styles.meta}>
              <Star aria-hidden /> 1.2k <GitFork aria-hidden /> 84
            </span>
          </div>
        </HoverCard>
      ))}
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "hover-card",
  title: "Hover card",
  category: "Overlays",
  description:
    "A preview of a link's destination (a profile, a repository, a document) that appears when the link is hovered or focused, after a short delay.",
  imports: `import { HoverCard } from "@/components/ui/hover-card/hover-card";`,
  baseUi: { name: "Preview Card", href: "https://base-ui.com/react/components/preview-card" },
  examples: examples(raw, [
    ["Profile", Profile, { title: "Profile preview" }],
    ["Placement", Placement, { title: "Placement and delays", description: "side / align position the card; delay and closeDelay are in milliseconds." }],
  ]),
  props: [
    {
      component: "HoverCard",
      rows: [
        { name: "trigger", type: "ReactElement", required: true, description: "The link that opens the card (TextLink, <a> or a router link)." },
        { name: "children", type: "ReactNode", required: true, description: "The preview content." },
        { name: "delay", type: "number", default: "600", description: "Hover time before it opens (ms)." },
        { name: "closeDelay", type: "number", default: "300", description: "Time before it closes after the pointer leaves (ms)." },
        { name: "side / align", type: '"top" | "bottom" | "left" | "right" / "start" | "center" | "end"', default: '"bottom" / "center"', description: "Placement." },
        { name: "sideOffset", type: "number", default: "8", description: "Gap from the trigger in px." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Controlled or uncontrolled state." },
      ],
    },
  ],
  a11y: [
    "The trigger stays an ordinary link: its text is its accessible name and Enter follows it.",
    "The card is a visual enhancement for pointer and keyboard-focus users only. It is not announced or reachable by keyboard, touch or screen readers, so keep it free of controls and essential information, and show everything it contains at the link's destination too.",
    "Opening waits for a delay so moving the pointer across a page doesn't flash cards.",
  ],
};

export default doc;
