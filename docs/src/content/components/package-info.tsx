import {
  PackageInfo,
  PackageInfoContent,
  PackageInfoDependencies,
  PackageInfoDependency,
  PackageInfoDescription,
} from "@/registry/bitop/ui/package-info/package-info";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./package-info.tsx?raw";

export function Upgrade() {
  return (
    <div className={styles.stack}>
      <PackageInfo name="react" currentVersion="18.3.1" newVersion="19.0.0" changeType="major">
        <PackageInfoDescription>React 19 removes legacy context and string refs, and adds Actions and the use() hook.</PackageInfoDescription>
        <PackageInfoContent>
          <PackageInfoDependencies>
            <PackageInfoDependency name="scheduler" version="^0.25.0" />
          </PackageInfoDependencies>
        </PackageInfoContent>
      </PackageInfo>
    </div>
  );
}

export function ChangeTypes() {
  return (
    <div className={styles.stack}>
      <PackageInfo name="lucide-react" currentVersion="1.47.0" newVersion="1.48.0" changeType="minor" />
      <PackageInfo name="@base-ui/react" currentVersion="1.8.0" newVersion="1.8.1" changeType="patch" />
      <PackageInfo name="zod" newVersion="4.1.5" changeType="added">
        <PackageInfoDescription>TypeScript-first schema validation.</PackageInfoDescription>
      </PackageInfo>
      <PackageInfo name="moment" currentVersion="2.30.1" changeType="removed" />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "package-info",
  title: "Package info",
  category: "AI",
  description: "A dependency change card: package name, current and new version, a change-type badge, a description and the package's dependencies.",
  imports: `import { PackageInfo, PackageInfoContent, PackageInfoDependencies, PackageInfoDependency, PackageInfoDescription } from "@/components/ui/package-info/package-info";`,
  examples: examples(raw, [
    ["Upgrade", Upgrade, { title: "Major upgrade", wide: true }],
    ["ChangeTypes", ChangeTypes, { title: "Minor, patch, added and removed", wide: true }],
  ]),
  props: [
    {
      component: "PackageInfo",
      note: "Also accepts native <article> props. Renders the header (name + badge) and version line, then children.",
      rows: [
        { name: "name", type: "string", required: true, description: "Package name; also the article's accessible name." },
        { name: "currentVersion", type: "string", description: "Installed version." },
        { name: "newVersion", type: "string", description: "Target version." },
        { name: "changeType", type: '"major" | "minor" | "patch" | "added" | "removed"', description: "Badge text and tone." },
        { name: "hideHeader", type: "boolean", default: "false", description: "Compose the header yourself with PackageInfoHeader, …Name, …ChangeType, …Version." },
      ],
    },
    {
      component: "PackageInfoDependencies / PackageInfoDependency",
      rows: [
        { name: "label", type: "ReactNode", default: '"Dependencies"', description: "Section label; names the list." },
        { name: "name / version", type: "string", description: "PackageInfoDependency: package name and range." },
      ],
    },
    { component: "PackageInfoDescription / PackageInfoContent", rows: [], note: "A muted paragraph and a bordered section for extra content." },
  ],
  a11y: [
    "Each card is an <article> named by the package.",
    "The change type is spelled out (“Major”); the version arrow is read as “from 18.3.1 to 19.0.0”.",
    "Display only: no interactive behaviour.",
  ],
};

export default doc;
