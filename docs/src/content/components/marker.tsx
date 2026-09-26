import { Check, FileText, GitBranch } from "lucide-react";
import { Marker, MarkerContent, MarkerIcon } from "@/registry/bitop/ui/marker/marker";
import { Message, MessageContent } from "@/registry/bitop/ui/message/message";
import { Spinner } from "@/registry/bitop/ui/spinner/spinner";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./marker.tsx?raw";

export function Thread() {
  return (
    <div className={styles.stack}>
      <Marker variant="separator">
        <MarkerContent>Today</MarkerContent>
      </Marker>
      <Message from="user">
        <MessageContent>Why is the checkout build failing?</MessageContent>
      </Message>
      <Marker>
        <MarkerIcon>
          <FileText />
        </MarkerIcon>
        <MarkerContent>Explored 4 files</MarkerContent>
      </Marker>
      <Marker>
        <MarkerIcon>
          <Check />
        </MarkerIcon>
        <MarkerContent>Ran the test suite</MarkerContent>
      </Marker>
      <Marker role="status">
        <MarkerIcon>
          <Spinner size="sm" />
        </MarkerIcon>
        <MarkerContent>Reading the build log…</MarkerContent>
      </Marker>
    </div>
  );
}

export function Variants() {
  return (
    <div className={styles.stack}>
      <Marker variant="border">
        <MarkerContent>Conversation started from the #deploys channel</MarkerContent>
      </Marker>
      <Marker render={<a href="#variants" />}>
        <MarkerIcon>
          <GitBranch />
        </MarkerIcon>
        <MarkerContent>Branched from “Fix checkout build”</MarkerContent>
      </Marker>
      <Marker variant="separator">
        <MarkerContent>Earlier messages</MarkerContent>
      </Marker>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "marker",
  title: "Marker",
  category: "AI",
  description: "An inline row in a conversation or activity feed: a status update, a system note, a bordered row or a labelled separator.",
  imports: `import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker/marker";`,
  examples: examples(raw, [
    ["Thread", Thread, { title: "In a conversation", wide: true }],
    ["Variants", Variants, { title: "Border, link and separator", wide: true }],
  ]),
  props: [
    {
      component: "Marker",
      note: "Also accepts native <div> props (pass role=\"status\" for markers whose text changes).",
      rows: [
        { name: "variant", type: '"default" | "border" | "separator"', default: '"default"', description: "Inline row, row with a bottom border, or centred label between lines." },
        { name: "render", type: "ReactElement", description: "Render a link, button or router <Link /> instead of a <div>." },
      ],
    },
    { component: "MarkerIcon", rows: [{ name: "children", type: "ReactNode", description: "Decorative icon (the slot is aria-hidden)." }] },
    { component: "MarkerContent", rows: [{ name: "children", type: "ReactNode", description: "The marker text." }] },
  ],
  a11y: [
    "The icon slot is hidden from assistive technology; the text carries the meaning, so status is never icon- or colour-only.",
    'Give in-progress markers role="status" so text updates are announced politely.',
    "Separator lines are CSS pseudo-elements; the label is plain text.",
    "Muted text meets 4.5:1; link markers are underlined and get the standard focus ring.",
  ],
};

export default doc;
