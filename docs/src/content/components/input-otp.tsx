import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Field, Form, FormActions } from "@/registry/bitop/ui/field/field";
import { InputOTP } from "@/registry/bitop/ui/input-otp/input-otp";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./input-otp.tsx?raw";

export function Verification() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "wrong" | "ok">("idle");
  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault();
        setStatus(code === "424242" ? "ok" : "wrong");
      }}
    >
      <Field
        label="Verification code"
        description={status === "ok" ? "Verified. You can close this window." : "Enter the 6-digit code we sent to •••• 4821. Try 424242."}
        error={status === "wrong" ? "That code is incorrect or has expired." : undefined}
      >
        <InputOTP
          length={6}
          groups={[3, 3]}
          value={code}
          onValueChange={(next) => {
            setCode(next);
            setStatus("idle");
          }}
        />
      </Field>
      <FormActions align="start">
        <Button type="submit" disabled={code.length < 6}>
          Verify
        </Button>
      </FormActions>
    </Form>
  );
}

export function Variants() {
  return (
    <Stack gap={5}>
      <Field label="Recovery code" description="Letters and numbers, e.g. A7C9-XZ42.">
        <InputOTP length={8} groups={[4, 4]} validationType="alphanumeric" normalizeValue={(v) => v.toUpperCase()} />
      </Field>
      <Field label="PIN" description="Hidden as you type.">
        <InputOTP length={4} mask size="sm" />
      </Field>
      <Field label="Disabled" disabled>
        <InputOTP length={6} defaultValue="123" />
      </Field>
    </Stack>
  );
}

const doc: ComponentDoc = {
  slug: "input-otp",
  title: "Input OTP",
  category: "Forms",
  description:
    "A one-time-code field with one slot per character. Typing advances, Backspace goes back and pasting a full code fills every slot. Put it in a Field for the label, description and error.",
  imports: `import { InputOTP } from "@/components/ui/input-otp/input-otp";`,
  baseUi: { name: "OTP Field", href: "https://base-ui.com/react/components/otp-field" },
  examples: examples(raw, [
    ["Verification", Verification, { title: "Verification code in a form", wide: true }],
    ["Variants", Variants, { title: "Alphanumeric, masked, small and disabled", wide: true }],
  ]),
  props: [
    {
      component: "InputOTP",
      note: "Also accepts Base UI OTPField.Root props (value, defaultValue, onValueChange, onValueComplete, onValueInvalid, normalizeValue, mask, autoSubmit, name, required, disabled, readOnly, inputMode…).",
      rows: [
        { name: "length", type: "number", required: true, description: "Number of characters." },
        { name: "groups", type: "number[]", description: "Visual groups, e.g. [3, 3]; a separator is shown between them." },
        { name: "separator", type: "ReactNode", description: "Custom separator content (decorative). Default: a dash." },
        { name: "validationType", type: '"numeric" | "alphanumeric" | "alpha" | "none"', default: '"numeric"', description: "Which characters are accepted; also sets the mobile keyboard." },
        { name: "aria-label", type: "string", description: "Accessible name when not inside a labelled Field." },
        { name: "slotLabel", type: "(position, length) => string", default: '"Character 2 of 6"', description: "Names of slots 2…n (translate here)." },
        { name: "size", type: '"sm" | "md"', default: '"md"', description: "Slot size." },
      ],
    },
  ],
  a11y: [
    'The slots form a role="group" named by the Field label and described by its description and error.',
    'The first slot uses the field label; the others are named "Character 2 of 6"…; only the active slot is in the tab order.',
    'The first slot has autocomplete="one-time-code" so SMS codes can be autofilled; invalid characters are rejected.',
    "Errors show as a red border plus the Field's error text and icon, never colour alone.",
  ],
};

export default doc;
