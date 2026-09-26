import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./page-header.module.css";

export type PageHeaderProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  /** The page's <h1>. */
  title: ReactNode;
  description?: ReactNode;
  /** Buttons on the right. */
  actions?: ReactNode;
  /** Shown above the title, e.g. <Breadcrumbs />. */
  breadcrumbs?: ReactNode;
  /** Inline meta next to the title, e.g. status badges. */
  meta?: ReactNode;
};

export function PageHeader({ title, description, actions, breadcrumbs, meta, className, ...props }: PageHeaderProps) {
  return (
    <div className={cx(styles.header, className)} {...props}>
      {breadcrumbs && <div className={styles.breadcrumbs}>{breadcrumbs}</div>}
      <div className={styles.row}>
        <div className={styles.heading}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{title}</h1>
            {meta && <div className={styles.meta}>{meta}</div>}
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </div>
  );
}
