#!/usr/bin/env bash
# End-to-end check that the registry installs into a fresh, Tailwind-free
# Vite + React + TypeScript app with the real shadcn CLI:
#
#   1. build the registry and docs for http://127.0.0.1:$PORT and serve them
#   2. create a Vite react-ts app, add the @/ alias and a hand-written components.json
#   3. install core, theme-uf and half the components by direct URL (no namespace)
#   4. add the @bitop namespace and install the rest as @bitop/<name>
#   5. render AppShell + Dialog + Table + CommandPalette and a small AI chat
#      (Conversation, Message, Response, Reasoning, Tool, Sources, PromptInput,
#      ModelSelector) and run `npm run build`
#
# Usage: scripts/consumer-smoke.sh [workdir]   (needs network for npm)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4175}"  # avoid fetch-blocked ports (e.g. 4190)
BASE="http://127.0.0.1:${PORT}"
WORK="${1:-$(mktemp -d)}"
APP="${WORK}/bitop-consumer"
SHADCN="${SHADCN:-shadcn@latest}"

cd "$ROOT"
SITE_URL="$BASE" npm run --silent registry:build
SITE_URL="$BASE" npx vite build --logLevel warn
npx vite preview --host 127.0.0.1 --port "$PORT" --strictPort >/dev/null 2>&1 &
PREVIEW=$!
trap 'kill $PREVIEW 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -sf "$BASE/r/core.json" >/dev/null && break; sleep 0.2; done

rm -rf "$APP" && mkdir -p "$WORK" && cd "$WORK"
npm create vite@latest bitop-consumer -- --template react-ts --no-interactive >/dev/null
cd "$APP"
npm install --silent

node -e '
const fs = require("fs");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
for (const f of ["tsconfig.json", "tsconfig.app.json"]) {
  const j = JSON.parse(strip(fs.readFileSync(f, "utf8")));
  j.compilerOptions = { ...(j.compilerOptions || {}), paths: { "@/*": ["./src/*"] } };
  fs.writeFileSync(f, JSON.stringify(j, null, 2));
}'
cat > vite.config.ts <<'EOF'
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
});
EOF
cat > components.json <<'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "", "cssVariables": true, "prefix": "" },
  "iconLibrary": "lucide",
  "aliases": { "components": "@/components", "ui": "@/components/ui", "lib": "@/lib", "utils": "@/lib/utils", "hooks": "@/hooks" }
}
EOF

