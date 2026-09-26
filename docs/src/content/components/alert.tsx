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

export function HttpStatus() {
  // Any error with a numeric `status` (or `response.status`) gets a plain-language title.
  const forbidden = Object.assign(new Error("Only workspace owners can manage billing."), { status: 403 });
  const rateLimited = { status: 429, message: "You can send 60 requests per minute." };
  const serverError = { response: { status: 502 } };
  return (
    <Stack gap={3}>
      <ErrorAlert error={forbidden} />
      <ErrorAlert error={rateLimited} />
      <ErrorAlert error={serverError} onRetry={() => {}} />
    </Stack>
  );
}

export function CustomMapping() {
  // Map app-specific errors; explicit title/tone props would still win.
  const error = Object.assign(new Error("Your team has reached its limit of 100 data sources."), { code: "limit_reached", status: 409 });
  const describeLimit = (e: unknown) =>
    (e as { code?: string }).code === "limit_reached" ? { title: "Team limit reached", tone: "warning" as const } : undefined;
  return <ErrorAlert error={error} describe={describeLimit} actions={<Button size="sm" variant="ghost">Request more</Button>} />;
}

const doc: ComponentDoc = {
  slug: "alert",
  title: "Alert",
  category: "Feedback",
  description: "An inline message with four tones, an optional title, trailing actions and a dismiss button. ErrorAlert turns any thrown value into a danger alert.",
  imports: `import { Alert, ErrorAlert, describeError } from "@/components/ui/alert/alert";`,
  examples: examples(raw, [
    ["Tones", Tones, { title: "Tones", wide: true }],
    ["FromError", FromError, { title: "ErrorAlert", description: "Renders nothing when error is falsy.", wide: true }],
    ["HttpStatus", HttpStatus, { title: "HTTP status and retry", description: "401, 403, 404, 408/504, 429 (warning) and 5xx get titles; onRetry adds a button.", wide: true }],
    ["CustomMapping", CustomMapping, { title: "App-specific mapping", description: "describe() is merged over describeError().", wide: true }],
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
    {
      component: "ErrorAlert",
      note: "Also accepts the Alert props. Title, message and tone come from describeError(error), then describe(error), then the title / tone props.",
      rows: [
        { name: "error", type: "unknown", required: true, description: "Error, string or anything with a message (and optionally status or response.status)." },
        { name: "onRetry", type: "() => void", description: "Shows a retry button in the actions slot." },
        { name: "retryLabel", type: "ReactNode", default: '"Try again"', description: "Retry button text." },
        { name: "retrying", type: "boolean", default: "false", description: "Shows the retry button's loading state." },
        { name: "describe", type: "(error) => Partial<{ title, message, tone }>", description: "App-specific mapping merged over describeError." },
        { name: "tone", type: "AlertTone", description: "Overrides the described tone." },
      ],
    },
    {
      component: "describeError(error)",
      note: "Pure helper, exported with errorMessage and errorStatus.",
      rows: [
        { name: "returns", type: "{ title?, message, tone, status? }", description: 'e.g. 403 → "You don\'t have access"; 429 → "Too many requests" (warning); 5xx → "Something went wrong on our side".' },
      ],
    },
  ],
  a11y: [
    'tone="danger" uses role="alert" (announced immediately); other tones use role="status".',
    "Tone is conveyed by the icon and text as well as colour.",
    'The dismiss button is labelled "Dismiss".',
    "ErrorAlert's status titles are words, not codes; a 429 is a polite warning rather than an assertive alert.",
  ],
};

export default doc;
