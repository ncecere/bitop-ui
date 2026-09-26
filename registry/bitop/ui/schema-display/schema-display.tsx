"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useMemo } from "react";
import { Badge, type BadgeProps } from "@/registry/bitop/ui/badge/badge";
import { CodeBlock, type CodeBlockProps } from "@/registry/bitop/ui/code-block/code-block";
import { cx, type Tone } from "@/registry/bitop/lib/bitop-utils";
import styles from "./schema-display.module.css";

/*
 * SchemaDisplay: an API endpoint (method + path, parameters, request and
 * response bodies) or a plain JSON Schema, with nested object / array
 * properties in Base UI Collapsibles.
 *
 *   <SchemaDisplay method="POST" path="/users/{id}/keys"
 *     description="Create an API key."
 *     parameters={[{ name: "id", type: "string", location: "path", required: true }]}
 *     requestBody={[{ name: "label", type: "string", required: true }]}
 *     responseBody={[{ name: "key", type: "object", properties: [...] }]} />
 *
 *   <SchemaDisplay title="Invoice" responseBody={schemaToProperties(invoiceJsonSchema)} responseLabel="Properties" />
 *
 * Every section and nested property is a real button (aria-expanded).
 * "required" is written out, and types are text, so nothing is colour-only.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type SchemaParameter = {
  name: string;
  type: string;
  required?: boolean;
  description?: ReactNode;
  location?: "path" | "query" | "header" | "cookie";
};

export type SchemaProperty = {
  name: string;
  type: string;
  required?: boolean;
  description?: ReactNode;
  /** Child properties of an object. */
  properties?: SchemaProperty[];
  /** Element schema of an array; object items show their properties. */
  items?: SchemaProperty;
  /** Allowed values, shown after the description. */
  enum?: (string | number | boolean | null)[];
  /** e.g. "date-time", "uuid". */
  format?: string;
};

/** The subset of JSON Schema that schemaToProperties() reads. */
export type JsonSchema = {
  type?: string | string[];
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: (string | number | boolean | null)[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
};

function jsonType(schema: JsonSchema): string {
  const union = schema.anyOf ?? schema.oneOf;
  if (union) return union.map(jsonType).join(" | ");
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array" && schema.items) {
    const inner = jsonType(schema.items);
    return inner.includes("|") ? `(${inner})[]` : `${inner}[]`;
  }
  return schema.type ?? (schema.properties ? "object" : schema.enum ? "enum" : "any");
}

function toProperty(name: string, schema: JsonSchema, required: boolean): SchemaProperty {
  const itemProps = schema.items?.properties ? schemaToProperties(schema.items) : undefined;
  return {
    name,
    type: jsonType(schema),
    required,
    description: schema.description,
    format: schema.format,
    enum: schema.enum,
    properties: schema.properties ? schemaToProperties(schema) : itemProps,
  };
}

/** Converts a JSON Schema object's `properties` into SchemaProperty rows (recursively). */
export function schemaToProperties(schema: JsonSchema): SchemaProperty[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([name, s]) => toProperty(name, s, required.has(name)));
}

const methodTone: Record<HttpMethod, Tone> = {
  GET: "success",
  POST: "info",
  PUT: "warning",
  PATCH: "warning",
  DELETE: "danger",
  HEAD: "neutral",
  OPTIONS: "neutral",
};

type SchemaDisplayContextValue = {
  method?: HttpMethod;
  path?: string;
  title?: ReactNode;
  description?: ReactNode;
  parameters?: SchemaParameter[];
  requestBody?: SchemaProperty[];
  responseBody?: SchemaProperty[];
};

const SchemaDisplayContext = createContext<SchemaDisplayContextValue>({});

export type SchemaDisplayProps = Omit<ComponentPropsWithRef<"div">, "title"> &
  SchemaDisplayContextValue & {
    /** Label of the request section (default "Request body"). */
    requestLabel?: ReactNode;
    /** Label of the response section (default "Response"). */
    responseLabel?: ReactNode;
    /** Custom composition; defaults to header, description and the three sections. */
    children?: ReactNode;
  };

