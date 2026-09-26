import type { Category, ComponentDoc } from "./types";

const modules = import.meta.glob<{ default: ComponentDoc }>("./components/*.tsx", { eager: true });

export const componentDocs: ComponentDoc[] = Object.values(modules)
  .map((m) => m.default)
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
