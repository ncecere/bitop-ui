# Contributing to bitop-ui

## Principles

1. **Base UI for behaviour.** If Base UI has a part (Dialog, Menu, Select, Tabs, Field, Toast…), wrap it instead of building your own. Its bundled docs are authoritative: `node_modules/@base-ui/react/docs/react/components/<name>.md`.
2. **Native first.** Buttons are real `<button type="button">`; forms use `NativeSelect`. Reach for custom widgets only when native ones can't do the job.
3. **Semantic tokens only.** Components use `var(--color-primary)`, `var(--space-4)`, `var(--radius-control)`… never `--palette-*` or hex values. `npm run registry:validate` fails on undefined tokens and palette reads.
4. **Variants are data attributes** (`data-variant="danger"`, `data-size="sm"`), styled in the CSS Module. Base UI state attributes (`data-checked`, `data-starting-style`…) are styled the same way.
5. **Composable and open.** Accept `className` (merge with `cx`), pass native props and `ref` through (React 19 `ref` as a prop), export every `…Props` type, and support `render` (Base UI `useRender`) for anything link-like.
6. **Enforced by `npm run styling:check`.** `scripts/check-styling.mjs` rejects Tailwind, Radix, CSS-in-JS, clsx/cva/tailwind-merge and other component kits (in package.json, registry.json and imports), non-module CSS in a component folder, literal colours (hex/rgb/hsl/oklch…) in component `.tsx`/`.module.css`, and inline styles with px or numeric lengths. Every `registry:ui` item must import `@base-ui/react` directly or through another bitop item; anything with popup/disclosure ARIA must import it directly. Components with no behaviour at all go on the `DISPLAY_ONLY` allowlist in that script (with a reason); the check then keeps them free of keyboard handlers, tabIndex, focus management and form controls.
7. **Accessible by construction.** Required accessible names are required props (`label`, `caption`…). Text meets 4.5:1, control boundaries and focus rings 3:1. Status is never colour-only. Respect `prefers-reduced-motion`.

## Adding a component

Say the new item is `date-field`.

### 1. Source

Create `registry/bitop/ui/date-field/date-field.tsx` and `date-field.module.css`.

- Start the file with `"use client";` if it uses hooks, context, event handlers or Base UI.
- Put the file's descriptive comment **below** the imports for compatibility with the development-only shadcn registry tooling. The Bitop installer preserves comments.
- Imports:
  - own CSS: `import styles from "./date-field.module.css";`
  - other items: `import { Button } from "@/registry/bitop/ui/button/button";`
  - shared popup styles: `import popup from "@/registry/bitop/ui/styles/popup.module.css";`
  - helpers: `import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";`
  - never a relative import into another item's folder. Keep registry imports under `@/registry/bitop/ui/` or `@/registry/bitop/lib/` so Bitop can rewrite them to consumer aliases; avoid other `/ui` paths for compatibility with the registry validator.
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

- `.tsx` files are `registry:ui`; CSS files are `registry:file` (copied verbatim). Bitop rewrites imports in code files based on their target extension, not registry type.
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
npm run check            # typecheck, styling policy, tests, build, registry validation
npm run smoke:consumer   # optional locally, runs in CI
```

The shadcn CLI is used only for development-time registry build/schema validation, not consumer installation. The smoke test installs with the first-party Bitop CLI. See [packages/cli/README.md](./packages/cli/README.md) for its commands and supported configuration.

## Releasing the CLI

`@bitop-dev/cli` is published to npm from `packages/cli` (the version lives only in `packages/cli/package.json`; `bitop --version` reads it).

1. Bump `version` in `packages/cli/package.json` (semver: new command/flag → minor, fix → patch).
2. `npm run check && npm run smoke:consumer` (the smoke test installs the packed tarball into a fresh Vite app).
3. Publish with a token kept outside git (`*.env` and `.npmrc` are gitignored), without writing it to your global npm config:

   ```bash
   cd packages/cli
   npm publish --dry-run            # check the file list: bin/, README.md, LICENSE, package.json
   npm publish                      # publishConfig.access is "public"
   ```
4. Tag the release and push the tag: `git tag cli-v<version> && git push origin cli-v<version>`.

npm provenance (`--provenance`) needs a public GitHub repository and a CI publish, so it isn't used while this repository is private.

Commit with a message that says what the component does and any decisions worth remembering.
