"use client";

import { Accordion } from "@base-ui/react/accordion";
import { Bot, ChevronDown } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useId } from "react";
import { Badge } from "@/registry/bitop/ui/badge/badge";
import { CodeBlock } from "@/registry/bitop/ui/code-block/code-block";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./agent.module.css";

/*
 * Agent: a card describing an agent definition: its name and model, the
 * system instructions, the tools it can call (a Base UI Accordion, one
 * panel per tool with its input schema) and its output schema.
 *
 *   <Agent>
 *     <AgentHeader name="Research assistant" model="claude-sonnet-4" />
 *     <AgentContent>
 *       <AgentInstructions>Answer with citations…</AgentInstructions>
 *       <AgentTools>
 *         <AgentTool name="search_web" description="Search the web" schema={{ type: "object", … }} />
 *       </AgentTools>
 *       <AgentOutput schema={`z.object({ answer: z.string() })`} />
 *     </AgentContent>
 *   </Agent>
 *
 * The card is a <section> named by the agent's name. Tool rows are
 * accordion triggers (buttons with aria-expanded) inside headings.
 */

const AgentContext = createContext<string | undefined>(undefined);

export type AgentProps = ComponentPropsWithRef<"section">;

export function Agent({ className, children, ...props }: AgentProps) {
  const nameId = useId();
  return (
    <AgentContext.Provider value={nameId}>
      <section aria-labelledby={nameId} {...props} className={cx(styles.root, className)}>
        {children}
      </section>
    </AgentContext.Provider>
  );
}

export type AgentHeaderProps = Omit<ComponentPropsWithRef<"div">, "children"> & {
  /** The agent's name; it names the card. */
  name: string;
  /** Model id, shown as a monospace badge. */
  model?: string;
  /** Decorative icon (default: a bot). */
  icon?: ReactNode;
  /** Extra content on the right, e.g. actions. */
  actions?: ReactNode;
};

export function AgentHeader({ name, model, icon, actions, className, ...props }: AgentHeaderProps) {
  const nameId = useContext(AgentContext);
  return (
    <div {...props} className={cx(styles.header, className)}>
      <span aria-hidden className={styles.icon}>
        {icon ?? <Bot />}
      </span>
      <span id={nameId} className={styles.name}>
        {name}
      </span>
      {model && (
        <Badge size="sm" className={styles.model}>
          <span className="sr-only">Model: </span>
          {model}
        </Badge>
      )}
      {actions && <span className={styles.actions}>{actions}</span>}
    </div>
  );
}

export type AgentContentProps = ComponentPropsWithRef<"div">;

export function AgentContent({ className, ...props }: AgentContentProps) {
  return <div {...props} className={cx(styles.content, className)} />;
}

type SectionProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  /** Section label (default depends on the section). */
  label?: ReactNode;
};

function Section({ label, labelId, className, children, ...props }: SectionProps & { labelId: string }) {
  return (
    <div role="group" aria-labelledby={labelId} {...props} className={cx(styles.section, className)}>
      <p id={labelId} className={styles.sectionLabel}>
        {label}
      </p>
      {children}
    </div>
  );
}

export type AgentInstructionsProps = SectionProps;

/** The system prompt. Long text wraps; whitespace and line breaks are kept. */
export function AgentInstructions({ label = "Instructions", children, ...props }: AgentInstructionsProps) {
  const id = useId();
  return (
    <Section {...props} label={label} labelId={id}>
      <div className={styles.instructions}>{children}</div>
    </Section>
  );
}

export type AgentToolsProps = Omit<Accordion.Root.Props<string>, "className" | "onValueChange"> & {
  label?: ReactNode;
  className?: string;
  onValueChange?: (value: string[]) => void;
};

/** The agent's tools. Pass `multiple` to let several tool panels stay open. */
export function AgentTools({ label = "Tools", className, onValueChange, children, ...props }: AgentToolsProps) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={cx(styles.section, className)}>
      <p id={id} className={styles.sectionLabel}>
        {label}
      </p>
      <Accordion.Root<string>
        {...props}
        onValueChange={onValueChange ? (v) => onValueChange(v as string[]) : undefined}
        className={styles.tools}
      >
        {children}
      </Accordion.Root>
    </div>
  );
}

export type AgentToolProps = {
  /** Tool name, e.g. "search_web" (also the accordion item value unless `value` is set). */
  name: string;
  description?: ReactNode;
  /** Input schema (JSON Schema object or any JSON value), shown as pretty JSON. A string is shown as-is. */
  schema?: unknown;
  /** Language of a string schema (default "json"). */
  schemaLanguage?: string;
  value?: string;
  /** Heading level wrapping the trigger (default 3). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  disabled?: boolean;
  className?: string;
};

function formatSchema(schema: unknown): string {
  if (typeof schema === "string") return schema;
  try {
    return JSON.stringify(schema, null, 2) ?? String(schema);
  } catch {
    return String(schema);
  }
}

export function AgentTool({ name, description, schema, schemaLanguage, value, headingLevel = 3, disabled, className }: AgentToolProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Accordion.Item value={value ?? name} disabled={disabled} className={cx(styles.tool, className)}>
      <Accordion.Header render={<Heading />} className={styles.toolHeading}>
        <Accordion.Trigger className={styles.toolTrigger}>
          <code className={styles.toolName}>{name}</code>
          {description && <span className={styles.toolDescription}>{description}</span>}
          <ChevronDown aria-hidden className={styles.chevron} />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel className={styles.toolPanel}>
        <div className={styles.toolBody}>
          {schema === undefined ? (
            <p className={styles.empty}>No input parameters.</p>
          ) : (
            <CodeBlock
              code={formatSchema(schema)}
              language={typeof schema === "string" ? (schemaLanguage ?? "json") : "json"}
              filename="Input schema"
              maxHeight="20rem"
            />
          )}
        </div>
      </Accordion.Panel>
    </Accordion.Item>
  );
}

export type AgentOutputProps = SectionProps & {
  /** The output schema source (e.g. a Zod or TypeScript type) or a JSON Schema object. */
  schema: unknown;
  /** Language of a string schema (default "typescript"). */
  language?: string;
};

export function AgentOutput({ label = "Output schema", schema, language = "typescript", ...props }: AgentOutputProps) {
  const id = useId();
  const code = formatSchema(schema);
  return (
    <Section {...props} label={label} labelId={id}>
      <CodeBlock code={code} language={typeof schema === "string" ? language : "json"} hideHeader maxHeight="20rem" />
    </Section>
  );
}
