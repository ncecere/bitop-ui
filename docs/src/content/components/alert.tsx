import { Button } from "@/registry/bitop/ui/button/button";
import { Alert, ErrorAlert } from "@/registry/bitop/ui/alert/alert";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { type ComponentDoc, examples } from "../types";
import raw from "./alert.tsx?raw";

export function Tones() {
  return (
    <Stack gap={3}>
      <Alert tone="info" title="Maintenance scheduled">
        The dashboard will be read-only on Sunday from 02:00 to 03:00 UTC.
      </Alert>
      <Alert tone="success">Your changes were saved.</Alert>
      <Alert tone="warning" title="Usage at 90%" actions={<Button size="sm" variant="secondary">Upgrade plan</Button>}>
        You are close to this month's build minutes.
      </Alert>
      <Alert tone="danger" onDismiss={() => {}}>
        The payment provider is unavailable right now.
      </Alert>
    </Stack>
  );
}

export function FromError() {
  return <ErrorAlert error={new Error("The project name is already taken.")} />;
}

const doc: ComponentDoc = {
  slug: "alert",
  title: "Alert",
  category: "Feedback",
  description: "An inline message with four tones, an optional title, trailing actions and a dismiss button. ErrorAlert turns any thrown value into a danger alert.",
  imports: `import { Alert, ErrorAlert } from "@/components/ui/alert/alert";`,
  examples: examples(raw, [
    ["Tones", Tones, { title: "Tones", wide: true }],
    ["FromError", FromError, { title: "ErrorAlert", description: "Renders nothing when error is falsy.", wide: true }],
  ]),
  props: [
    {
      component: "Alert",
      note: "Also accepts native <div> props.",
      rows: [
        { name: "tone", type: '"info" | "success" | "warning" | "danger"', default: '"info"', description: "Colour, icon and live-region role." },
        { name: "title", type: "ReactNode", description: "Bold first line." },
        { name: "actions", type: "ReactNode", description: "Trailing buttons or links." },
        { name: "onDismiss", type: "() => void", description: "Shows a dismiss button." },
        { name: "hideIcon", type: "boolean", default: "false", description: "Hide the leading icon." },
      ],
    },
    { component: "ErrorAlert", rows: [{ name: "error", type: "unknown", required: true, description: "Error, string or anything with a message." }] },
  ],
  a11y: [
    'tone="danger" uses role="alert" (announced immediately); other tones use role="status".',
    "Tone is conveyed by the icon and text as well as colour.",
    'The dismiss button is labelled "Dismiss".',
  ],
};

export default doc;
