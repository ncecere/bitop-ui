"use client";

import { ChevronDown, ExternalLink, MessageSquare } from "lucide-react";
import { type ReactElement, type ReactNode, createContext, useContext } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Menu, MenuGroup, MenuLinkItem, type MenuProps } from "@/registry/bitop/ui/menu/menu";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./open-in-chat.module.css";

/*
 * OpenInChat: a menu (bitop Menu, Base UI) of "open this prompt in…" links.
 * Each provider builds a URL from the prompt; items open in a new tab.
 *
 *   <OpenInChat query="Explain this stack trace: …" providers={["chatgpt", "claude", "v0"]} />
 *
 *   // custom providers and extra items
 *   <OpenInChat query={prompt} providers={["claude", { id: "internal", title: "Open in Campus AI",
 *     createUrl: (q) => `https://ai.example.edu/new?q=${encodeURIComponent(q)}` }]}>
 *     <OpenInChatItem provider="chatgpt" />
 *   </OpenInChat>
 *
 * Built-in providers ship with a generic icon (brand marks are trademarks
 * and left to the app); pass `icon` on a provider to use your own.
 */

export type OpenInChatProvider = {
  id: string;
  /** Item text, e.g. "Open in Claude". */
  title: string;
  /** Builds the destination URL for the prompt. */
  createUrl: (query: string) => string;
  /** Decorative icon (default: a speech bubble). */
  icon?: ReactNode;
};

const withParams = (base: string, params: Record<string, string>) => `${base}?${new URLSearchParams(params).toString()}`;

/** Built-in providers. Their URL formats are the ones each product documents for prefilled prompts. */
export const openInChatProviders = {
  chatgpt: { id: "chatgpt", title: "Open in ChatGPT", createUrl: (q: string) => withParams("https://chatgpt.com/", { hints: "search", prompt: q }) },
  claude: { id: "claude", title: "Open in Claude", createUrl: (q: string) => withParams("https://claude.ai/new", { q }) },
  v0: { id: "v0", title: "Open in v0", createUrl: (q: string) => withParams("https://v0.app/", { q }) },
  cursor: { id: "cursor", title: "Open in Cursor", createUrl: (q: string) => withParams("https://cursor.com/link/prompt", { text: q }) },
  t3: { id: "t3", title: "Open in T3 Chat", createUrl: (q: string) => withParams("https://t3.chat/new", { q }) },
  scira: { id: "scira", title: "Open in Scira", createUrl: (q: string) => withParams("https://scira.ai/", { q }) },
} satisfies Record<string, OpenInChatProvider>;

export type OpenInChatProviderId = keyof typeof openInChatProviders;

const DEFAULT_PROVIDERS: OpenInChatProviderId[] = ["chatgpt", "claude", "v0"];

function resolveProvider(provider: OpenInChatProviderId | OpenInChatProvider): OpenInChatProvider {
  return typeof provider === "string" ? openInChatProviders[provider] : provider;
}

type OpenInChatContextValue = {
  query: string;
  onOpen?: (provider: OpenInChatProvider, url: string) => void;
};

const OpenInChatContext = createContext<OpenInChatContextValue | null>(null);

export type OpenInChatProps = Pick<MenuProps, "open" | "defaultOpen" | "onOpenChange" | "side" | "align"> & {
  /** The prompt to open. */
  query: string;
  /** Providers to list, in order: built-in ids or custom providers (default chatgpt, claude, v0). Pass [] to only render children. */
  providers?: (OpenInChatProviderId | OpenInChatProvider)[];
  /** Trigger element (default: a secondary "Open in chat" button). */
  trigger?: ReactElement;
  /** Text of the default trigger. */
  label?: ReactNode;
  /** Optional group heading inside the menu, e.g. "Open this prompt in". */
  groupLabel?: ReactNode;
  /** Called when an item is chosen (for analytics); navigation still happens. */
  onOpen?: (provider: OpenInChatProvider, url: string) => void;
  /** Extra items after the providers, e.g. <OpenInChatItem provider={…} />. */
  children?: ReactNode;
  className?: string;
};

export function OpenInChat({
  query,
  providers = DEFAULT_PROVIDERS,
  trigger,
  label = "Open in chat",
  groupLabel,
  onOpen,
  children,
  className,
  ...menuProps
}: OpenInChatProps) {
  const items = (
    <>
      {providers.map((p) => {
        const provider = resolveProvider(p);
        return <OpenInChatItem key={provider.id} provider={provider} />;
      })}
      {children}
    </>
  );
  return (
    <OpenInChatContext.Provider value={{ query, onOpen }}>
      <Menu
        {...menuProps}
        className={cx(styles.popup, className)}
        trigger={
          trigger ?? (
            <Button variant="secondary" size="sm">
              {label}
              <ChevronDown aria-hidden />
            </Button>
          )
        }
      >
        {groupLabel ? <MenuGroup label={groupLabel}>{items}</MenuGroup> : items}
      </Menu>
    </OpenInChatContext.Provider>
  );
}

export type OpenInChatItemProps = {
  provider: OpenInChatProviderId | OpenInChatProvider;
  /** Override the prompt from the surrounding OpenInChat. */
  query?: string;
  className?: string;
};

/** One provider link. Opens in a new tab (announced to screen readers). */
export function OpenInChatItem({ provider: p, query: queryProp, className }: OpenInChatItemProps) {
  const ctx = useContext(OpenInChatContext);
  const provider = resolveProvider(p);
  const query = queryProp ?? ctx?.query ?? "";
  const href = provider.createUrl(query);
  return (
    <MenuLinkItem
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cx(styles.item, className)}
      icon={<span className={styles.icon}>{provider.icon ?? <MessageSquare aria-hidden />}</span>}
      shortcut={<ExternalLink className={styles.external} />}
      onClick={() => ctx?.onOpen?.(provider, href)}
    >
      {provider.title}
      <span className="sr-only"> (opens in a new tab)</span>
    </MenuLinkItem>
  );
}
