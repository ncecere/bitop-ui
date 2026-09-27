import { Button } from "@/registry/bitop/ui/button/button";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import raw from "./toast.tsx?raw";

export function Tones() {
  return (
    <>
      <Button variant="secondary" onClick={() => toast.success("Deployment ready", "marketing-site is live.")}>
        Success
      </Button>
      <Button variant="secondary" onClick={() => toast.info("Build queued")}>
        Info
      </Button>
      <Button variant="secondary" onClick={() => toast.warning("Slow build", "Took 4m, 3× the usual time.")}>
        Warning
      </Button>
      <Button variant="secondary" onClick={() => toast.error("Deployment failed", "Check the build logs.")}>
        Error
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast.add({ title: "Token revoked", tone: "neutral", action: { label: "Undo", onClick: () => toast.success("Token restored") } })}
      >
        With action
      </Button>
    </>
  );
}

const doc: ComponentDoc = {
  slug: "toast",
  title: "Toast",
  category: "Feedback",
  description: "Transient notifications. Render one <Toaster /> near the root, then call toast.success(), toast.error() and friends from anywhere.",
  imports: `import { Toaster, toast, useToast } from "@/components/ui/toast/toast";`,
  baseUi: { name: "Toast", href: "https://base-ui.com/react/components/toast" },
  examples: examples(raw, [["Tones", Tones, { title: "Tones and actions" }]]),
  props: [
    {
      component: "toast",
      note: "toast.success / info / warning / error(title, description?) are shorthands for toast.add. toast.close(id?) and toast.promise are also available.",
      rows: [
        { name: "title", type: "ReactNode", required: true, description: "Main message." },
        { name: "description", type: "ReactNode", description: "Secondary text." },
        { name: "tone", type: "Tone", default: '"neutral"', description: "Colour and icon." },
        { name: "timeout", type: "number", default: "5000", description: "Auto-dismiss in ms (0 keeps it open)." },
        { name: "action", type: "{ label, onClick }", description: "A single action, e.g. Undo." },
      ],
    },
    {
      component: "Toaster",
      rows: [
        { name: "limit", type: "number", default: "3", description: "Maximum visible toasts." },
        {
          name: "position",
          type: '"bottom-right" | "bottom-center" | "bottom-left"',
          default: '"bottom-right"',
          description: "Where toasts appear. Use bottom-center when pages keep their actions at the bottom right (danger zones, sticky save bars), so toasts don't cover them. bottom-left sits over an AppShell sidebar's footer (sidebar-wide from 48rem), so toasts never cover page content.",
        },
      ],
    },
  ],
  a11y: [
    'Toasts live in a "Notifications" region announced politely; danger toasts are announced assertively.',
    "Timers pause while the pointer or focus is inside a toast; F6 moves focus to the region.",
    "Don't put the only copy of important information in a toast.",
  ],
};

export default doc;
