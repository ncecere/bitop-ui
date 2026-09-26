/*
 * The docs page list. Page modules (docs/src/content/components/*.tsx) are
 * code-split: each loads on demand. Their title/slug/category/description come
 * from `virtual:bitop-docs-meta`, which the bitop-docs-meta plugin in
 * vite.config.ts reads from the same files at build time, so a new content
 * file shows up in the sidebar, index and ⌘K with no registration step.
 */
import meta from "virtual:bitop-docs-meta";
import type { Category, ComponentDoc, DocMeta } from "./types";

const modules = import.meta.glob<{ default: ComponentDoc }>("./components/*.tsx");

const cache = new Map<string, Promise<ComponentDoc>>();

function loader(file: string, slug: string) {
  const importer = modules[file];
  if (!importer) throw new Error(`docs metadata lists ${file} but import.meta.glob did not find it`);
  return () => {
    let p = cache.get(slug);
    if (!p) {
      p = importer().then((m) => {
        if (m.default?.slug !== slug) throw new Error(`${file}: the default export's slug is "${m.default?.slug}", expected "${slug}"`);
        return m.default;
      });
      // Let a later visit retry after a failure (e.g. a network blip).
      p.catch(() => cache.delete(slug));
      cache.set(slug, p);
    }
    return p;
  };
}

for (const file of Object.keys(modules)) {
  if (!meta.some((m) => m.file === file)) throw new Error(`${file} has no docs metadata (is the bitop-docs-meta plugin in vite.config.ts running?)`);
}

export const componentDocs: DocMeta[] = meta
  .map((m) => ({ slug: m.slug, title: m.title, category: m.category, description: m.description, load: loader(m.file, m.slug) }))
  .sort((a, b) => a.title.localeCompare(b.title));

export const categories: Category[] = ["Actions", "Forms", "Overlays", "Feedback", "Display", "Navigation", "Layout", "AI", "Theming"];

export function docsByCategory() {
  return categories
    .map((category) => ({ category, docs: componentDocs.filter((d) => d.category === category) }))
    .filter((g) => g.docs.length > 0);
}

export function findDoc(slug: string) {
  return componentDocs.find((d) => d.slug === slug);
}

/** Loads (once) the full ComponentDoc for a slug. */
export function loadDoc(slug: string): Promise<ComponentDoc> {
  const doc = findDoc(slug);
  if (!doc) return Promise.reject(new Error(`no docs page "${slug}"`));
  return doc.load();
}
