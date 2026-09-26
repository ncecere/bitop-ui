import { useState } from "react";
import {
  EnvironmentVariable,
  EnvironmentVariables,
  EnvironmentVariablesContent,
  EnvironmentVariablesHeader,
  EnvironmentVariablesTitle,
  EnvironmentVariablesToggle,
} from "@/registry/bitop/ui/environment-variables/environment-variables";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./environment-variables.tsx?raw";

export function Basic() {
  return (
    <div className={styles.stack}>
      <EnvironmentVariables>
        <EnvironmentVariablesHeader>
          <EnvironmentVariablesTitle>Production</EnvironmentVariablesTitle>
          <EnvironmentVariablesToggle />
        </EnvironmentVariablesHeader>
        <EnvironmentVariablesContent>
          <EnvironmentVariable name="DATABASE_URL" value="postgres://app:s3cr3t@db.internal:5432/app" required />
          <EnvironmentVariable name="STRIPE_SECRET_KEY" value="sk_live_51Hx9example" required description="Used by the billing worker" />
          <EnvironmentVariable name="LOG_LEVEL" value="info" />
          <EnvironmentVariable name="FEATURE_FLAGS" value="new-editor,fast-search" copyFormat="export" />
        </EnvironmentVariablesContent>
      </EnvironmentVariables>
    </div>
  );
}

export function Controlled() {
  const [show, setShow] = useState(true);
  return (
    <div className={styles.stack}>
      <EnvironmentVariables showValues={show} onShowValuesChange={setShow}>
        <EnvironmentVariablesHeader>
          <EnvironmentVariablesTitle>Preview (.env.preview)</EnvironmentVariablesTitle>
          <EnvironmentVariablesToggle label="Reveal all" />
        </EnvironmentVariablesHeader>
        <EnvironmentVariablesContent>
          <EnvironmentVariable name="NEXT_PUBLIC_API_URL" value="https://preview.api.example.com" copyFormat="dotenv" />
          <EnvironmentVariable name="SENTRY_DSN" value="" />
        </EnvironmentVariablesContent>
      </EnvironmentVariables>
      <p className={styles.muted}>Values are {show ? "shown" : "hidden"}.</p>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "environment-variables",
  title: "Environment variables",
  category: "AI",
  description: "A list of environment variables with masked values, show/hide for each variable and for all, copy buttons and required badges.",
  imports: `import { EnvironmentVariable, EnvironmentVariables, EnvironmentVariablesContent, EnvironmentVariablesHeader, EnvironmentVariablesTitle, EnvironmentVariablesToggle } from "@/components/ui/environment-variables/environment-variables";`,
  baseUi: { name: "Switch", href: "https://base-ui.com/react/components/switch" },
  examples: examples(raw, [
    ["Basic", Basic, { title: "Masked by default", description: "The eye button reveals one value; the switch reveals or hides every value and resets per-row choices.", wide: true }],
    ["Controlled", Controlled, { title: "Controlled visibility, other copy formats", wide: true }],
  ]),
  props: [
    {
      component: "EnvironmentVariables",
      note: 'Also accepts native <div> props. It is role="group", named by EnvironmentVariablesTitle.',
      rows: [
        { name: "showValues", type: "boolean", description: "Show every value (controlled)." },
        { name: "defaultShowValues", type: "boolean", default: "false", description: "Initial state." },
        { name: "onShowValuesChange", type: "(show: boolean) => void", description: "Called when the switch flips." },
      ],
    },
    {
      component: "EnvironmentVariable",
      note: "Also accepts native <li> props. Children replace the default row (compose with EnvironmentVariableName, …Value, …VisibilityToggle, …CopyButton, …Required).",
      rows: [
        { name: "name", type: "string", required: true, description: "Variable name." },
        { name: "value", type: "string", required: true, description: "Value; masked until shown." },
        { name: "required", type: "boolean", description: "Adds a “Required” badge." },
        { name: "description", type: "ReactNode", description: "Note under the name." },
        { name: "copyFormat", type: '"value" | "name" | "export" | "dotenv"', default: '"value"', description: "What the copy button copies." },
      ],
    },
    {
      component: "EnvironmentVariablesToggle",
      rows: [{ name: "label", type: "ReactNode", default: '"Show values"', description: "Switch label." }],
      note: "Other Switch props pass through.",
    },
  ],
  a11y: [
    "Masked values read as “hidden”, not a string of bullets.",
    "Each row's show/hide control is a toggle button named “Show NAME” with aria-pressed; the copy button is named “Copy NAME” and announces the result.",
    "The show-all control is a labelled Base UI switch.",
  ],
};

export default doc;