export function SchemaDisplay({
  method,
  path,
  title,
  description,
  parameters,
  requestBody,
  responseBody,
  requestLabel,
  responseLabel,
  className,
  children,
  ...props
}: SchemaDisplayProps) {
  const ctx = useMemo(
    () => ({ method, path, title, description, parameters, requestBody, responseBody }),
    [method, path, title, description, parameters, requestBody, responseBody],
  );
  return (
    <SchemaDisplayContext.Provider value={ctx}>
      <div {...props} className={cx(styles.root, className)}>
        {children ?? (
          <>
            {(method || path || title) && (
              <SchemaDisplayHeader>
                {method && <SchemaDisplayMethod />}
                {path && <SchemaDisplayPath />}
                {title && <SchemaDisplayTitle />}
              </SchemaDisplayHeader>
            )}
            {description && <SchemaDisplayDescription />}
            {!!parameters?.length && <SchemaDisplayParameters />}
            {!!requestBody?.length && <SchemaDisplayRequest label={requestLabel} />}
            {!!responseBody?.length && <SchemaDisplayResponse label={responseLabel} />}
          </>
        )}
      </div>
    </SchemaDisplayContext.Provider>
  );
}

export function SchemaDisplayHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type SchemaDisplayMethodProps = Omit<BadgeProps, "tone"> & { method?: HttpMethod };

/** The HTTP method as a badge ("GET"); the text carries the meaning. */
export function SchemaDisplayMethod({ method, className, children, ...props }: SchemaDisplayMethodProps) {
  const ctx = useContext(SchemaDisplayContext);
  const m = method ?? ctx.method ?? "GET";
  return (
    <Badge {...props} tone={methodTone[m]} className={cx(styles.method, className)}>
      {children ?? m}
    </Badge>
  );
}

export type SchemaDisplayPathProps = Omit<ComponentPropsWithRef<"code">, "children"> & { path?: string };

