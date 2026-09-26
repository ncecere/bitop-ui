import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { OpenInChat, OpenInChatItem, openInChatProviders } from "@/registry/bitop/ui/open-in-chat/open-in-chat";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./open-in-chat.tsx?raw";

export function Default() {
  return <OpenInChat query="Summarise the key changes in the 2026 parental leave policy." />;
}

export function CustomProviders() {
  const [last, setLast] = useState<string | null>(null);
  const campusAi = {
    id: "campus-ai",
    title: "Open in Campus AI",
    icon: <GraduationCap aria-hidden />,
    createUrl: (q: string) => `https://ai.example.edu/chat?${new URLSearchParams({ prompt: q })}`,
  };
  return (
    <div className={styles.row}>
      <OpenInChat
        query="Draft a friendly reminder about the timesheet deadline."
        providers={[campusAi, "claude", "chatgpt"]}
        groupLabel="Open this prompt in"
        trigger={<Button variant="ghost">Continue elsewhere</Button>}
        onOpen={(provider) => setLast(provider.title)}
      >
        <OpenInChatItem provider={openInChatProviders.v0} query="Build a timesheet reminder banner" />
      </OpenInChat>
      <span className={styles.muted}>{last ? `Last opened: ${last}` : "Nothing opened yet"}</span>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "open-in-chat",
  title: "Open in chat",
  category: "AI",
  description: "A menu of links that open the current prompt in another chat app (ChatGPT, Claude, v0, Cursor…). Providers are configurable URL builders.",
  imports: `import { OpenInChat, OpenInChatItem, openInChatProviders } from "@/components/ui/open-in-chat/open-in-chat";`,
  baseUi: { name: "Menu", href: "https://base-ui.com/react/components/menu" },
  examples: examples(raw, [
    ["Default", Default, { title: "Default providers" }],
    ["CustomProviders", CustomProviders, { title: "Custom providers, trigger and extra items" }],
  ]),
  props: [
    {
      component: "OpenInChat",
      note: "Also: open / defaultOpen / onOpenChange / side / align (bitop Menu).",
      rows: [
        { name: "query", type: "string", required: true, description: "The prompt to open." },
        { name: "providers", type: "(OpenInChatProviderId | OpenInChatProvider)[]", default: '["chatgpt", "claude", "v0"]', description: "Built-in ids (chatgpt, claude, v0, cursor, t3, scira) or { id, title, createUrl, icon? }." },
        { name: "trigger", type: "ReactElement", description: 'Trigger element (default: a secondary "Open in chat" button).' },
        { name: "label", type: "ReactNode", default: '"Open in chat"', description: "Text of the default trigger." },
        { name: "groupLabel", type: "ReactNode", description: "Optional heading inside the menu." },
        { name: "onOpen", type: "(provider, url) => void", description: "Called when an item is chosen; the link still opens." },
        { name: "children", type: "ReactNode", description: "Extra items after the providers." },
      ],
    },
    {
      component: "OpenInChatItem",
      rows: [
        { name: "provider", type: "OpenInChatProviderId | OpenInChatProvider", required: true, description: "Which provider to link to." },
        { name: "query", type: "string", description: "Override the menu's prompt for this item." },
      ],
    },
  ],
  a11y: [
    "Base UI Menu: the trigger has aria-haspopup and aria-expanded; ↑/↓ move, typeahead jumps, Esc closes and returns focus.",
    "Items are real links (target=_blank, rel=noopener noreferrer) with visually hidden “(opens in a new tab)” text; the external-link icon is decorative.",
  ],
};

export default doc;
