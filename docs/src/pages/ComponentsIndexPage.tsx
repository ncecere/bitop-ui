import { Card } from "@/registry/bitop/ui/card/card";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { docsByCategory } from "../content";
import { DocSection } from "../kit/kit";
import { Link } from "../router";
import styles from "./pages.module.css";

export function ComponentsIndexPage() {
  return (
    <article className={styles.page}>
      <PageHeader title="Components" description="Every item in the registry. Each page has the install command, live examples, props and accessibility notes." />
      {docsByCategory().map((g) => (
        <DocSection key={g.category} id={g.category.toLowerCase()} title={g.category}>
          <ul className={styles.grid}>
            {g.docs.map((d) => (
              <li key={d.slug}>
                <Card interactive className={styles.linkCard}>
                  <Link to={`/components/${d.slug}`} className={styles.cardLink}>
                    {d.title}
                  </Link>
                  <p className={styles.cardText}>{d.description}</p>
                </Card>
              </li>
            ))}
          </ul>
        </DocSection>
      ))}
    </article>
  );
}
