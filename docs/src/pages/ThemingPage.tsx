import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { C, CodeBlock, DocSection, InstallCommand, Prose } from "../kit/kit";
import { Link } from "../router";
import styles from "./pages.module.css";

const swatches: { name: string; note: string }[] = [
  { name: "--color-bg", note: "App background" },
  { name: "--color-surface", note: "Cards, inputs, tables" },
  { name: "--color-surface-sunken", note: "Wells, code, table head" },
  { name: "--color-text", note: "Body text" },
  { name: "--color-text-muted", note: "Secondary text (≥ 4.5:1)" },
  { name: "--color-text-subtle", note: "Placeholders, meta (≥ 4.5:1)" },
  { name: "--color-border-strong", note: "Control boundaries (≥ 3:1)" },
  { name: "--color-primary", note: "Primary actions" },
  { name: "--color-primary-subtle", note: "Active nav tint" },
  { name: "--color-highlight", note: "Decorative accent only" },
  { name: "--color-danger", note: "Destructive actions" },
  { name: "--color-success-dot", note: "Status dot" },
  { name: "--color-warning-dot", note: "Status dot" },
  { name: "--color-info-dot", note: "Status dot" },
];

const tokenGroups: [string, string][] = [
  ["Surfaces", "--color-bg, --color-surface, -raised, -sunken, -hover, -active, --color-control, -hover, -disabled, --color-thumb, --color-overlay"],
  ["Text", "--color-text, -muted, -subtle, -inverse, --color-link, --color-link-hover"],
  ["Borders", "--color-border (decorative), -muted, -emphasis, --color-border-strong (controls, ≥ 3:1), --color-border-hover"],
  ["Brand", "--color-primary, -hover, -active, -contrast, -subtle, -subtle-text, --color-highlight (decorative)"],
  ["Status", "--color-{danger,success,warning,info}, plus -subtle, -text, -dot, -border; --color-danger-hover, -contrast; --color-neutral-{subtle,text,dot}"],
  ["Focus", "--color-focus-ring (≥ 3:1), --color-focus-halo, --shadow-focus"],
  ["Elevation", "--shadow-0 … --shadow-4, --shadow-ring, --shadow-control(-hover), --shadow-primary(-hover), --shadow-danger(-hover), --shadow-button-highlight"],
  ["Spacing", "--space-0 … --space-12 (0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80 px)"],
  ["Radius", "--radius-1 … -5 (4/6/8/12/16), --radius-full, --radius-control, --radius-card, --radius-popover, --radius-pill"],
  ["Type", "--font-family-sans, -mono, --font-features, --font-size-{xs…3xl} (12–30), --font-weight-*, --line-height-*, --letter-spacing-*"],
  ["Sizes", "--control-height-{sm,md,lg} (32/36/40), --content-max-width, --sidebar-width(-collapsed), --topbar-height"],
  ["Z-index", "--z-sticky, -sidebar, -dropdown, -overlay, -modal, -popover, -toast, -tooltip"],
  ["Motion", "--motion-duration-{fast,normal,slow} (120/160/180 ms), --motion-ease-out, --motion-ease-in-out"],
];

const customTheme = `/* src/components/ui/themes/acme.css: import it after bitop.css */
[data-brand="acme"],
[data-brand="acme"] [data-theme="light"] {
  --color-primary: #0f766e;            /* white text 5.47:1 */
  --color-primary-hover: #115e59;
  --color-primary-active: #134e4a;
  --color-primary-subtle: #f0fdfa;
  --color-primary-subtle-text: #115e59;
  --color-link: #0f766e;
  --color-focus-ring: #0f766e;
  --color-focus-halo: rgba(15, 118, 110, 0.2);
  --color-highlight: #f59e0b;          /* decorative only */
  --shadow-focus: 0 0 0 1px var(--color-focus-ring), 0 0 0 4px var(--color-focus-halo);
}

[data-brand="acme"][data-theme="dark"],
[data-theme="dark"] [data-brand="acme"],
[data-brand="acme"] [data-theme="dark"] {
  --color-primary: #0f766e;            /* white text 5.47:1 */
  /* …the same tokens with dark values */
}`;

const darkSnippet = `<html data-theme="dark">                 <!-- whole page -->
<section data-theme="dark">…</section>    <!-- or just a subtree -->
<html data-brand="uf" data-theme="dark">  <!-- brand + mode -->`;

