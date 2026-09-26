import type { ComponentType, ReactNode } from "react";
import type { PropRow } from "../kit/kit";

export type Category = "Actions" | "Forms" | "Overlays" | "Feedback" | "Display" | "Navigation" | "Layout" | "Theming";

export type DocExample = {
  title: string;
  description?: ReactNode;
  Demo: ComponentType;
  code: string;
  wide?: boolean;
};

export type ComponentDoc = {
  /** URL slug and registry item name. */
  slug: string;
  title: string;
  category: Category;
  description: ReactNode;
  /** The import line(s) shown under Installation. */
  imports: string;
  examples: DocExample[];
  props: { component: string; rows: PropRow[]; note?: ReactNode }[];
  a11y: ReactNode[];
  /** Base UI part this wraps, linked from the page. */
  baseUi?: { name: string; href: string };
};

/**
 * Pulls the source of a named example function out of the raw module text,
 * so the code shown in the docs is exactly the code that renders the preview.
 */
export function sourceOf(raw: string, name: string): string {
  const start = raw.search(new RegExp(`^(export )?function ${name}\\(`, "m"));
  if (start === -1) throw new Error(`example ${name} not found`);
  const end = raw.indexOf("\n}\n", start);
  return raw.slice(start, end === -1 ? undefined : end + 2).replace(/^export /, "").trim();
}

export function examples(raw: string, list: [name: string, Demo: ComponentType, meta: Omit<DocExample, "Demo" | "code">][]): DocExample[] {
  return list.map(([name, Demo, meta]) => ({ ...meta, Demo, code: sourceOf(raw, name) }));
}
