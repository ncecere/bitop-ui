# bitop-ui roadmap (proposal for review)

> **Progress (2026-09-26):** the first batch is done: A1–A8, B1, B2, C1, E1, G1, H1 are merged into bitop-ui `main`, and I1/I2 are open as PRs in the two apps. See "Follow-ups from batch 1" at the end.

Candidate features and enhancements from a review on 2026-09-26 of this repo and of the two apps that use it: **Open RAG System** (`open-rag-system/web`, "RAG") and **Open Model Gateway** (`open-model-gateway/apps/web`, "GW"). Nothing here is scheduled. Tick what you want done, strike what you don't, and I'll plan from your picks.

- **IDs** (A1, B3…) let you refer to items quickly.
- **Effort** is relative: **S** ≈ under a day, **M** ≈ a few days, **L** ≈ a week or more.
- ⭐ marks my suggested first picks. Evidence comes from grepping and reading the code; counts are approximate.

## Where things stand

- **Library:** 112 registry items (core, 2 themes, 109 components). Covers the shadcn/ui component set (some under other names: `menu`, `disclosure`, `breadcrumbs`, `app-shell`, `toast`; Textarea, NativeSelect and AlertDialog live inside `input` and `dialog`) and AI Elements, apart from the workflow set you ruled out.
- **Checks:** 585 tests including axe on every docs page, contrast checks, the styling policy and registry validation. CI installs every item into a fresh Vite app with the Bitop CLI and builds it.
- **Distribution:** first-party `bitop` CLI (`add`/`update`/`diff`/`list`/`init`), not yet published to npm. The registry isn't hosted anywhere yet.
- **Adoption:** both apps vendor older copies, and neither uses the Bitop CLI or a lock file yet.

---

## A. Fixes to existing components

Confirmed in the current code. These are correctness and accessibility bugs rather than features, so I'd do them first.

- [x] ⭐ **A1. Response loads remote Markdown images by default.** `response.tsx:206` has `images = "show"`, so model output can trigger requests to third-party hosts (a tracking/privacy risk). Change the default to click-to-load or links, keeping `"show"` as an opt-in. **S**
- [x] ⭐ **A2. PromptInput leaks object URLs.** `prompt-input.tsx:171`: previous preview URLs aren't revoked, and files after the first in a single-file input leak. **S**
- [x] ⭐ **A3. Disabled PromptInput still accepts actions.** `PromptInputButton` (`:440`), attachment remove (`:573–590`) and `addFiles` ignore `disabled`; only the attach button checks it. **S**
- [x] ⭐ **A4. DropZone doesn't enforce `accept`.** `accept` only reaches the `<input>`; dropped files are never filtered (`drop-zone.tsx:55–67`). Reuse PromptInput's `matchesAccept`, and add `onReject` and `maxSize`. **S**
- [x] **A5. Reasoning collapse loses focus.** Auto-close (`reasoning.tsx:94`) doesn't check whether focus is inside the panel, so keyboard users are dropped to `<body>`. **S**
- [x] **A6. Counters go past the end when a list shrinks.** `inline-citation.tsx:86,129` and `message.tsx:227,230` can show "5 of 3". The clamped index is also never reported through `onBranchChange`. **S**
- [x] **A7. Color mode doesn't sync across tabs.** `color-mode.tsx` doesn't listen for the `storage` event. **S**
- [x] **A8. Regression tests for A1–A7.** None of these has a test today. Add one per fix. **S** (with each fix)

## B. New components the apps already build by hand

This is the strongest evidence: both apps rebuild these patterns themselves. The counts are uses outside `components/ui`.

- [x] ⭐ **B1. `QueryState` for loading/error/empty switching.**
  - About 110 error-alert uses across both apps.
  - RAG has `query-view.tsx` plus about 22 inline copies.
  - GW has its own `ErrorNotice` with 403/404 titles and a retry button.
  - Also: `ErrorAlert` gets `retry`, status-based titles and an error-to-tone map. **M**
