# bitop-ui

A copy-and-own React component library. The `bitop` CLI (`packages/cli`) copies components into your project as source, with their dependencies, and you own the code from then on. The workflow is inspired by shadcn/ui, but bitop doesn't need the shadcn CLI or Tailwind.

- **Behaviour and accessibility** come from [Base UI](https://base-ui.com) (`@base-ui/react` 1.8).
- **Styling** is CSS Modules, one `*.module.css` next to each component.
- **Theming** is CSS custom properties: structural tokens plus a theme file. No Tailwind, no runtime styling.
- **WCAG 2.1 AA**: contrast is tested for every theme, and every docs page is checked with axe.
- **Enforced**: `npm run styling:check` (`scripts/check-styling.mjs`) fails the build on Tailwind/Radix/CSS-in-JS/class-name utilities or other component kits, global CSS in a component folder, literal colours or px inline styles, and interactive components that don't build on Base UI.

The registry has 112 items: `core`, two themes (`theme-neutral`, the default, and the opt-in `theme-uf`) and 109 components. They include familiar UI patterns (accordion, calendar, combobox, data-table, dialog, drawer, menubar, navigation-menu, sheet, slider, toggle-group…) plus app-level pieces (`app-shell`, `command-palette`, `page-header`, `stat-card`) and the AI elements below.

### AI elements

Components for chat and agent UIs (docs: the **AI** section and the full **Chat example** page). They are SDK-agnostic: plain props such as `from: "user" | "assistant"`, `streaming`, tool `state: "pending" | "running" | "completed" | "error"` and chat `status: "ready" | "submitted" | "streaming" | "error"`, so any SDK's message parts map onto them.

- Chat essentials: `conversation` (stick-to-bottom log, empty state, scroll button, screen-reader announcer), `message` (bubbles, actions, feedback, branches), `response` (streaming-safe Markdown with `closeMarkdown()`, citations; `LazyResponse` from `response-lazy.tsx` code-splits the Markdown engine), `reasoning`, `tool`, `sources`, `inline-citation`, `prompt-input`, `suggestion`, `shimmer`, `loader`, `code-block`, plus the `copy-button` helper.
- Agent UI: `chain-of-thought`, `task`, `plan`, `confirmation`, `context`, `model-selector`, `attachments`, `artifact`, `snippet`, `queue`, `checkpoint`.
- Dependencies: `react-markdown` and `remark-gfm` (only `response` uses them; render `LazyResponse` to keep them out of your main bundle). No syntax highlighter is bundled: `code-block` takes a `highlight(code, lang)` prop.
- Inspired by Vercel's [AI Elements](https://github.com/vercel/ai-elements) (Apache-2.0): same component set and composition, original code on Base UI + CSS Modules. See [NOTICE](./NOTICE).
- Candidates not built yet: canvas / node / edge / connection / controls / panel / toolbar (need xyflow), audio-player, voice and mic selectors, speech-input, transcription, persona (Rive), terminal, sandbox, jsx-preview, web-preview, file-tree, commit, stack-trace, test-results, schema-display, environment-variables, package-info, open-in-chat.

## Using it in a project

Full guide: the docs site's **Installation** page and the [CLI reference](./packages/cli/README.md). In short, for a Vite + React 19 + TypeScript app with Node 20 (20.19+) or 22.12+:

1. Add an `@/*` path alias to `tsconfig.json`/`tsconfig.app.json` and to `vite.config.ts`.
2. Add the CLI ([`@bitop-dev/cli`](https://www.npmjs.com/package/@bitop-dev/cli) on npm) as a dev dependency:

   ```bash
   npm install -D @bitop-dev/cli
   ```
3. Point it at a registry. Choose **one** command; it writes `components.json`. If you already have a shadcn-style config, add `registries["@bitop"]` instead of replacing it.

   ```bash
   npx @bitop-dev/cli init --registry ../bitop-ui # checkout: nothing to build or serve
   # OR use a hosted registry:
   npx @bitop-dev/cli init --registry "https://OWNER.github.io/bitop-ui/r/{name}.json"
   ```
4. Install the core (tokens, base styles, font, helpers; pulls in the neutral theme) and components:

   ```bash
   npx @bitop-dev/cli add core button dialog
   ```
5. Import the styles once: `import "@/components/ui/styles/bitop.css";` (and `themes/uf.css` after it for the UF brand, with `<html data-brand="uf">`).

Alternatively, run `node ../bitop-ui/packages/cli/bin/bitop.mjs` from your project with the same arguments, without installing the CLI. `npx --no-install` uses the locally installed CLI rather than downloading an unrelated package.

Files land in your `ui` alias (`src/components/ui/<name>/<name>.tsx` + `<name>.module.css`, shared styles in `ui/styles`, themes in `ui/themes`) and `lib/bitop-utils.ts`. Missing npm packages are installed with your package manager; packages you already list keep their versions. Use trusted registries and npm packages: package installation may run lifecycle scripts. `bitop add … --no-install` copies files but only prints the dependencies to install.

### Keeping components up to date

```bash
npx @bitop-dev/cli diff button             # compare without writing
npx @bitop-dev/cli update                  # refresh installed items; skip local edits
npx @bitop-dev/cli add button --overwrite  # replace even your edits
npx @bitop-dev/cli list                    # registry items (* = installed)
```

`bitop-lock.json` records file hashes, which is how `update` tells your edits apart from upstream changes. Commit it. Updates do not merge edits or delete obsolete files. Use `--dry-run` to preview without writing files or installing packages.

## Developing

Requires Node 22 (see `.nvmrc`) and npm.

```bash
npm install
npm run dev               # docs site at http://localhost:5173
npm run typecheck         # tsc --noEmit (TypeScript 5.9)
npm test                  # vitest: component tests + axe, theme contrast, every docs page
npm run registry:build    # build the registry JSON → public/r/*.json
npm run registry:validate # consistency checks on registry.json and public/r
npm run registry:serve    # serve public/r at http://127.0.0.1:4180/r/{name}.json (REGISTRY_PORT)
npm run styling:check     # Base UI + CSS Modules + CSS variables policy (scripts/check-styling.mjs)
npm run build             # registry + docs → dist/ (dist/r is the registry)
npm run preview           # serve dist/ at http://127.0.0.1:4173
npm run smoke:consumer    # fresh Vite app + bitop CLI install of every item, then build (needs network)
npm run a11y:browser      # agent-browser axe audit of every docs page in 4 theme/mode combos (needs preview running)
```

The shadcn CLI is a **development-only** dependency for registry build/schema validation. Consumers use Bitop and need neither shadcn nor Tailwind.

### Repository layout

```
registry.json                 registry source of truth (items, files, dependencies)
registry/bitop/ui/<name>/     component source: <name>.tsx + <name>.module.css
registry/bitop/ui/styles/     core: bitop.css (entry), tokens.css, global.css, popup.module.css
registry/bitop/ui/themes/     neutral.css (default, light + dark), uf.css (opt-in brand)
registry/bitop/lib/           core: bitop-utils.ts (cx, dataFlag, Tone)
docs/src/                     docs site (Vite + React), dogfooding the registry
docs/src/content/components/  one docs file per component (examples, props, a11y notes)
docs/src/examples/            larger examples (the full chat example page)
tests/                        vitest + testing-library + vitest-axe
packages/cli/                 the bitop CLI (dependency-free Node script)
scripts/                      registry build/validate, styling policy, consumer smoke test, browser a11y audit
.github/workflows/ci.yml      typecheck, test, registry build, validate, docs build, smoke test, Pages deploy
```

### How imports are resolved for consumers

Source files import each other through the `@/registry/bitop/...` alias (mapped to the repo root in `tsconfig.json` and `vite.config.ts`). When a consumer installs an item, the Bitop CLI rewrites those specifiers to the consumer's aliases:

| In this repo | In the consumer (default aliases) |
|---|---|
| `@/registry/bitop/ui/button/button` | `@/components/ui/button/button` |
| `@/registry/bitop/ui/styles/popup.module.css` | `@/components/ui/styles/popup.module.css` |
| `@/registry/bitop/lib/bitop-utils` | `@/lib/bitop-utils` |
| `./button.module.css` | unchanged (the CSS file sits next to the `.tsx`) |

Every file declares a `target` (`@ui/<name>/<name>.tsx`, `@lib/bitop-utils.ts`), so the install location follows the consumer's `ui`/`lib` aliases. Bitop rewrites code-file imports and copies CSS verbatim. `scripts/validate-registry.mjs` checks the registry conventions and compatibility with the development tooling.

Alias resolution reads `tsconfig.json`, `tsconfig.app.json`, then `jsconfig.json`, preferring exact aliases then the longest wildcard prefix within each file; it does not follow `extends` or `references`. Unmatched `@/…` aliases fall back to `src/…`. Set `bitop.paths.ui` / `bitop.paths.lib` in `components.json` to override disk locations (imports still use `aliases`).

## Publishing

The registry is static JSON, so any static host works. The docs build (`dist/`) contains the site and the registry at `dist/r/`.

- **`SITE_URL`** (or `VITE_SITE_URL`) is the absolute URL the site is served from, e.g. `https://OWNER.github.io/bitop-ui`. It sets the Vite base path, the registry URL shown in the docs and, for `registry:build`, turns `@bitop/*` dependencies into absolute URLs. Bitop resolves both namespaced and URL-form (`…/r/<name>.json`) dependencies by item name through the configured registry source; it does **not** fetch those dependencies from external origins.
- **GitHub Pages**: `.github/workflows/ci.yml` builds with `SITE_URL` from the repository variable of that name (default: the Pages project URL) and has a `deploy` job that is skipped until you set the repository variable `DEPLOY_PAGES=true` and select "GitHub Actions" as the Pages source. `404.html` is a copy of `index.html` so client-side routes work on Pages.
- Consumers compare with `npx @bitop-dev/cli diff <item>` and refresh with `npx @bitop-dev/cli update`. The lock file tracks file hashes, not pinned registry versions; `--overwrite` explicitly replaces local edits.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for adding a component (registry entry, docs page, tests).

## License

MIT, see [LICENSE](./LICENSE). The AI elements' design credit to Vercel's AI Elements (Apache-2.0) is in [NOTICE](./NOTICE).

## Origin

The components were extracted from the UI library of the Open RAG System project and generalised (brand wording removed, the UF palette moved into the opt-in `theme-uf`).
