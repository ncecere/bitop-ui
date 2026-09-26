# Contributing to bitop-ui

## Principles

1. **Base UI for behaviour.** If Base UI has a part (Dialog, Menu, Select, Tabs, Field, Toast…), wrap it instead of building your own. Its bundled docs are authoritative: `node_modules/@base-ui/react/docs/react/components/<name>.md`.
2. **Native first.** Buttons are real `<button type="button">`; forms use `NativeSelect`. Reach for custom widgets only when native ones can't do the job.
3. **Semantic tokens only.** Components use `var(--color-primary)`, `var(--space-4)`, `var(--radius-control)`… never `--palette-*` or hex values. `npm run registry:validate` fails on undefined tokens and palette reads.
4. **Variants are data attributes** (`data-variant="danger"`, `data-size="sm"`), styled in the CSS Module. Base UI state attributes (`data-checked`, `data-starting-style`…) are styled the same way.
5. **Composable and open.** Accept `className` (merge with `cx`), pass native props and `ref` through (React 19 `ref` as a prop), export every `…Props` type, and support `render` (Base UI `useRender`) for anything link-like.
6. **Accessible by construction.** Required accessible names are required props (`label`, `caption`…). Text meets 4.5:1, control boundaries and focus rings 3:1. Status is never colour-only. Respect `prefers-reduced-motion`.

## Adding a component

Say the new item is `date-field`.

### 1. Source

Create `registry/bitop/ui/date-field/date-field.tsx` and `date-field.module.css`.

- Start the file with `"use client";` if it uses hooks, context, event handlers or Base UI.
- Put the file's descriptive comment **below** the imports: the shadcn CLI drops a file's leading comment when it rewrites imports.
- Imports:
  - own CSS: `import styles from "./date-field.module.css";`
  - other items: `import { Button } from "@/registry/bitop/ui/button/button";`
  - shared popup styles: `import popup from "@/registry/bitop/ui/styles/popup.module.css";`
  - helpers: `import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";`
  - never a relative import into another item's folder, and never a path containing `/ui` outside `@/registry/bitop/ui/` (the CLI would rewrite it).
- If you need a new colour, add a semantic token to **both** blocks of `themes/neutral.css` (and `themes/uf.css` if it's a brand colour), with its contrast ratio in a comment, and add the pair to `tests/contrast.test.ts`.

### 2. Registry entry

Add an item to `registry.json` (keep items sorted by name after the foundation items):

```json
{
  "name": "date-field",
  "type": "registry:ui",
  "title": "Date field",
  "description": "One sentence.",
  "dependencies": ["@base-ui/react@^1.8.0", "lucide-react@^1.48.0"],
  "registryDependencies": ["@bitop/core", "@bitop/button"],
  "files": [
    { "path": "registry/bitop/ui/date-field/date-field.tsx", "type": "registry:ui", "target": "@ui/date-field/date-field.tsx" },
    { "path": "registry/bitop/ui/date-field/date-field.module.css", "type": "registry:file", "target": "@ui/date-field/date-field.module.css" }
  ],
  "categories": ["forms"]
}
```

- `.tsx` files are `registry:ui`; CSS files are `registry:file` (copied verbatim; other types are parsed as TSX by the CLI).
- Every item depends on `@bitop/core`; list every other item you import as `@bitop/<name>` and every npm package you import in `dependencies`.
- Run `npm run registry:build && npm run registry:validate`. The validator checks all of the above.

### 3. Docs page

Create `docs/src/content/components/date-field.tsx` (copy a similar page, e.g. `switch.tsx`):

- Each example is an exported function; the page shows that function's source (read with `?raw`), so keep examples self-contained and realistic.
- Fill in `props` (the component's own props; mention inherited Base UI/native props in `note`) and `a11y` notes you have verified in the source.
- Pick a `category`; the sidebar and component index pick the page up automatically.

### 4. Tests

- `tests/docs-pages.test.tsx` already renders the new page and runs axe, and fails if a `registry:ui` item has no docs page.
- Add behaviour tests (keyboard, ARIA wiring, callbacks) in `tests/*.test.tsx` with testing-library, and an `axe` assertion on the rendered component.

### 5. Check everything

```bash
npm run typecheck && npm test && npm run build && npm run registry:validate
npm run smoke:consumer   # optional locally, runs in CI
```

Commit with a message that says what the component does and any decisions worth remembering.