- [x] ⭐ **B2. Formatting helpers and a `<Time>` component.**
  - About 100 date/number formatting calls in both apps; RAG has `formatBytes` and `plural` (18 uses); neither app shows relative times.
  - Add a `lib/format` item (`formatDate`, `formatNumber`, `formatBytes`, `plural`) and `<Time format="datetime|date|relative">` with a full-date tooltip.
  - Extract `formatRelativeTime` out of `commit`. **S–M**
- [ ] ⭐ **B3. `FilterBar` / `Toolbar` above tables, plus a `useDebouncedValue` hook.** RAG's `s.toolbar`, `useDebounced` (4 files) and GW's `.table-toolbar`. **M**
- [ ] **B4. `DescriptionList` (key/value details).** Both apps hand-build the same `<dl>` grid (RAG 4 uses, GW 8). `stat-card` and `context` have private versions. **S**
- [ ] **B5. `StatGrid`.** The same responsive 4/2/1-column grid in both apps. **S**
- [ ] **B6. `FormDialog`, and an `AlertDialog` that runs a mutation.**
  - RAG has `ConfirmMutationDialog` (6 uses) and `FormDialog` (3).
  - GW built its own `<dialog>` and `ActionDialog` (24 actions).
  - Add pending state, error display and closing on success. **M**
