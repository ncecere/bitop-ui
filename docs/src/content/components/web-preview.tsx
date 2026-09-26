import { useState } from "react";
import {
  WebPreview,
  WebPreviewBack,
  WebPreviewBody,
  WebPreviewConsole,
  WebPreviewForward,
  WebPreviewNavigation,
  WebPreviewOpen,
  WebPreviewReload,
  WebPreviewUrl,
  type WebPreviewLog,
} from "@/registry/bitop/ui/web-preview/web-preview";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./web-preview.tsx?raw";

export function GeneratedSite() {
  const [url, setUrl] = useState("https://example.com");
  const logs: WebPreviewLog[] = [
    { level: "log", message: "Vite dev server connected.", timestamp: new Date("2026-09-26T10:14:03") },
    { level: "warn", message: "Image is missing width and height: hero.png", timestamp: new Date("2026-09-26T10:14:04") },
    { level: "error", message: "Failed to fetch /api/events (404)", timestamp: new Date("2026-09-26T10:14:05") },
  ];
  return (
    <div className={styles.frame}>
      <WebPreview url={url} onUrlChange={setUrl}>
        <WebPreviewNavigation>
          <WebPreviewBack />
          <WebPreviewForward />
          <WebPreviewReload />
          <WebPreviewUrl />
          <WebPreviewOpen />
        </WebPreviewNavigation>
        <WebPreviewBody title="Preview of the generated events page" />
        <WebPreviewConsole logs={logs} />
      </WebPreview>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "web-preview",
  title: "Web preview",
  category: "AI",
  description: "A sandboxed iframe preview of a generated app or page, with back / forward / reload, an address field, open-in-new-tab and a console panel.",
  imports: `import { WebPreview, WebPreviewBack, WebPreviewBody, WebPreviewConsole, WebPreviewForward, WebPreviewNavigation, WebPreviewOpen, WebPreviewReload, WebPreviewUrl } from "@/components/ui/web-preview/web-preview";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [["GeneratedSite", GeneratedSite, { title: "Preview with console", wide: true }]]),
  props: [
    {
      component: "WebPreview",
      note: "Native <div> props. useWebPreview() exposes { url, navigate, back, forward, reload, canGoBack, canGoForward } for custom controls.",
      rows: [
        { name: "url / defaultUrl", type: "string", description: "Address (controlled / uncontrolled). A new controlled url is a navigation." },
        { name: "onUrlChange", type: "(url) => void", description: "Called on navigation through the bar, back or forward." },
      ],
    },
    { component: "WebPreviewNavigation", rows: [{ name: "label", type: "string", default: '"Preview navigation"', description: "Accessible name of the control group." }] },
    {
      component: "WebPreviewBack / Forward / Reload / Open",
      note: "Icon buttons with tooltips; Open is a link to the address in a new tab. WebPreviewNavigationButton takes label, icon and onClick for your own.",
      rows: [{ name: "label", type: "string", description: 'Accessible name (defaults "Back", "Forward", "Reload", "Open in new tab").' }],
    },
    {
      component: "WebPreviewUrl",
      rows: [
        { name: "label", type: "string", default: '"Address"', description: "Accessible name of the field." },
        { name: "placeholder", type: "string", default: '"Enter a URL"', description: "Placeholder. Enter navigates; bare hosts get https://." },
      ],
    },
    {
      component: "WebPreviewBody",
      note: "Other <iframe> props (allow, srcDoc, onLoad…).",
      rows: [
        { name: "title", type: "string", required: true, description: "Describes the frame's content." },
        { name: "sandbox", type: "string", default: '"allow-scripts allow-forms"', description: "Frame sandbox. Adding allow-same-origin to allow-scripts lets the page escape the sandbox; only do it for trusted content." },
        { name: "src", type: "string", description: "Override the address (e.g. a signed URL)." },
        { name: "loading", type: "ReactNode", description: "Custom loading indicator." },
        { name: "emptyText", type: "ReactNode", description: "Shown with no address." },
      ],
    },
    {
      component: "WebPreviewConsole",
      rows: [
        { name: "logs", type: "{ level, message, timestamp? }[]", description: 'Levels "log" | "info" | "warn" | "error".' },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open) => void", description: "Panel state (closed by default)." },
        { name: "label / emptyText", type: "ReactNode", description: 'Trigger text ("Console") and the empty message.' },
      ],
    },
  ],
  a11y: [
    "The iframe's title is a required prop; while it loads, the preview is aria-busy and shows a labelled spinner.",
    "Navigation buttons are native buttons with names and tooltips, disabled when there's no history; the address is a labelled text field submitted with Enter.",
    "The console trigger names its error and warning counts; each entry spells out its level, so colour is never the only cue. The log scrolls in a focusable region.",
  ],
};

export default doc;
