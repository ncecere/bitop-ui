# Bitop CLI

Copy bitop-ui components into your React project as source you own. The CLI has no runtime npm dependencies and needs Node 20 (20.19+) or 22.12+. Consumers do not need shadcn or Tailwind; shadcn is only used for registry build/schema validation in the bitop-ui repository.

## Use from a checkout

`@bitop/cli` is **not published to npm yet**. With a bitop-ui checkout next to your project, run these commands from your project:

```bash
npm install -D file:../bitop-ui/packages/cli
npx --no-install bitop init --registry ../bitop-ui
npx --no-install bitop add core button dialog
```

`npx --no-install` uses the installed CLI without downloading an unrelated package. Alternatively, skip installing the CLI and use `node ../bitop-ui/packages/cli/bin/bitop.mjs` with the same arguments.

Configure your TypeScript and bundler aliases, then import `@/components/ui/styles/bitop.css` once. See the repository's [installation guide](../../README.md#using-it-in-a-project).

## Commands

Examples below assume the local CLI is installed:

```bash
npx --no-install bitop list                   # available items (* = recorded in lock file)
npx --no-install bitop add button dialog     # includes transitive registry/npm dependencies
npx --no-install bitop diff button           # compare to registry; no writes or installs
npx --no-install bitop diff                  # compare every item recorded in bitop-lock.json
npx --no-install bitop update                # refresh all recorded items
npx --no-install bitop update button         # refresh selected item and dependencies
npx --no-install bitop add button --overwrite # replace differing files, including local edits
```

- `add` creates missing files and skips differing existing files unless `--overwrite` is set.
- `update` also replaces files unchanged since the last install. Locally edited or untracked differing files are skipped unless `--overwrite` is set. It does **not** merge edits or delete obsolete files.
- Commit `bitop-lock.json`: it records installed items and file hashes, not pinned registry versions. Skipped files retain their previous hashes.
- `init --registry <source>` writes a minimal `components.json`; it refuses an existing file unless `--overwrite` is set. With that flag it updates the Bitop registry entry while preserving existing aliases and unrelated settings.

| Option | Effect |
| --- | --- |
| `--cwd <dir>` | Use this project directory instead of the current directory. |
| `--registry <source>` | Override the configured registry source. |
| `--dry-run` | Preview without writing files or installing packages (including `init`). |
| `--diff` | Preview changes, including new files, without writing or installing. |
| `--overwrite` | Replace differing files; for `init`, update the registry configuration. |
| `--no-install` | Copy files but only print missing npm dependencies to install. |
| `--verbose` | Include unchanged files in add/update output. |
| `--check` | Write nothing; exit 1 if any file differs from the registry (missing, outdated or edited). |

The `--no-install` **before** `bitop` controls npx; the one **after** the command controls dependency installation by Bitop.

### Checking for drift in CI

`bitop diff --check` compares every installed item with the registry and exits 1 if anything differs, like `git diff --exit-code`. Run it on a schedule to find out when your copies fall behind the registry or are edited by hand:

```yaml
- run: npx --no-install bitop diff --check
```

Exit status 1 also means a command failed (the message then starts with `bitop:` on stderr).

## Configuration and sources

```json
{
  "aliases": { "ui": "@/components/ui", "lib": "@/lib" },
  "registries": { "@bitop": "../bitop-ui" }
}
```

Existing shadcn-style `components.json` files are supported; unrelated fields are ignored. Registry sources can be:

- A bitop-ui checkout: `../bitop-ui` (reads source directly; no build or server).
- A built registry directory: `../bitop-ui/public/r` or `../bitop-ui/dist/r`.
- A local path or HTTP(S) URL template: `https://host/bitop-ui/r/{name}.json`. Listing requires a template ending in `{name}.json` and a sibling `registry.json` index.

Relative paths resolve from the project directory (`--cwd`). Item arguments and registry dependencies accept `button`, `@bitop/button`, or URL-form `…/r/button.json` references. These all resolve **by item name through the configured source**; URL-form dependencies do not select an external origin. This is not a general cross-registry installer.

Aliases control rewritten imports and default disk locations. The resolver checks `tsconfig.json`, `tsconfig.app.json`, then `jsconfig.json` for matching `compilerOptions.paths` entries, preferring exact aliases then the longest wildcard prefix within each file, using the first target and `baseUrl`. It does not follow `extends` or `references`. Unmatched `@/…` aliases fall back to `src/…`.

Override disk locations explicitly when needed; locations must stay inside the project, and imports still use `aliases`:

```json
"bitop": { "paths": { "ui": "src/components/ui", "lib": "src/lib" } }
```

## Dependencies and trust

Bitop rewrites its registry import prefixes in code files and copies CSS verbatim. Registry file targets must stay under the configured `ui`/`lib` directories, and symlink writes are refused. It also writes `components.json` during init and `bitop-lock.json` during installation.

Missing npm dependencies are installed using the detected lockfile's package manager (npm by default; pnpm, Yarn and Bun are supported). Packages already declared in dependencies, devDependencies, peerDependencies or optionalDependencies keep their versions; Bitop does not check their compatibility.

Use trusted registry sources and npm packages. Copied source becomes part of your application, and npm package installation **may run lifecycle scripts**. Bitop does not execute registry-provided installer hooks, but this is not a sandbox. Use `--dry-run`, `--diff` or Bitop's `--no-install` to review before installation.
