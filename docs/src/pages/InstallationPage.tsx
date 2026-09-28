import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { componentDocs } from "../content";
import { C, CodeBlock, DocSection, InstallCommand, Prose } from "../kit/kit";
import { Link } from "../router";
import { registryTemplate } from "../site";
import styles from "./pages.module.css";

const cliInstall = `npm install -D @bitop-dev/cli

# check it works
npx @bitop-dev/cli --help`;

const initCommand = `# Choose ONE source:
npx @bitop-dev/cli init --registry "${registryTemplate}"
# OR a checkout (nothing to build or serve):
npx @bitop-dev/cli init --registry ../bitop-ui`;

const componentsJson = `{
  "aliases": {
    "ui": "@/components/ui",
    "lib": "@/lib"
  },
  "registries": {
    "@bitop": "${registryTemplate}"
  }
}`;

const updating = `npx @bitop-dev/cli diff button             # compare without writing
npx @bitop-dev/cli update                  # refresh installed items; skip local edits
npx @bitop-dev/cli add button --overwrite  # replace even your edits
npx @bitop-dev/cli list                    # registry items (* = installed)`;

const tsconfig = `// tsconfig.json (and tsconfig.app.json in the Vite template)
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}`;

const viteConfig = `// vite.config.ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});`;

const mainTsx = `// src/main.tsx
import "@/components/ui/styles/bitop.css"; // font, tokens, neutral theme, base styles
import "@/components/ui/themes/acme.css";  // optional: your own brand theme, after bitop.css`;

const noFlash = `<!-- index.html, inside <head>: apply the saved colour mode before first paint -->
<script>
  (function(){try{var m=localStorage.getItem("bitop-color-mode");var d=m==="dark"||(m!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})();
</script>`;

const usage = `import { Button } from "@/components/ui/button/button";
import { Dialog, DialogClose } from "@/components/ui/dialog/dialog";

export function NewProject() {
  return (
    <Dialog
      trigger={<Button>New project</Button>}
      title="New project"
      footer={<DialogClose>Cancel</DialogClose>}
    >
      …
    </Dialog>
  );
}`;

const tree = `src/
├─ components/ui/
│  ├─ styles/     bitop.css, tokens.css, global.css, popup.module.css   (core)
│  ├─ themes/     neutral.css (theme-neutral)
│  ├─ button/     button.tsx, button.module.css
│  └─ dialog/     dialog.tsx, dialog.module.css
└─ lib/
   └─ bitop-utils.ts                                                     (core)`;

