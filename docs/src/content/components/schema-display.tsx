import { SchemaDisplay, SchemaDisplayExample, SchemaDisplayResponse, schemaToProperties, type JsonSchema } from "@/registry/bitop/ui/schema-display/schema-display";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./schema-display.tsx?raw";

export function Endpoint() {
  return (
    <div className={styles.stack}>
      <SchemaDisplay
        method="POST"
        path="/v1/projects/{projectId}/keys"
        description="Create an API key for a project. The secret is returned once."
        parameters={[
          { name: "projectId", type: "string", location: "path", required: true, description: "The project's ID." },
          { name: "Idempotency-Key", type: "string", location: "header", description: "Retries with the same key return the first result." },
        ]}
        requestBody={[
          { name: "label", type: "string", required: true, description: "Shown in the dashboard." },
          { name: "scopes", type: "string[]", enum: ["read", "write", "admin"] },
          { name: "expiresAt", type: "string", format: "date-time" },
        ]}
        responseBody={[
          { name: "id", type: "string", required: true },
          { name: "secret", type: "string", required: true, description: "Store it now; it can't be shown again." },
          {
            name: "owner",
            type: "object",
            properties: [
              { name: "id", type: "string", required: true },
              { name: "email", type: "string", format: "email" },
            ],
          },
        ]}
      />
    </div>
  );
}

export function JsonSchemaExample() {
  const invoice: JsonSchema = {
    type: "object",
    required: ["id", "lines"],
    properties: {
      id: { type: "string", description: "Invoice number, e.g. INV-2041." },
      status: { type: "string", enum: ["draft", "open", "paid"] },
      lines: {
        type: "array",
        items: {
          type: "object",
          required: ["sku", "quantity"],
          properties: {
            sku: { type: "string" },
            quantity: { type: "integer" },
            unitPrice: { type: "number", description: "In the invoice currency." },
          },
        },
      },
      paidAt: { type: ["string", "null"], format: "date-time" },
    },
  };
  return (
    <div className={styles.stack}>
      <SchemaDisplay title="Invoice">
        <SchemaDisplayResponse label="Properties" properties={schemaToProperties(invoice)} />
        <SchemaDisplayExample code={JSON.stringify({ id: "INV-2041", status: "open", lines: [{ sku: "SEAT", quantity: 3 }] }, null, 2)} filename="Example" />
      </SchemaDisplay>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "schema-display",
  title: "Schema display",
  category: "AI",
  description: "An API endpoint or JSON Schema: method and path, parameters, request and response bodies with nested, collapsible properties.",
  imports: `import { SchemaDisplay, schemaToProperties } from "@/components/ui/schema-display/schema-display";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Endpoint", Endpoint, { title: "Endpoint", wide: true }],
    ["JsonSchemaExample", JsonSchemaExample, { title: "JSON Schema", description: "schemaToProperties() turns a JSON Schema into rows; arrays of objects nest their item properties.", wide: true }],
  ]),
  props: [
    {
      component: "SchemaDisplay",
      note: "Also accepts native <div> props. Without children it renders the header, description and the non-empty sections.",
      rows: [
        { name: "method", type: '"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"', description: "HTTP method badge." },
        { name: "path", type: "string", description: "Path; {params} are emphasised." },
        { name: "title", type: "ReactNode", description: "Heading for schemas without an endpoint." },
        { name: "description", type: "ReactNode", description: "Paragraph under the header." },
        { name: "parameters", type: "SchemaParameter[]", description: "{ name, type, required?, description?, location? }." },
        { name: "requestBody / responseBody", type: "SchemaProperty[]", description: "{ name, type, required?, description?, properties?, items?, enum?, format? }." },
        { name: "requestLabel / responseLabel", type: "ReactNode", description: "Section titles (default “Request body”, “Response”)." },
      ],
    },
    {
      component: "SchemaDisplaySection",
      note: "Base UI Collapsible.Root props; SchemaDisplayParameters, SchemaDisplayRequest and SchemaDisplayResponse build on it.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Trigger text." },
        { name: "count", type: "number", description: "Badge after the title." },
        { name: "defaultOpen", type: "boolean", default: "true", description: "Sections start open." },
      ],
    },
    {
      component: "SchemaDisplayProperty",
      rows: [
        { name: "depth", type: "number", default: "0", description: "Nesting depth." },
        { name: "defaultOpen", type: "boolean", default: "depth < 2", description: "Whether a nested object starts open." },
      ],
      note: "Plus the SchemaProperty fields. SchemaDisplayExample is a JSON CodeBlock.",
    },
  ],
  a11y: [
    "Sections and nested objects are real buttons with aria-expanded; their names include the property name, type and “required”.",
    "“required” is written out and the method is text, so nothing relies on colour.",
    "Properties are nested lists, so screen readers announce the depth.",
  ],
};

export default doc;
