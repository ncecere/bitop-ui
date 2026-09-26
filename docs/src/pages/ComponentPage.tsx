import { Badge } from "@/registry/bitop/ui/badge/badge";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import registry from "@/registry.json";
import { C, CodeBlock, DocSection, Example, InstallTabs, PropsTable, Prose } from "../kit/kit";
import type { ComponentDoc } from "../content/types";
import { Link } from "../router";
import styles from "./pages.module.css";

type RegistryItem = (typeof registry.items)[number] & { dependencies?: string[]; registryDependencies?: string[] };

export function ComponentPage({ doc }: { doc: ComponentDoc }) {
  const item = registry.items.find((i) => i.name === doc.slug) as RegistryItem | undefined;
  const files = (item?.files ?? []).map((f) => f.target.replace(/^@ui\//, "components/ui/"));
  const npm = item?.dependencies ?? [];
  const deps = (item?.registryDependencies ?? []).map((d) => d.replace(/^@bitop\//, ""));
  return (
    <article className={styles.page}>
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Docs", render: <Link to="/" /> },
              { label: "Components", render: <Link to="/components" /> },
              { label: doc.title },
            ]}
          />
        }
        title={doc.title}
        meta={<Badge variant="outline">{doc.category}</Badge>}
        description={doc.description}
      />

      <DocSection id="installation" title="Installation">
        <InstallTabs items={[doc.slug]} />
        <Prose>
          <p>
            This adds{" "}
            {files.map((f, i) => (
              <span key={f}>
                {i > 0 && ", "}
                <C>{f}</C>
              </span>
            ))}
            {deps.length > 0 && (
              <>
                {" "}and installs the{" "}
                {deps.map((d, i) => (
                  <span key={d}>
                    {i > 0 && ", "}
                    {d === "core" ? (
                      <TextLink render={<Link to="/installation" />}>core</TextLink>
                    ) : (
                      <TextLink render={<Link to={`/components/${d}`} />}>{d}</TextLink>
                    )}
                  </span>
                ))}{" "}
                {deps.length === 1 ? "item" : "items"}
              </>
            )}
            {npm.length > 0 && (
              <>
                {" "}plus{" "}
                {npm.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <C>{p}</C>
                  </span>
                ))}
              </>
            )}
            .
          </p>
          {doc.baseUi && (
            <p>
              Built on Base UI{" "}
              <TextLink href={doc.baseUi.href} external>
                {doc.baseUi.name}
              </TextLink>
              .
            </p>
          )}
        </Prose>
        <CodeBlock code={doc.imports} label="import statement" language="tsx" />
      </DocSection>

      <DocSection id="examples" title="Examples">
        {doc.examples.map((ex) => (
          <Example key={ex.title} title={ex.title} description={ex.description} code={ex.code} wide={ex.wide}>
            <ex.Demo />
          </Example>
        ))}
      </DocSection>

      <DocSection id="props" title="Props" description="Every component also accepts className and passes remaining props through.">
        {doc.props.map((p) => (
          <PropsTable key={p.component} component={p.component} rows={p.rows} note={p.note} />
        ))}
      </DocSection>

      <DocSection id="accessibility" title="Accessibility">
        <Prose>
          <ul>
            {doc.a11y.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </Prose>
      </DocSection>
    </article>
  );
}