export function ThemingPage() {
  return (
    <article className={styles.page}>
      <PageHeader title="Theming" description="Everything visual is a CSS custom property. Themes are small CSS files that override semantic tokens." />

      <DocSection id="how" title="How it works">
        <Prose>
          <ul>
            <li>
              <strong>Structural tokens</strong> (spacing, radii, type, sizes, z-index, motion) live in <C>styles/tokens.css</C>.
            </li>
            <li>
              <strong>Colours and shadows</strong> live in a theme. <C>themes/neutral.css</C> is the default: a primitive palette (<C>--palette-*</C>) mapped to
              semantic tokens (<C>--color-*</C>, <C>--shadow-*</C>) for light (<C>:root</C>) and dark (<C>[data-theme="dark"]</C>).
            </li>
            <li>
              <strong>Components read semantic tokens only</strong>, never palette values or hex codes. Variants are data attributes (
              <C>data-variant="danger"</C>) styled in each component's CSS Module.
            </li>
            <li>
              <C>global.css</C> puts the reset and base styles in cascade layers, so your unlayered CSS (and the components' CSS Modules) always win.
            </li>
          </ul>
        </Prose>
      </DocSection>

      <DocSection id="colours" title="Current colours" description="Live values from the theme and mode picked in the header.">
        <ul className={styles.swatches}>
          {swatches.map((t) => (
            <li key={t.name} className={styles.swatch}>
              <span aria-hidden className={styles.chip} style={{ background: `var(${t.name})` }} />
              <code className={styles.swatchName}>{t.name}</code>
              <span className={styles.swatchNote}>{t.note}</span>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="tokens" title="Token reference">
        <Table framed caption="Design tokens by group" columns={["Group", "Tokens"]} density="compact">
          {tokenGroups.map(([group, tokens]) => (
            <Tr key={group}>
              <Td nowrap>{group}</Td>
              <Td>
                <code>{tokens}</code>
              </Td>
            </Tr>
          ))}
        </Table>
      </DocSection>

      <DocSection id="dark-mode" title="Dark mode">
        <Prose>
          <p>
            Every semantic token has a dark value under <C>[data-theme="dark"]</C>. Set the attribute on <C>&lt;html&gt;</C> for the whole page or on any
            element for a subtree; <C>data-theme="light"</C> switches back inside a dark area.
          </p>
        </Prose>
        <CodeBlock code={darkSnippet} label="dark mode markup" language="html" />
        <Prose>
          <p>
            The <TextLink render={<Link to="/components/color-mode" />}>color-mode</TextLink> item manages the attribute for you (saved choice or{" "}
            <C>prefers-color-scheme</C>) and includes a toggle and a no-flash script.
          </p>
        </Prose>
      </DocSection>

      <DocSection id="uf" title="UF theme">
        <Prose>
          <p>
            <C>theme-uf</C> reproduces the University of Florida palette (blue <C>#0021A5</C>, orange <C>#FA4616</C>) by overriding the brand tokens
            only. It is opt-in: import it after <C>bitop.css</C> and set <C>data-brand="uf"</C>.
          </p>
        </Prose>
        <InstallCommand items={["theme-uf"]} label="UF theme install command" />
        <CodeBlock code={`import "@/components/ui/themes/uf.css";\n\n<html data-brand="uf">`} label="UF theme usage" language="tsx" />
        <Prose>
          <p>UF orange is 3.53:1 on white, so it is used for decorative marks only, never for text or control boundaries.</p>
        </Prose>
      </DocSection>

      <DocSection id="custom" title="Make your own theme">
        <Prose>
          <ol>
            <li>
              Copy <C>themes/uf.css</C> to <C>themes/acme.css</C> and change the selector to <C>[data-brand="acme"]</C>. Override only semantic tokens.
            </li>
            <li>Give every token you override a dark value too, in the dark selector block.</li>
            <li>
              Check contrast: text pairs ≥ 4.5:1, control boundaries and focus rings ≥ 3:1. The repo's <C>tests/contrast.test.ts</C> shows how to automate it.
            </li>
            <li>
              Import the file after <C>bitop.css</C> and set <C>data-brand="acme"</C>. To change the default for the whole app instead, edit{" "}
              <C>themes/neutral.css</C> directly: you own it.
            </li>
          </ol>
        </Prose>
        <CodeBlock code={customTheme} label="custom theme" language="css" />
      </DocSection>
    </article>
  );
}