/** The path in monospace with `{params}` emphasised. */
export function SchemaDisplayPath({ path, className, ...props }: SchemaDisplayPathProps) {
  const ctx = useContext(SchemaDisplayContext);
  const value = path ?? ctx.path ?? "";
  const parts = value.split(/(\{[^}]+\})/g).filter(Boolean);
  return (
    <code {...props} className={cx(styles.path, className)}>
      {parts.map((part, i) =>
        part.startsWith("{") ? (
          <span key={i} className={styles.pathParam}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </code>
  );
}

export function SchemaDisplayTitle({ className, children, ...props }: ComponentPropsWithRef<"p">) {
  const { title } = useContext(SchemaDisplayContext);
  return (
    <p {...props} className={cx(styles.title, className)}>
      {children ?? title}
    </p>
  );
}

export function SchemaDisplayDescription({ className, children, ...props }: ComponentPropsWithRef<"p">) {
  const { description } = useContext(SchemaDisplayContext);
  return (
    <p {...props} className={cx(styles.description, className)}>
      {children ?? description}
    </p>
  );
}

export type SchemaDisplaySectionProps = Omit<Collapsible.Root.Props, "className" | "title" | "onOpenChange"> & {
  /** The section trigger's text, e.g. "Parameters". */
  title: ReactNode;
  /** Item count shown after the title. */
  count?: number;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

/** A collapsible section (open by default). */
export function SchemaDisplaySection({ title, count, defaultOpen = true, onOpenChange, className, children, ...props }: SchemaDisplaySectionProps) {
  return (
    <Collapsible.Root
      {...props}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}
      className={cx(styles.section, className)}
    >
      <Collapsible.Trigger className={styles.sectionTrigger}>
        <ChevronRight aria-hidden className={styles.chevron} />
        <span className={styles.sectionTitle}>{title}</span>{" "}
        {count !== undefined && (
          <Badge size="sm" className={styles.count}>
            {count}
          </Badge>
        )}
      </Collapsible.Trigger>
      <Collapsible.Panel className={styles.panel}>{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}

function RequiredMark() {
  return (
    <Badge tone="danger" size="sm" variant="outline" className={styles.required}>
      required
    </Badge>
  );
}

export type SchemaDisplayParametersProps = Omit<SchemaDisplaySectionProps, "title" | "count"> & {
  title?: ReactNode;
  parameters?: SchemaParameter[];
};

export function SchemaDisplayParameters({ title = "Parameters", parameters, children, ...props }: SchemaDisplayParametersProps) {
  const ctx = useContext(SchemaDisplayContext);
  const list = parameters ?? ctx.parameters ?? [];
  return (
    <SchemaDisplaySection {...props} title={title} count={list.length}>
      <ul className={styles.rows}>{children ?? list.map((p) => <SchemaDisplayParameter key={`${p.location ?? ""}:${p.name}`} {...p} />)}</ul>
    </SchemaDisplaySection>
  );
}

export type SchemaDisplayParameterProps = Omit<ComponentPropsWithRef<"li">, "children"> & SchemaParameter;

export function SchemaDisplayParameter({ name, type, required, description, location, className, ...props }: SchemaDisplayParameterProps) {
  return (
    <li {...props} className={cx(styles.row, className)}>
      <span className={styles.line}>
        <span aria-hidden className={styles.spacer} />
        <code className={styles.name}>{name}</code> <span className={styles.type}>{type}</span>{" "}
        {location && (
          <Badge size="sm" variant="outline">
            {location}
          </Badge>
        )}{" "}
        {required && <RequiredMark />}
      </span>
      {description && <span className={styles.propDescription}>{description}</span>}
    </li>
  );
}

export type SchemaDisplayBodyProps = Omit<SchemaDisplaySectionProps, "title"> & {
  label?: ReactNode;
  properties?: SchemaProperty[];
};

export function SchemaDisplayRequest({ label, properties, children, ...props }: SchemaDisplayBodyProps) {
  const ctx = useContext(SchemaDisplayContext);
  return (
    <SchemaDisplaySection {...props} title={label ?? "Request body"}>
      {children ?? <SchemaDisplayProperties properties={properties ?? ctx.requestBody ?? []} />}
    </SchemaDisplaySection>
  );
}

export function SchemaDisplayResponse({ label, properties, children, ...props }: SchemaDisplayBodyProps) {
  const ctx = useContext(SchemaDisplayContext);
  return (
    <SchemaDisplaySection {...props} title={label ?? "Response"}>
      {children ?? <SchemaDisplayProperties properties={properties ?? ctx.responseBody ?? []} />}
    </SchemaDisplaySection>
  );
}

export type SchemaDisplayPropertiesProps = Omit<ComponentPropsWithRef<"ul">, "children"> & {
  properties: SchemaProperty[];
  /** Nesting depth of these rows (0 at the top). Nested objects start open up to depth 2. */
  depth?: number;
};

/** A list of properties; objects and arrays of objects nest. */
export function SchemaDisplayProperties({ properties, depth = 0, className, ...props }: SchemaDisplayPropertiesProps) {
  return (
    <ul {...props} className={cx(styles.rows, className)} data-depth={depth}>
      {properties.map((p) => (
        <SchemaDisplayProperty key={p.name} {...p} depth={depth} />
      ))}
    </ul>
  );
}

export type SchemaDisplayPropertyProps = Omit<ComponentPropsWithRef<"li">, "children"> &
  SchemaProperty & {
    depth?: number;
    /** Whether a nested property starts open (default: depth < 2). */
    defaultOpen?: boolean;
  };

export function SchemaDisplayProperty({
  name,
  type,
  required,
  description,
  properties,
  items,
  enum: allowed,
  format,
  depth = 0,
  defaultOpen,
  className,
  ...props
}: SchemaDisplayPropertyProps) {
  const children = properties ?? items?.properties;
  const typeLabel = items && !type.endsWith("[]") && type === "array" ? `${items.type}[]` : type;
  const line = (
    <>
      <code className={styles.name}>{name}</code>{" "}
      <span className={styles.type}>
        {typeLabel}
        {format && <span className={styles.format}>&lt;{format}&gt;</span>}
      </span>{" "}
      {required && <RequiredMark />}
    </>
  );
  const details = (description || allowed) && (
    <span className={styles.propDescription}>
      {description}
      {allowed && (
        <span className={styles.enum}>
          {description && " "}
          One of:{" "}
          {allowed.map((v, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <code>{JSON.stringify(v)}</code>
            </span>
          ))}
        </span>
      )}
    </span>
  );

  if (!children?.length) {
    return (
      <li {...props} className={cx(styles.row, className)}>
        <span className={styles.line}>
          <span aria-hidden className={styles.spacer} />
          {line}
        </span>
        {details}
      </li>
    );
  }

  return (
    <Collapsible.Root defaultOpen={defaultOpen ?? depth < 2} render={<li {...props} />} className={cx(styles.row, styles.nested, className)}>
      <Collapsible.Trigger className={styles.propertyTrigger}>
        <ChevronRight aria-hidden className={styles.chevron} />
        {line}
      </Collapsible.Trigger>
      {details}
      <Collapsible.Panel className={styles.panel}>
        <SchemaDisplayProperties properties={children} depth={depth + 1} />
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export type SchemaDisplayExampleProps = Omit<CodeBlockProps, "language"> & { language?: string };

/** An example payload as a JSON code block. */
export function SchemaDisplayExample({ language = "json", className, ...props }: SchemaDisplayExampleProps) {
  return <CodeBlock {...props} language={language} className={cx(styles.example, className)} />;
}
