import { Alert } from "@/registry/bitop/ui/alert/alert";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { componentDocs } from "../content";
import { C, CodeBlock, DocSection, InstallTabs, Prose } from "../kit/kit";
import { Link } from "../router";
import { REGISTRY_URL, itemUrl } from "../site";
import styles from "./pages.module.css";

const componentsJson = `{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  },
  "registries": {
    "@bitop": "${REGISTRY_URL}/{name}.json"
  }
}`;

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
import "@/components/ui/themes/uf.css";    // optional brand theme, after bitop.css`;

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
│  ├─ themes/     neutral.css (theme-neutral), uf.css (theme-uf)
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
        description="Set up a React project to install bitop-ui items with the shadcn CLI. No Tailwind required."
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
            <li>Node 20 or newer to run the CLI.</li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection id="alias" title="1. Configure the import alias" description="The CLI rewrites imports to your aliases, so they must resolve in TypeScript and Vite.">
        <CodeBlock code={tsconfig} label="tsconfig paths" language="json" />
        <CodeBlock code={viteConfig} label="Vite config" language="ts" />
      </DocSection>

      <DocSection id="components-json" title="2. Create components.json">
        <Alert tone="info" title="Write it by hand">
          <C>npx shadcn init</C> stops with “No Tailwind CSS configuration found”, so create the file yourself. The <C>tailwind</C> block is required by
          the schema but unused: bitop-ui items never write to that CSS file.
        </Alert>
        <CodeBlock code={componentsJson} label="components.json" language="json" />
        <Prose>
          <p>
            The <C>registries</C> entry enables the <C>@bitop/…</C> names. The <C>ui</C> and <C>lib</C> aliases decide where files go: every file uses an{" "}
            <C>@ui/</C> or <C>@lib/</C> target, so installs follow your folders.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="core" title="3. Add the core and a theme">
        <Prose>
          <p>
            <C>core</C> installs the tokens, base styles, Inter font and helpers, and pulls in the default neutral theme. Add <C>theme-uf</C> as well if you
            want the UF brand.
          </p>
        </Prose>
        <InstallTabs items={["core"]} label="core install command" />
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

      <DocSection id="components" title="4. Add components">
        <InstallTabs items={["dialog", "table"]} label="component install command" />
        <Prose>
          <p>Dependencies (other items and npm packages) are installed automatically. Files land next to each other:</p>
        </Prose>
        <CodeBlock code={tree} label="file tree" language="text" />
        <CodeBlock code={usage} label="usage example" language="tsx" />
        <Prose>
          <p>To install everything at once:</p>
        </Prose>
        <InstallTabs items={all} label="install-all command" />
      </DocSection>

      <DocSection id="notes" title="Notes and caveats">
        <Prose>
          <ul>
            <li>
              <strong>Direct URLs need no configuration.</strong> <C>npx shadcn@latest add {itemUrl("button")}</C> works without the <C>registries</C> entry
              when the registry was built with <C>SITE_URL</C> set (the published one is), because dependencies are then absolute URLs. A registry built
              without it declares dependencies as <C>@bitop/…</C>, and installing by URL fails with “add the registry configuration under registries” until
              you add the entry above.
            </li>
            <li>
              <strong>Helpers live in </strong>
              <C>lib/bitop-utils.ts</C>, not <C>lib/utils.ts</C>, so bitop-ui never overwrites shadcn/ui's <C>cn</C> helper. Both libraries can live in one
              project.
            </li>
            <li>
              <strong>Every component is a folder</strong> (<C>ui/button/button.tsx</C> + <C>button.module.css</C>), so names never collide with shadcn/ui's
              flat files. Import from <C>@/components/ui/button/button</C>.
            </li>
            <li>
              <strong>CSS Module types</strong> come from <C>vite/client</C> (already in the Vite template's <C>types</C>) or <C>next-env.d.ts</C>.
            </li>
            <li>
              <strong>Themes ask for confirmation.</strong> Adding a <C>theme-*</C> item first on the command line prompts before “overwriting CSS variables”;
              nothing is overwritten outside the theme file. Pass <C>--yes</C> in scripts.
            </li>
            <li>
              <strong>Updating</strong>: re-run <C>add</C> with <C>--overwrite</C>, or preview changes with <C>--diff</C>. You own the files, so review the diff
              if you changed them.
            </li>
            <li>
              <strong>React Server Components</strong>: components that use hooks or Base UI start with <C>"use client"</C>. The CLI keeps the directive
              (harmless in Vite). Next.js App Router should work but hasn't been verified yet.
            </li>
            <li>The CLI drops a file's leading comment when it rewrites imports, so component notes sit below the imports.</li>
          </ul>
        </Prose>
      </DocSection>
    </article>
  );
}
