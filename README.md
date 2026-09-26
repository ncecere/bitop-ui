# bitop-ui

A copy-and-own React component library distributed as a [shadcn registry](https://ui.shadcn.com/docs/registry). Consumers install components as source with `npx shadcn add @bitop/<name>` and then own the code.

- **Behaviour and accessibility** come from [Base UI](https://base-ui.com) (`@base-ui/react` 1.8).
- **Styling** is CSS Modules, one `*.module.css` next to each component.
- **Theming** is CSS custom properties: structural tokens plus a theme file. No Tailwind, no runtime styling.
- **WCAG 2.1 AA**: contrast is tested for every theme, and every docs page is checked with axe.
- **Enforced**: `npm run styling:check` (`scripts/check-styling.mjs`) fails the build on Tailwind/Radix/CSS-in-JS/class-name utilities or other component kits, global CSS in a component folder, literal colours or px inline styles, and interactive components that don't build on Base UI.

The registry has 63 items: `core`, two themes (`theme-neutral`, the default, and the opt-in `theme-uf`) and 60 components, including `app-shell`, `command-palette`, `dialog`, `table`, `field`, `select`, `toast`, `color-mode` and the AI elements below.

### AI elements

Components for chat and agent UIs (docs: the **AI** section and the full **Chat example** page). They are SDK-agnostic: plain props such as `from: "user" | "assistant"`, `streaming`, tool `state: "pending" | "running" | "completed" | "error"` and chat `status: "ready" | "submitted" | "streaming" | "error"`, so any SDK's message parts map onto them.

- Chat essentials: `conversation` (stick-to-bottom log, empty state, scroll button, screen-reader announcer), `message` (bubbles, actions, feedback, branches), `response` (streaming-safe Markdown with `closeMarkdown()`, citations), `reasoning`, `tool`, `sources`, `inline-citation`, `prompt-input`, `suggestion`, `shimmer`, `loader`, `code-block`, plus the `copy-button` helper.
- Agent UI: `chain-of-thought`, `task`, `plan`, `confirmation`, `context`, `model-selector`, `attachments`, `artifact`, `snippet`, `queue`, `checkpoint`.
- Dependencies: `react-markdown` and `remark-gfm` (only `response` uses them). No syntax highlighter is bundled: `code-block` takes a `highlight(code, lang)` prop.
- Inspired by Vercel's [AI Elements](https://github.com/vercel/ai-elements) (Apache-2.0): same component set and composition, original code on Base UI + CSS Modules. See [NOTICE](./NOTICE).
- Candidates not built yet: canvas / node / edge / connection / controls / panel / toolbar (need xyflow), audio-player, voice and mic selectors, speech-input, transcription, persona (Rive), terminal, sandbox, jsx-preview, web-preview, file-tree, commit, stack-trace, test-results, schema-display, environment-variables, package-info, open-in-chat.

## Using it in a project

Full guide: the docs site's **Installation** page. In short, for a Vite + React 19 + TypeScript app:

1. Add an `@/*` path alias to `tsconfig.json`/`tsconfig.app.json` and to `vite.config.ts`.
2. Write `components.json` by hand (`shadcn init` requires Tailwind), with the registry namespace:

   ```json
   "registries": { "@bitop": "https://OWNER.github.io/bitop-ui/r/{name}.json" }
   ```

   See `docs/src/pages/InstallationPage.tsx` for the complete file.
3. Install the core (tokens, base styles, font, helpers; pulls in the neutral theme) and components:

   ```bash
   npx shadcn@latest add @bitop/core @bitop/button @bitop/dialog
   # or without the namespace, by URL:
   npx shadcn@latest add https://OWNER.github.io/bitop-ui/r/dialog.json
   ```
4. Import the styles once: `import "@/components/ui/styles/bitop.css";` (and `themes/uf.css` after it for the UF brand, with `<html data-brand="uf">`).

Files land in your `ui` alias (`src/components/ui/<name>/<name>.tsx` + `<name>.module.css`, shared styles in `ui/styles`, themes in `ui/themes`) and `lib/bitop-utils.ts`.

## Developing

Requires Node 22 (see `.nvmrc`) and npm.

```bash
npm install
npm run dev               # docs site at http://localhost:5173
npm run typecheck         # tsc --noEmit (TypeScript 5.9)
npm test                  # vitest: component tests + axe, theme contrast, every docs page
npm run registry:build    # shadcn build → public/r/*.json
npm run registry:validate # consistency checks on registry.json and public/r
npm run styling:check     # Base UI + CSS Modules + CSS variables policy (scripts/check-styling.mjs)
npm run build             # registry + docs → dist/ (dist/r is the registry)
npm run preview           # serve dist/ at http://127.0.0.1:4173
npm run smoke:consumer    # fresh Vite app + real shadcn CLI install of every item (needs network)
npm run a11y:browser      # agent-browser axe audit of every docs page in 4 theme/mode combos (needs preview running)
```

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
scripts/                      registry build/validate, styling policy, consumer smoke test, browser a11y audit
.github/workflows/ci.yml      typecheck, test, shadcn build, validate, docs build, smoke test, Pages deploy
```

### How imports are resolved for consumers

Source files import each other through the `@/registry/bitop/...` alias (mapped to the repo root in `tsconfig.json` and `vite.config.ts`). When a consumer installs an item, the shadcn CLI rewrites those specifiers to the consumer's aliases:

| In this repo | In the consumer (default aliases) |
|---|---|
| `@/registry/bitop/ui/button/button` | `@/components/ui/button/button` |
| `@/registry/bitop/ui/styles/popup.module.css` | `@/components/ui/styles/popup.module.css` |
| `@/registry/bitop/lib/bitop-utils` | `@/lib/bitop-utils` |
| `./button.module.css` | unchanged (the CSS file sits next to the `.tsx`) |

Every file declares a `target` (`@ui/<name>/<name>.tsx`, `@lib/bitop-utils.ts`), so the install location follows the consumer's `ui`/`lib` aliases. `.tsx`/`.ts` files are `registry:ui`/`registry:lib` (the CLI rewrites their imports); CSS files are `registry:file`, which the CLI copies verbatim. `scripts/validate-registry.mjs` enforces these rules, including that no specifier would be mangled by the CLI's `@/registry/<style>/ui` rewrite.

## Publishing

The registry is static JSON, so any static host works. The docs build (`dist/`) contains the site and the registry at `dist/r/`.

- **`SITE_URL`** (or `VITE_SITE_URL`) is the absolute URL the site is served from, e.g. `https://OWNER.github.io/bitop-ui`. It sets the Vite base path, the install commands shown in the docs and, for `registry:build`, turns `@bitop/*` dependencies into absolute URLs so direct-URL installs work without namespace configuration. Without it, dependencies stay `@bitop/*` (host-independent, but consumers must configure the namespace).
- **GitHub Pages**: `.github/workflows/ci.yml` builds with `SITE_URL` from the repository variable of that name (default: the Pages project URL) and has a `deploy` job that is skipped until you set the repository variable `DEPLOY_PAGES=true` and select "GitHub Actions" as the Pages source. `404.html` is a copy of `index.html` so client-side routes work on Pages.
- Consumers pin nothing: they re-run `npx shadcn add … --overwrite` (or `--diff` to preview) to update.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for adding a component (registry entry, docs page, tests).

## License

TODO: the owner hasn't chosen a license yet. Until a `LICENSE` file is added, all rights are reserved.

## Origin

The components were extracted from the UI library of the Open RAG System project and generalised (brand wording removed, the UF palette moved into the opt-in `theme-uf`).