ITEMS=()
while IFS= read -r name; do ITEMS+=("$name"); done < <(node -e 'for (const i of require(process.argv[1]).items) if (i.type === "registry:ui") console.log(i.name)' "$ROOT/registry.json")
HALF=$(( ${#ITEMS[@]} / 2 ))
URLS=("$BASE/r/core.json" "$BASE/r/theme-uf.json")
for n in "${ITEMS[@]:0:$HALF}"; do URLS+=("$BASE/r/$n.json"); done
echo "Installing ${#URLS[@]} items by direct URL…"
npx --yes "$SHADCN" add "${URLS[@]}" --yes </dev/null

node -e 'const fs=require("fs");const c=JSON.parse(fs.readFileSync("components.json"));c.registries={"@bitop":process.argv[1]+"/r/{name}.json"};fs.writeFileSync("components.json",JSON.stringify(c,null,2))' "$BASE"
NS=("@bitop/theme-neutral")
for n in "${ITEMS[@]:$HALF}"; do NS+=("@bitop/$n"); done
echo "Installing ${#NS[@]} items with the @bitop namespace…"
npx --yes "$SHADCN" add "${NS[@]}" --yes </dev/null

cat > src/main.tsx <<'EOF'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/components/ui/styles/bitop.css";
import "@/components/ui/themes/uf.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
EOF
cat > src/App.tsx <<'EOF'
import { useState } from "react";
import { AppShell, Brand, Main, Sidebar, SidebarContent, SidebarHeader, SidebarItem, SidebarNav, SidebarSection, TopBar } from "@/components/ui/app-shell/app-shell";
import { Button } from "@/components/ui/button/button";
import { CommandPalette, CommandPaletteTrigger } from "@/components/ui/command-palette/command-palette";
import { Dialog, DialogClose } from "@/components/ui/dialog/dialog";
import { Table, Td, Tr } from "@/components/ui/table/table";
import { Conversation, ConversationAnnouncer, ConversationContent, ConversationScrollButton } from "@/components/ui/conversation/conversation";
import { Message, MessageActions, MessageContent, MessageCopyAction } from "@/components/ui/message/message";
import { ModelSelector } from "@/components/ui/model-selector/model-selector";
import { PromptInput, PromptInputSubmit, PromptInputTextarea, PromptInputToolbar } from "@/components/ui/prompt-input/prompt-input";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ui/reasoning/reasoning";
import { Response } from "@/components/ui/response/response";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ui/sources/sources";
import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ui/tool/tool";

const sources = [{ title: "Policy", href: "https://example.com/policy" }];

function Chat() {
  const [text, setText] = useState("Paid leave is **16 weeks** [1].");
  return (
    <div style={{ height: "30rem", display: "flex", flexDirection: "column" }}>
      <Conversation>
        <ConversationContent>
          <Message from="user">
            <MessageContent>What's the policy?</MessageContent>
          </Message>
          <Message from="assistant">
            <MessageContent>
              <Reasoning duration={2}>
                <ReasoningTrigger />
                <ReasoningContent>Checking.</ReasoningContent>
              </Reasoning>
              <Tool>
                <ToolHeader name="search" state="completed" />
                <ToolContent>
                  <ToolInput input={{ q: "leave" }} />
                </ToolContent>
              </Tool>
              <Response citations={sources}>{text}</Response>
              <Sources>
                <SourcesTrigger count={1} />
                <SourcesContent>
                  <Source index={1} title="Policy" href="https://example.com/policy" />
                </SourcesContent>
              </Sources>
            </MessageContent>
            <MessageActions>
              <MessageCopyAction value={text} />
            </MessageActions>
          </Message>
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={({ text: t }) => setText(t)}>
        <PromptInputTextarea />
        <PromptInputToolbar>
          <ModelSelector label="Model" models={[{ id: "m", name: "Model", provider: "Acme" }]} defaultValue="m" />
          <PromptInputSubmit />
        </PromptInputToolbar>
      </PromptInput>
      <ConversationAnnouncer status="ready" />
    </div>
  );
}

export default function App() {
  const [open, setOpen] = useState(false);
  return (
    <AppShell
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Brand name="Smoke test" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav aria-label="Main">
              <SidebarSection>
                <SidebarItem href="/" label="Home" current />
              </SidebarSection>
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      }
      topbar={<TopBar end={<CommandPaletteTrigger onClick={() => setOpen(true)} />} />}
    >
      <Main>
        <Dialog trigger={<Button>Open dialog</Button>} title="Hello" footer={<DialogClose>Close</DialogClose>} />
        <Table caption="Rows" columns={["Name", { label: "Count", numeric: true }]}>
          <Tr>
            <Td>a</Td>
            <Td numeric>1</Td>
          </Tr>
        </Table>
        <Chat />
        <CommandPalette open={open} onOpenChange={setOpen} groups={[{ label: "Go", items: [{ id: "home", label: "Home", onSelect: () => {} }] }]} />
      </Main>
    </AppShell>
  );
}
EOF
rm -f src/App.css src/index.css

EXPECTED=$(node -e 'let n=0;for(const i of require(process.argv[1]).items)n+=i.files.length;console.log(n)' "$ROOT/registry.json")
ACTUAL=$( (find src/components/ui -type f; find src/lib -type f) | wc -l | tr -d ' ')
echo "Installed files: $ACTUAL (registry ships $EXPECTED)"
[ "$ACTUAL" -eq "$EXPECTED" ]

npm run build
echo "Consumer smoke test passed: $APP"
