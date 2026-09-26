/*
 * Docs-only building blocks (not shipped in the registry): code blocks,
 * example frames, install instructions, props tables and page sections.
 * They are built from bitop-ui components, so the docs dogfood the library.
 */
import { Check, Copy } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/registry/bitop/ui/badge/badge";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { VisuallyHidden } from "@/registry/bitop/ui/visually-hidden/visually-hidden";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import { addCommand } from "../site";
import styles from "./kit.module.css";

/* ---------------- Code ---------------- */

export type CodeBlockProps = {
  code: string;
  /** Accessible name for the copy button, e.g. "install command". */
  label?: string;
  language?: string;
  className?: string;
};

export function CodeBlock({ code, label = "code", language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className={cx(styles.code, className)} data-language={language}>
      {/* A scrollable region must be keyboard-focusable (WCAG 2.1.1). */}
      <pre tabIndex={0} className={styles.pre}>
        <code>{code}</code>
      </pre>
      <Tooltip content={copied ? "Copied" : "Copy"}>
        <IconButton
          size="sm"
          className={styles.copy}
          icon={copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          label={`Copy ${label}`}
          onClick={copy}
        />
      </Tooltip>
      <VisuallyHidden role="status">{copied ? `Copied ${label} to clipboard` : ""}</VisuallyHidden>
    </div>
  );
}

/** Inline code. */
export function C({ children }: { children: ReactNode }) {
  return <code className={styles.inlineCode}>{children}</code>;
}

/* ---------------- Sections ---------------- */

export function DocSection({ id, title, children, description }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-title`} className={styles.section}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        <a href={`#${id}`} id={id} className={styles.anchor}>
          {title}
        </a>
      </h2>
      {description && <p className={styles.sectionDescription}>{description}</p>}
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.prose, className)}>{children}</div>;
}

/* ---------------- Examples ---------------- */

export type ExampleProps = {
  title: string;
  description?: ReactNode;
  code: string;
  children: ReactNode;
  /** Let the preview use the full width without centring. */
  wide?: boolean;
};

export function Example({ title, description, code, children, wide }: ExampleProps) {
  const id = useId();
  return (
    <div className={styles.example}>
      <div className={styles.exampleHead}>
        <h3 id={id} className={styles.exampleTitle}>
          {title}
        </h3>
        {description && <p className={styles.exampleDescription}>{description}</p>}
      </div>
      <div className={styles.preview} data-wide={wide ? "" : undefined} role="group" aria-labelledby={id}>
        {children}
      </div>
      <Disclosure title="Show code" className={styles.exampleCode}>
        <CodeBlock code={code} label={`${title} example code`} language="tsx" />
      </Disclosure>
    </div>
  );
}

/* ---------------- Install ---------------- */

/** The `bitop add` command for items. The registry source comes from components.json. */
export function InstallCommand({ items, label = "install command" }: { items: string[]; label?: string }) {
  return <CodeBlock code={addCommand(items)} label={label} language="bash" />;
}

/* ---------------- Props ---------------- */

export type PropRow = {
  name: string;
  type: string;
  default?: string;
  description: ReactNode;
  required?: boolean;
};

export function PropsTable({ component, rows, note }: { component: string; rows: PropRow[]; note?: ReactNode }) {
  return (
    <div className={styles.props}>
      <h3 className={styles.propsTitle}>
        <code>{component}</code>
      </h3>
      {note && <p className={styles.exampleDescription}>{note}</p>}
      {rows.length > 0 && (
      <Table framed caption={`${component} props`} columns={["Prop", "Type", "Default", "Description"]} density="compact">
        {rows.map((r) => (
          <Tr key={r.name}>
            <Td nowrap>
              <code className={styles.propName}>{r.name}</code>
              {r.required && (
                <Badge size="sm" tone="info" className={styles.required}>
                  required
                </Badge>
              )}
            </Td>
            <Td>
              <code className={styles.propType}>{r.type}</code>
            </Td>
            <Td nowrap muted>
              {r.default ? <code>{r.default}</code> : "—"}
            </Td>
            <Td>{r.description}</Td>
          </Tr>
        ))}
      </Table>
      )}
    </div>
  );
}