- [ ] **B7. `SecretReveal` (one-time API key display).** Both apps built one: copy button, "won't be shown again" warning, "I've saved it" acknowledgement, and a fallback when the clipboard fails. **S**
- [ ] **B8. `UsageMeter` (and a general `Meter`).** RAG wraps `Progress` to turn red at 90% and show "3 of 100 today". `context` already uses Base UI `Meter` internally. **S**
- [ ] **B9. Dependency-free SVG charts: `Sparkline` and `BarChart`.** RAG hand-built a CSS stacked bar chart (`agents/analytics.tsx`). This settles the deferred "Recharts vs SVG" `chart` question: stay SVG, with an accessible data-table fallback. **M–L**
- [ ] **B10. `Page` layout with spacing under the header.** 29 RAG files wrap `<Stack className={s.page}>` only to add a margin under `PageHeader`; GW has a `Heading` wrapper for the same reason. **S**
- [ ] **B11. `BooleanBadge`, and `StatusBadge` taking a value→tone/label map.** RAG has 5 status-badge wrappers (47 uses); GW maps its own tones onto Bitop's (11 uses). **S**
- [ ] **B12. `SettingRow` and `FormGrid`** (RAG only: setting rows, 2-column form grids, inline forms). **S**
- [ ] **B13. Other gaps found in review:**
  - `Timeline` (activity and audit logs; RAG's audit page would use it)
  - `Stepper` (generalise the questionnaire/plan steps)
  - general `TreeView` (beyond `file-tree`)
  - `Sortable` list with a drag handle
  - `Rating`
  - virtualized list
  - Markdown editor

  List these only if an app needs them. **M each**

## C. Enhancements to existing components

- [x] ⭐ **C1. `DataTable`: cursor paging, `loading`/`error` states and row actions.** Neither app uses `DataTable`: RAG built cursor paging (`pager.tsx`) and GW built `CollectionTable`. This is the biggest gap between the library and real use. **M**
- [ ] **C2. Two-line table cells: `Td` `primary`/`secondary`, `IdentityCell` (avatar and name), `TruncatedId`.** RAG uses the two-line pattern 78 times in 27 files. **S**
- [ ] **C3. Explain disabled actions: Button `disabledReason` (tooltip) and a `ReadOnlyNotice`.** About 100 permission checks in RAG and 24 in GW. **S**
- [ ] **C4. Field `width="sm|md|lg"`.** RAG sets widths through `className` 28 times. **S**
- [ ] **C5. Tabs: sync with the URL, a `scrollable` TabsList and a `gap` on TabsPanel.** RAG built `PageTabs`/`useUrlTab` (22 uses in 8 files). **S–M**
- [ ] **C6. Layout props the apps currently override with CSS:**
  - `CommandPaletteTrigger` width and truncation
  - AppShell top bar `wrap`
  - Breadcrumbs overflow handling (all three are GW overrides)
  - Alert spacing (RAG) **S**
- [ ] **C7. Check `--color-text-subtle` contrast.** GW overrides it, apparently to get more contrast for hint text. Either the theme falls short on some surface or GW's use is unusual. Check the ratio and add the surface to `contrast.test.ts`. **S**
- [ ] **C8. `defaultValue` (uncontrolled) for number-input, color-field and question**, which currently require `value` + `onValueChange`. **S**

## D. Library-wide

- [ ] **D1. Internationalisation: `BitopLocaleProvider({ locale, messages })`.**
  - About 145 hard-coded English strings in 46 components.
  - Strings you can't override include Dialog/Sheet "Close", Copy/Copied, audio-player controls, prompt-input file errors and "KB/MB".
  - Six components have their own `labels`/`messages` props with inconsistent names.
  - Make those per-component props partial overrides on top of the provider. **L**
- [ ] **D2. Shared `Size`/`Tone` types.**
  - `ControlSize` exists, but about 15 components redeclare `"sm" | "md"`.
  - The "neutral" tone has three names (`default`/`neutral`/`primary`), and `ChatStatus` is declared twice. **M**
- [ ] **D3. Compound parts or slot class names for wrapper components.** Dialog, Popover, Tooltip, Select, Menu, Sheet and CommandPalette are convenient single components but expose one `className` and no part-level control. Add `classNames={{ popup, backdrop, … }}` and/or export the Base UI-style parts for advanced use. **M–L**
- [ ] **D4. Finish RTL support.**
  - 24 physical CSS properties remain in 8 files (drawer, app-shell, toast, sheet, dialog…).
  - `file-tree` arrow keys don't flip, and breadcrumb/disclosure/citation/branch chevrons don't mirror.
  - Add `side="start|end"` to Sheet and Drawer, and a styling-policy rule that bans physical properties. **M**
- [ ] **D5. More `render` prop coverage.** It's in only 16 components; apply it wherever an element is link-like or needs a different tag. **M**

## E. CLI

- [x] ⭐ **E1. `bitop diff --check` (exit 1 on drift).** Lets CI in each app detect stale copies. `diff` currently always exits 0. **S**
- [ ] ⭐ **E2. Publish `@bitop/cli` to npm**, from a tagged release with provenance. Define the version in one place; it's currently hard-coded in the script and in `package.json`. Needs decision **K2**. **S**
- [ ] **E3. `bitop remove <item>`, and pruning obsolete files on `update`.** Skip files you've edited; the lock already records what was installed. **M**
- [ ] **E4. Three-way merge on `update`.** Keep the originally installed content so `update` can merge upstream changes into edited files (with conflict markers) instead of skipping them. This also makes local patches like GW's `className` change survive updates. **M–L**
- [ ] **E5. `init` sets up the project:** tsconfig `paths`, the Vite alias and the `bitop.css` import, each shown as a diff before writing. The smoke test currently does this by hand. **M**
- [ ] **E6. `view <item>`, `search` and `outdated`.** **S**
- [ ] **E7. Follow tsconfig `extends`/`references`** when resolving aliases. **S**
- [ ] **E8. Workspace (monorepo) awareness:** install npm dependencies into the right package. **M**
- [ ] **E9. Run the CLI tests and smoke test on Windows and macOS in CI**; Windows is only simulated in unit tests today. **S**

## F. Registry and releases

- [ ] ⭐ **F1. Versioning and changelog.** There are no tags, releases or CHANGELOG. Adopt Changesets or release-please to produce tags, the changelog, GitHub releases and the npm publish. **M**
- [ ] **F2. Item metadata:** `meta.version`, `meta.changelog` and `meta.deprecated`/`replacedBy`, with CLI warnings for deprecated items, and item versions recorded in `bitop-lock.json` so they can be pinned. **M**
- [ ] ⭐ **F3. Fix the placeholder `homepage`** (`https://github.com/OWNER/bitop-ui` in `registry.json`). **S**
- [ ] **F4. Integrity:** per-file sha256 in the built item JSON, checked by the CLI. Signing can come later. **M**
- [ ] **F5. Repository housekeeping:**
  - Renovate or Dependabot, grouping Base UI, React and Vite (versions are pinned exactly)
  - CODEOWNERS and a PR template
  - delete the stray `pnpm-lock.yaml` and ignore `tsconfig.tsbuildinfo` **S**

## G. Docs site

- [x] ⭐ **G1. Split the docs bundle.**
  - Everything ships as one 1.9 MB JS file, and `chunkSizeWarningLimit: 1600` hides the warning.
  - Lazy-load each route and component page, then add a size budget in CI. **S–M**
- [ ] **G2. Blocks and page templates** (`registry:block`): login, dashboard, settings, and list-plus-detail pages. The apps' pages are natural sources. **M–L**
- [ ] **G3. Generate prop tables from the TypeScript types**, with hand-written overrides. They're all hand-written now, and some are empty (`tabs`). **M**
- [ ] **G4. A keyboard-interaction table on every component page.** Only 25 of 109 pages describe keyboard behaviour. **M**
- [ ] **G5. Theme generator:** pick brand colours, check contrast, and download a `[data-brand]` CSS file. **M**
- [ ] **G6. Light/dark side by side in each example.** **S**
- [ ] **G7. Full-text search** over descriptions, props and a11y notes (the ⌘K palette matches titles only). **S**
- [ ] **G8. Changelog and upgrade-guide pages** (depends on F1). **S**
- [ ] **G9. Editable examples** (Sandpack or "Open in StackBlitz"). **M**

## H. Testing and quality gates

- [x] ⭐ **H1. Behaviour tests for untested components.**
  - 22 components are never imported by a behaviour test; they're only rendered in the docs axe sweep.
  - The riskiest are **select, tabs, popover, tooltip, color-mode, copy-button and app-shell**.
  - Add a check that fails when a registry item has no test. **M**
- [ ] **H2. Real-browser tests in CI with Playwright.** Everything else runs in jsdom with CSS off. `scripts/a11y-docs.mjs` already runs axe in a real browser but isn't in CI. Add keyboard flows and 4 theme modes. **M**
- [ ] **H3. Visual regression:** screenshot each docs example in each theme. **M**
- [ ] **H4. Next.js App Router smoke test.** The docs say "should work but hasn't been verified". **M**
- [ ] **H5. Align Node version requirements and test them.**
  - The root says `>=20.19`, the CLI `^20.19.0 || >=22.12.0`, `.nvmrc` 22, and CI tests only 22.
  - Test 20.19, 22 and 24 in a matrix. **S**
- [ ] **H6. React Compiler compatibility check** (eslint-plugin-react-compiler plus a compiled build). **S**

## I. Bringing the apps up to date

These changes happen in the app repos.

- [x] ⭐ **I1. RAG: move to the Bitop CLI.** → **PR [open-rag-system#1](https://github.com/ncecere/open-rag-system/pull/1), awaiting merge.**
  - Run `bitop init --overwrite` and `add` to create a lock file; its `components.json` points at `http://127.0.0.1:4180`.
  - This picks up the fixes it lacks: the prompt-input submit race, the number-input precision fix, the menu checkbox/radio parts and command-palette `finalFocus`.
  - Update its README, which still says "shadcn CLI". **S**
- [x] ⭐ **I2. GW: move to the Bitop CLI and drop `scripts/vendor-bitop.mjs`.** → **PR [open-model-gateway#1](https://github.com/ncecere/open-model-gateway/pull/1), awaiting merge.**
  - The script hard-codes `/Users/nicholascecere/...` and hand-patches `CommandPalette`; upstream now has that `className` prop (`717dd5f`).
  - Take the newer `stat-card`. **S**
- [ ] **I3. GW: drop Tailwind.** It's installed, with `@import "tailwindcss"`, but used for only about 3 utility classes. GW also hand-builds its dialog, toast, pagination and 27 `className="button"` elements; vendoring Bitop's versions removes both. **M**
- [ ] **I4. Automated drift checks in each app:** a scheduled CI job runs `bitop diff --check` (E1), and later a bot runs `bitop update` and opens a PR. **M**

## K. Decisions needed from you

- [ ] **K1. Where to host the registry and docs.** The repo is private on the Free plan, so GitHub Pages isn't available (the Pages API returns 404) and branch protection is blocked. The options:
  - make the repo public
  - upgrade to GitHub Pro
  - host elsewhere (e.g. Cloudflare Pages)
  - keep using local checkouts

  This blocks E2, F1 (the published part), I4 and URL-based installs.
- [ ] **K2. npm scope.** Is `@bitop` available to you on npm, and should the CLI be public, or live in a private registry?
- [ ] **K3. Deferred components:**
  - `chart` (B9 proposes dependency-free SVG)
  - `persona` (would add the Rive runtime)
  - `jsx-preview` (would add `react-jsx-parser`)

  The workflow set (`canvas`, `node`, `edge`, `connection`, `controls`, `panel`, `toolbar`) stays out, as you decided.

## My suggested first batch

If you want a starting point:
1. **A1–A8:** known bugs, all small.
2. **E1 + I1 + I2:** get both apps onto the CLI and able to detect drift.
3. **B1 + B2 + C1:** `QueryState`, formatting and `<Time>`, and a `DataTable` the apps can actually use. These patterns are rebuilt most often across both apps.
4. **G1 + H1:** the docs bundle split, and tests for the riskiest untested components.

Then F1/E2, once K1 and K2 are decided.

## Follow-ups from batch 1

Found while doing the first batch. Not scheduled.

- [ ] **L1. Upstream Open RAG's `bar-chart` into bitop-ui** (and do B9 with it). Open RAG wrote `src/components/ui/bar-chart` locally, a CSS bar chart with series, stacking and an accessible summary. That goes against its own README rule ("add it to bitop-ui first"), and the CLI doesn't manage it. **M**
- [ ] **L2. A disabled state for `Attachment`.** While PromptInput is disabled, attachment remove buttons are hidden instead of shown disabled (A3), because `Attachment` has no disabled prop. **S**
- [ ] **L3. `format` docs page.** The format helpers are documented on the Time page, because the docs-page test only accepts UI items. Allow lib items to have pages. **S**
- [ ] **L4. `commit` uses its own `formatRelativeTime`.** Switching it to the shared `format` helper would change its unit choice slightly; decide whether that's wanted. **S**
- [ ] **L5. Docs command-palette copies.** The docs site keeps its own copy of `CommandPaletteTrigger` and the ⌘K hook to stay out of the entry chunk. A test now fails on drift. Splitting the registry module (trigger/hook vs dialog) would remove the copy. **S–M**
- [ ] **L6. Metadata extractor limits.** The docs metadata plugin reads each page's title, category and description statically and fails the build on JSX descriptions. It's fine today; worth knowing before writing a page with a rich description. **S**
- [ ] **L7. Exact pins for new dependencies.** The CLI installs *new* npm dependencies as `^` ranges; Open RAG pins exactly and works around it with `--no-install`. Add a `--save-exact` option (or follow the project's `save-exact` npm setting). **S**
