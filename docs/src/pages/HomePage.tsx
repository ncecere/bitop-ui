import { Accessibility, ArrowRight, Blocks, Globe, Layers, Moon, Palette, Rocket, Terminal, Timer } from "lucide-react";
import { StatusBadge } from "@/registry/bitop/ui/badge/badge";
import { Button } from "@/registry/bitop/ui/button/button";
import { Card } from "@/registry/bitop/ui/card/card";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";
import { Switch } from "@/registry/bitop/ui/switch/switch";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { componentDocs } from "../content";
import { CodeBlock, DocSection } from "../kit/kit";
import { Link } from "../router";
import { addCommand } from "../site";
import styles from "./pages.module.css";

const features = [
  { icon: <Blocks aria-hidden />, title: "Copy and own", text: "The bitop CLI copies components into your project as source. Change anything; there is no package to fork." },
  { icon: <Layers aria-hidden />, title: "Base UI behaviour", text: "Focus management, keyboard interaction and ARIA come from Base UI. We add the styling and sensible APIs." },
  { icon: <Palette aria-hidden />, title: "CSS variables + CSS Modules", text: "No Tailwind and no runtime styling. Semantic tokens drive every component, so a theme is a small CSS file." },
  { icon: <Accessibility aria-hidden />, title: "WCAG 2.1 AA", text: "Contrast is checked for every theme in CI, and every docs page is tested with axe." },
  { icon: <Moon aria-hidden />, title: "Dark mode and brands", text: "A neutral default theme with dark mode, plus an opt-in UF theme. Add your own brand the same way." },
  { icon: <Terminal aria-hidden />, title: "One command per component", text: "bitop add dialog pulls the component, its dependencies and the core styles. bitop update refreshes files you haven't edited." },
];

export function HomePage() {
  return (
    <article className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.eyebrow}>Component registry</p>
        <h1 className={styles.heroTitle}>Accessible React components you copy into your app</h1>
        <p className={styles.heroText}>
          bitop-ui is a registry of {componentDocs.length} components built on Base UI, CSS Modules and CSS variables. Copy what you need into your app with the
          bitop CLI, then own the code.
        </p>
        <Inline gap={3}>
          <Button render={<Link to="/installation" />}>
            Get started <ArrowRight aria-hidden />
          </Button>
          <Button variant="secondary" render={<Link to="/components" />}>
            Browse components
          </Button>
        </Inline>
        <CodeBlock code={addCommand(["core", "button", "dialog"])} label="install command" language="bash" />
      </div>

      <DocSection id="why" title="Why bitop-ui">
        <ul className={styles.features}>
          {features.map((f) => (
            <li key={f.title} className={styles.feature}>
              {f.icon}
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureText}>{f.text}</p>
            </li>
          ))}
        </ul>
      </DocSection>

      <DocSection id="showcase" title="A quick look" description="Real components, rendered with the theme you picked in the header.">
        <div className={styles.stats}>
          <StatCard label="Deployments" value="1,284" icon={<Rocket />} delta={{ value: "12%", trend: "up", label: "vs last week" }} />
          <StatCard label="Visitors" value="94.2K" icon={<Globe />} delta={{ value: "3.1%", trend: "up" }} />
          <StatCard label="p95 latency" value="182 ms" icon={<Timer />} hint="Edge, last 24h" />
        </div>
        <div className={styles.showcase}>
          <Card title="Project settings" titleAs="h3" description="Changes apply to the next deployment.">
            <Stack gap={4}>
              <Field label="Project name">
                <Input defaultValue="marketing-site" />
              </Field>
              <Switch label="Preview deployments" description="Build every pull request." defaultChecked />
              <Inline justify="end" gap={2}>
                <Button variant="secondary">Cancel</Button>
                <Button onClick={() => toast.success("Settings saved")}>Save</Button>
              </Inline>
            </Stack>
          </Card>
          <Table framed caption="Recent deployments" showCaption columns={["Project", "Status", { label: "Duration", numeric: true }]}>
            {[
              ["marketing-site", "Live", "42s"],
              ["docs", "Building", "1m 8s"],
              ["dashboard", "Live", "2m 3s"],
              ["legacy-api", "Failed", "12s"],
            ].map(([name, status, duration]) => (
              <Tr key={name}>
                <Td>{name}</Td>
                <Td>
                  <StatusBadge tone={status === "Live" ? "success" : status === "Building" ? "info" : "danger"} pulse={status === "Building"}>
                    {status}
                  </StatusBadge>
                </Td>
                <Td numeric>{duration}</Td>
              </Tr>
            ))}
          </Table>
        </div>
      </DocSection>
    </article>
  );
}
