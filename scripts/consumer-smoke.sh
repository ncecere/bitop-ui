#!/usr/bin/env bash
# End-to-end check that every item installs into a fresh, Tailwind-free
# Vite + React + TypeScript app with the bitop CLI (packages/cli):
#
#   1. build the registry and docs for http://127.0.0.1:$PORT and serve them
#   2. create a Vite react-ts app, add the @/ alias, `bitop init` components.json
#   3. install core, theme-uf and half the components from the served registry
#      (npm dependencies are installed by the CLI)
#   4. install the rest straight from this checkout, then check a re-run is a no-op
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

cd "$ROOT"
SITE_URL="$BASE" npm run --silent registry:build
SITE_URL="$BASE" npx vite build --logLevel warn
npx vite preview --host 127.0.0.1 --port "$PORT" --strictPort >/dev/null 2>&1 &
PREVIEW=$!
trap 'kill $PREVIEW 2>/dev/null || true' EXIT
for _ in $(seq 1 50); do curl -sf "$BASE/r/core.json" >/dev/null && break; sleep 0.2; done

rm -rf "$APP" && mkdir -p "$WORK" && cd "$WORK"
npm create vite@9.2.1 bitop-consumer -- --template react-ts --no-interactive >/dev/null
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
# Exercise the distributable package and its bin entry, not just the checkout script.
PACK_NAME=$(cd "$ROOT/packages/cli" && npm pack --silent --pack-destination "$WORK")
npm install --save-dev "$WORK/$PACK_NAME" --silent
BITOP=("$APP/node_modules/.bin/bitop")
"${BITOP[@]}" init --registry "$BASE/r/{name}.json"

ITEMS=()
while IFS= read -r name; do ITEMS+=("$name"); done < <(node -e 'for (const i of require(process.argv[1]).items) if (i.type === "registry:ui") console.log(i.name)' "$ROOT/registry.json")
HALF=$(( ${#ITEMS[@]} / 2 ))
echo "Installing core, theme-uf and ${HALF} components from the hosted registry ($BASE)…"
"${BITOP[@]}" add core theme-uf "${ITEMS[@]:0:$HALF}"
echo "Installing the other $(( ${#ITEMS[@]} - HALF )) components straight from the checkout…"
"${BITOP[@]}" add theme-neutral "${ITEMS[@]:$HALF}" --registry "$ROOT"
# A second run must be a no-op.
"${BITOP[@]}" add "${ITEMS[@]}" --registry "$ROOT" > "$WORK/reinstall.log"
grep -q " 0 new, 0 updated;.* 0 skipped" "$WORK/reinstall.log"

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
import { LazyResponse } from "@/components/ui/response/response-lazy";
import { ColorField } from "@/components/ui/color-field/color-field";
import { Field } from "@/components/ui/field/field";
import { TagInput } from "@/components/ui/tag-input/tag-input";
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
              <LazyResponse images="alt">{"Loaded **on demand**."}</LazyResponse>
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

function Forms() {
  const [tags, setTags] = useState(["a"]);
  const [hex, setHex] = useState("");
  return (
    <>
      <Field label="Tags">
        <TagInput value={tags} onValueChange={setTags} />
      </Field>
      <Field label="Accent">
        <ColorField value={hex} onValueChange={setHex} defaultColor="#1d4ed8" contrastWith="#ffffff" />
      </Field>
    </>
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
        <Forms />
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

# LazyResponse's relative dynamic import must survive the import rewrite.
grep -q 'import("./response")' src/components/ui/response/response-lazy.tsx

npm run build
echo "Consumer smoke test passed: $APP"
