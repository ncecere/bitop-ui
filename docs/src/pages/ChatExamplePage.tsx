import { Badge } from "@/registry/bitop/ui/badge/badge";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { ChatDemo } from "../examples/chat-demo";
import raw from "../examples/chat-demo.tsx?raw";
import { C, CodeBlock, DocSection, InstallCommand, Prose } from "../kit/kit";
import { Link } from "../router";
import styles from "./pages.module.css";

const items = [
  "conversation",
  "message",
  "response",
  "inline-citation",
  "reasoning",
  "tool",
  "sources",
  "prompt-input",
  "suggestion",
  "model-selector",
  "context",
];

export function ChatExamplePage() {
  return (
    <article className={styles.page}>
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Docs", render: <Link to="/" /> },
              { label: "Components", render: <Link to="/components" /> },
              { label: "Chat example" },
            ]}
          />
        }
        title="Chat example"
        meta={<Badge variant="outline">AI</Badge>}
        description="A complete retrieval-augmented chat built from the AI items. The response is simulated in the browser: reasoning streams, a search tool runs, and the answer streams with inline citations and sources. Press Stop at any point."
      />

      <DocSection id="demo" title="Demo">
        <ChatDemo />
      </DocSection>

      <DocSection id="installation" title="Installation">
        <InstallCommand items={items} label="install command for the chat items" />
      </DocSection>

      <DocSection id="how-it-works" title="How it fits together">
        <Prose>
          <ul>
            <li>
              <TextLink render={<Link to="/components/conversation" />}>Conversation</TextLink> holds the messages and sticks to the bottom while the answer
              streams; a <C>ConversationAnnouncer</C> tells screen readers when a response starts and finishes, instead of reading every token.
            </li>
            <li>
              Each assistant turn stacks <TextLink render={<Link to="/components/reasoning" />}>Reasoning</TextLink> (opens while thinking, closes when done),{" "}
              <TextLink render={<Link to="/components/tool" />}>Tool</TextLink>, a streaming <TextLink render={<Link to="/components/response" />}>Response</TextLink>{" "}
              whose <C>[n]</C> markers become <TextLink render={<Link to="/components/inline-citation" />}>inline citations</TextLink>, and{" "}
              <TextLink render={<Link to="/components/sources" />}>Sources</TextLink>.
            </li>
            <li>
              <TextLink render={<Link to="/components/prompt-input" />}>PromptInput</TextLink> gets the chat <C>status</C>: its button sends, shows a spinner
              while waiting, and becomes Stop while streaming.
            </li>
            <li>
              Everything is SDK-agnostic: map your SDK's message parts onto plain props (<C>from</C>, <C>streaming</C>, tool <C>state</C>, <C>citations</C>).
            </li>
          </ul>
        </Prose>
        <Disclosure title="Show the example's code">
          <CodeBlock code={raw} label="chat example code" language="tsx" />
        </Disclosure>
      </DocSection>
    </article>
  );
}