export function InstallationPage() {
  const all = componentDocs.map((d) => d.slug);
  return (
    <article className={styles.page}>
      <PageHeader
        title="Installation"
        description="Set up a React project and copy bitop-ui items into it with the bitop CLI. No Tailwind required."
      />

      <DocSection id="requirements" title="Requirements">
        <Prose>
          <ul>
            <li>
              <strong>React 19</strong> (components take <C>ref</C> as a prop) and <strong>TypeScript</strong>.
            </li>
            <li>
              A bundler with <strong>CSS Modules</strong> and CSS <C>@import</C> of npm packages: Vite (verified with the <C>react-ts</C> template) or Next.js.
            </li>
            <li>
              An <C>@/*</C> import alias that points at your source folder, in both TypeScript and the bundler.
            </li>
            <li>Node 20 (20.19+) or 22.12+ to run the CLI.</li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection id="alias" title="1. Configure the import alias" description="The CLI rewrites imports to your aliases, so they must resolve in TypeScript and Vite.">
        <CodeBlock code={tsconfig} label="tsconfig paths" language="json" />
        <CodeBlock code={viteConfig} label="Vite config" language="ts" />
      </DocSection>

      <DocSection id="cli" title="2. Add the bitop CLI" description="A small Node script with no runtime npm dependencies, published as @bitop-dev/cli. Add it as a dev dependency so the whole project uses the same version.">
        <CodeBlock code={cliInstall} label="install the CLI" language="bash" />
        <Prose>
          <p>
            <C>npx @bitop-dev/cli</C> runs your project's copy, or downloads the package for a one-off run. Use it rather than <C>npx bitop</C>: without a
            local install, that would fetch whatever npm package is named <C>bitop</C>. Consumers need neither shadcn nor Tailwind; shadcn is only used for
            development-time registry build/schema validation.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="components-json" title="3. Create components.json" description="Choose one init command, not both. For an existing components.json, add the registry entry manually to preserve your settings.">
        <CodeBlock code={initCommand} label="init command" language="bash" />
        <CodeBlock code={componentsJson} label="components.json" language="json" />
        <Prose>
          <p>
            <C>aliases.ui</C> and <C>aliases.lib</C> decide where files go (found through your tsconfig <C>paths</C>) and how imports between items are
            written. <C>registries["@bitop"]</C> is where items come from: a bitop-ui checkout, a built registry folder (<C>public/r</C>), or a URL with a{" "}
            <C>{"{name}"}</C> placeholder. Existing shadcn-style configuration is supported; unrelated fields are ignored. URL-form registry dependencies
            resolve by item name through this configured source, not from external origins.
          </p>
          <p>
            Alias resolution checks <C>tsconfig.json</C>, <C>tsconfig.app.json</C>, then <C>jsconfig.json</C>; it does not follow <C>extends</C> or{" "}
            <C>references</C>. Unmatched <C>@/…</C> aliases fall back to <C>src/…</C>. Set <C>bitop.paths.ui</C> and <C>bitop.paths.lib</C> in{" "}
            <C>components.json</C> to override disk locations without changing import aliases.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="core" title="4. Add the core and a theme">
        <Prose>
          <p>
            <C>core</C> installs the tokens, base styles, Inter font and helpers, and pulls in the default neutral theme. For your own brand colours, add
            a brand theme (see Theming).
          </p>
        </Prose>
        <InstallCommand items={["core"]} label="core install command" />
        <Prose>
          <p>Then import the stylesheet once, before any other CSS:</p>
        </Prose>
        <CodeBlock code={mainTsx} label="stylesheet imports" language="tsx" />
        <Prose>
          <p>
            For dark mode, add the <TextLink render={<Link to="/components/color-mode" />}>color-mode</TextLink> item (or set <C>data-theme="dark"</C> on{" "}
            <C>&lt;html&gt;</C> yourself) and inline this script to avoid a flash of the light theme:
          </p>
        </Prose>
        <CodeBlock code={noFlash} label="no-flash script" language="html" />
      </DocSection>

      <DocSection id="components" title="5. Add components">
        <InstallCommand items={["dialog", "table"]} label="component install command" />
        <Prose>
          <p>Dependencies (other items and npm packages) are installed automatically; npm packages your project already lists are left alone, pins included. Use trusted sources: package installation may run lifecycle scripts. Add <C>--no-install</C> after the Bitop command to copy files but only print missing dependencies. Files land next to each other:</p>
        </Prose>
        <CodeBlock code={tree} label="file tree" language="text" />
        <CodeBlock code={usage} label="usage example" language="tsx" />
        <Prose>
          <p>To install everything at once:</p>
        </Prose>
        <InstallCommand items={all} label="install-all command" />
      </DocSection>

      <DocSection id="updating" title="6. Update and compare">
        <CodeBlock code={updating} label="update commands" language="bash" />
        <Prose>
          <p>
            <C>bitop-lock.json</C> records what each install wrote, so <C>update</C> can tell your edits from upstream changes: files you changed are skipped
            (and listed) unless you pass <C>--overwrite</C>. Updates do not merge edits or delete obsolete files. Add <C>--dry-run</C> to preview without
            writing files or installing packages. Commit the lock file; it tracks file hashes, not pinned registry versions.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="notes" title="Notes">
        <Prose>
          <ul>
            <li>
              <strong>Helpers live in </strong>
              <C>lib/bitop-utils.ts</C>, not <C>lib/utils.ts</C>, so bitop-ui never overwrites shadcn/ui's <C>cn</C> helper. Both libraries can live in one
              project.
            </li>
            <li>
              <strong>Every component is a folder</strong> (<C>ui/button/button.tsx</C> + <C>button.module.css</C>). Import from{" "}
              <C>@/components/ui/button/button</C>.
            </li>
            <li>
              <strong>CSS Module types</strong> come from <C>vite/client</C> (already in the Vite template's <C>types</C>) or <C>next-env.d.ts</C>.
            </li>
            <li>
              <strong>Safety</strong>: registry files must land inside your configured <C>ui</C> and <C>lib</C> folders; symlink writes are refused.
              The CLI also writes configuration and lock files, and invokes your package manager unless disabled. Copied code and npm dependencies must be trusted.
            </li>
            <li>
              <strong>React Server Components</strong>: components that use hooks or Base UI start with <C>"use client"</C> (harmless in Vite). Next.js App
              Router should work but hasn't been verified yet.
            </li>
          </ul>
        </Prose>
      </DocSection>
    </article>
  );
}
