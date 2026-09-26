import {
  Commit,
  CommitActions,
  CommitAuthor,
  CommitAuthorAvatar,
  CommitContent,
  CommitCopyButton,
  CommitFile,
  CommitFiles,
  CommitHash,
  CommitHeader,
  CommitInfo,
  CommitMessage,
  CommitMetadata,
  CommitSeparator,
  CommitTimestamp,
  CommitTrigger,
} from "@/registry/bitop/ui/commit/commit";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./commit.tsx?raw";

export function Basic() {
  const hash = "8f3c2a91d7e04b6c5a1f9e2d3b4c5a6f7e8d9c0b";
  const files = [
    { path: "src/auth/refresh.ts", status: "modified", additions: 18, deletions: 6 },
    { path: "src/auth/refresh.test.ts", status: "added", additions: 42, deletions: 0 },
    { path: "src/auth/legacy-token.ts", status: "deleted", additions: 0, deletions: 31 },
  ] as const;
  return (
    <div className={styles.stack}>
      <Commit defaultOpen>
        <CommitHeader>
          <CommitAuthorAvatar name="Ada Lovelace" decorative />
          <CommitInfo>
            <CommitMessage>fix(auth): serialise token refresh to avoid double requests</CommitMessage>
            <CommitMetadata>
              <CommitAuthor>Ada Lovelace</CommitAuthor>
              <CommitSeparator />
              <CommitTimestamp date={new Date(Date.now() - 3 * 60 * 60 * 1000)} />
            </CommitMetadata>
          </CommitInfo>
          <CommitActions>
            <CommitHash hash={hash} />
            <CommitCopyButton hash={hash} />
          </CommitActions>
        </CommitHeader>
        <CommitTrigger fileCount={files.length} additions={60} deletions={37} />
        <CommitContent>
          <CommitFiles>
            {files.map((f) => (
              <CommitFile key={f.path} {...f} />
            ))}
          </CommitFiles>
        </CommitContent>
      </Commit>
    </div>
  );
}

export function Rename() {
  const hash = "c41d09e7ab52f3d1e0c9b8a7f6e5d4c3b2a19087";
  return (
    <div className={styles.stack}>
      <Commit>
        <CommitHeader>
          <CommitAuthorAvatar name="Grace Hopper" decorative />
          <CommitInfo>
            <CommitMessage>refactor: move date helpers into lib/</CommitMessage>
            <CommitMetadata>
              <CommitAuthor>Grace Hopper</CommitAuthor>
              <CommitSeparator />
              <CommitTimestamp date={new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)} />
            </CommitMetadata>
          </CommitInfo>
          <CommitActions>
            <CommitHash hash={hash} />
            <CommitCopyButton hash={hash} />
          </CommitActions>
        </CommitHeader>
        <CommitTrigger fileCount={1} additions={2} deletions={2} />
        <CommitContent>
          <CommitFiles>
            <CommitFile path="src/lib/dates.ts" previousPath="src/utils/dates.ts" status="renamed" additions={2} deletions={2} />
          </CommitFiles>
        </CommitContent>
      </Commit>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "commit",
  title: "Commit",
  category: "AI",
  description: "A commit summary with message, author, relative time and a copyable hash, plus a collapsible list of changed files with line counts.",
  imports: `import { Commit, CommitHeader, CommitMessage, CommitTrigger, CommitContent, CommitFiles, CommitFile } from "@/components/ui/commit/commit";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Basic", Basic, { title: "Commit with changed files", wide: true }],
    ["Rename", Rename, { title: "Collapsed, with a rename", wide: true }],
  ]),
  props: [
    { component: "Commit", note: "Base UI Collapsible.Root props (open, defaultOpen, onOpenChange…).", rows: [] },
    {
      component: "CommitTrigger",
      note: "Base UI Collapsible.Trigger props.",
      rows: [
        { name: "fileCount", type: "number", description: "For the label “3 files changed”." },
        { name: "additions / deletions", type: "number", description: "Totals shown as +n / −n." },
        { name: "children", type: "ReactNode", description: "Replaces the label." },
      ],
    },
    {
      component: "CommitFile",
      note: "Also accepts native <li> props.",
      rows: [
        { name: "path", type: "string", required: true, description: "File path." },
        { name: "status", type: '"added" | "modified" | "deleted" | "renamed"', required: true, description: "Shown as A / M / D / R plus hidden text." },
        { name: "additions / deletions", type: "number", description: "Line counts; zero is omitted." },
        { name: "previousPath", type: "string", description: "Old path for renames." },
        { name: "icon", type: "ReactNode", description: "Decorative icon." },
      ],
    },
    {
      component: "CommitHash / CommitCopyButton",
      rows: [
        { name: "hash", type: "string", required: true, description: "Full hash; CommitHash shows the first length (default 7) characters." },
      ],
      note: "CommitCopyButton takes CopyButton props and copies the full hash.",
    },
    {
      component: "CommitTimestamp",
      rows: [
        { name: "date", type: "Date", required: true, description: "Rendered as <time> with a relative label and the full date as its title." },
        { name: "now", type: "Date", description: "Reference time (default: now)." },
        { name: "locale", type: "string", description: "Intl locale." },
      ],
    },
    {
      component: "CommitAuthorAvatar",
      rows: [],
      note: "Avatar props; pass decorative when the author's name is shown next to it.",
    },
  ],
  a11y: [
    "The file list toggle is a real button with aria-expanded; the copy button is separate, not nested in a clickable header.",
    "File status is a letter plus hidden text (“Modified:”), and line counts use +/− with hidden “lines added / removed”, so nothing is colour-only.",
    "The copy button announces “Copied commit hash to clipboard” through a polite live region.",
  ],
};

export default doc;
