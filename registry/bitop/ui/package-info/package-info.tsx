"use client";

import { ArrowRight, Minus, Package, Plus } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useId } from "react";
import { Badge, type BadgeProps } from "@/registry/bitop/ui/badge/badge";
import { cx, type Tone } from "@/registry/bitop/lib/bitop-utils";
import styles from "./package-info.module.css";

/*
 * PackageInfo: a dependency change card: package name, current → new
 * version, a change-type badge (major / minor / patch / added / removed), a
 * description and the package's own dependencies. Display only.
 *
 *   <PackageInfo name="react" currentVersion="18.3.1" newVersion="19.0.0" changeType="major">
 *     <PackageInfoDescription>React 19 removes legacy APIs…</PackageInfoDescription>
 *     <PackageInfoDependencies>
 *       <PackageInfoDependency name="scheduler" version="^0.25.0" />
 *     </PackageInfoDependencies>
 *   </PackageInfo>
 *
 * Without children-overrides it renders the header (name + badge) and the
 * version line; children follow them. The change type is spelled out in the
 * badge, and the version arrow reads "from 18.3.1 to 19.0.0".
 */

export type PackageChangeType = "major" | "minor" | "patch" | "added" | "removed";

const changeTypes: Record<PackageChangeType, { tone: Tone; label: string; icon: ReactNode }> = {
  major: { tone: "danger", label: "Major", icon: <ArrowRight aria-hidden /> },
  minor: { tone: "warning", label: "Minor", icon: <ArrowRight aria-hidden /> },
  patch: { tone: "success", label: "Patch", icon: <ArrowRight aria-hidden /> },
  added: { tone: "info", label: "Added", icon: <Plus aria-hidden /> },
  removed: { tone: "neutral", label: "Removed", icon: <Minus aria-hidden /> },
};

type PackageInfoContextValue = {
  name: string;
  currentVersion?: string;
  newVersion?: string;
  changeType?: PackageChangeType;
};

const PackageInfoContext = createContext<PackageInfoContextValue>({ name: "" });

export type PackageInfoProps = ComponentPropsWithRef<"article"> & {
  /** Package name, e.g. "@base-ui/react". */
  name: string;
  currentVersion?: string;
  newVersion?: string;
  changeType?: PackageChangeType;
  /** Hide the default header + version line (compose your own with the parts). */
  hideHeader?: boolean;
};

/** An <article> named by the package name. */
export function PackageInfo({ name, currentVersion, newVersion, changeType, hideHeader = false, className, children, ...props }: PackageInfoProps) {
  return (
    <PackageInfoContext.Provider value={{ name, currentVersion, newVersion, changeType }}>
      <article aria-label={name} {...props} className={cx(styles.root, className)}>
        {!hideHeader && (
          <>
            <PackageInfoHeader>
              <PackageInfoName />
              <PackageInfoChangeType />
            </PackageInfoHeader>
            <PackageInfoVersion />
          </>
        )}
        {children}
      </article>
    </PackageInfoContext.Provider>
  );
}

export function PackageInfoHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type PackageInfoNameProps = ComponentPropsWithRef<"p"> & {
  /** Decorative icon (default: a package). */
  icon?: ReactNode;
};

export function PackageInfoName({ icon, className, children, ...props }: PackageInfoNameProps) {
  const { name } = useContext(PackageInfoContext);
  return (
    <p {...props} className={cx(styles.name, className)}>
      <span aria-hidden className={styles.icon}>
        {icon ?? <Package />}
      </span>
      <code>{children ?? name}</code>
    </p>
  );
}

export type PackageInfoChangeTypeProps = Omit<BadgeProps, "tone"> & { type?: PackageChangeType };

/** The change-type badge ("Major"); renders nothing without a change type. */
export function PackageInfoChangeType({ type, size = "sm", className, children, ...props }: PackageInfoChangeTypeProps) {
  const ctx = useContext(PackageInfoContext);
  const change = type ?? ctx.changeType;
  if (!change) return null;
  const t = changeTypes[change];
  return (
    <Badge {...props} tone={t.tone} size={size} className={cx(styles.badge, className)} data-change={change}>
      {t.icon}
      {children ?? t.label}
    </Badge>
  );
}

/** "18.3.1 → 19.0.0" (read as "from 18.3.1 to 19.0.0"); renders nothing without versions. */
export function PackageInfoVersion({ className, children, ...props }: ComponentPropsWithRef<"p">) {
  const { currentVersion, newVersion } = useContext(PackageInfoContext);
  if (!children && !currentVersion && !newVersion) return null;
  return (
    <p {...props} className={cx(styles.version, className)}>
      {children ?? (
        <>
          {currentVersion && (
            <>
              {newVersion && <span className="sr-only">from </span>}
              <span className={styles.current}>{currentVersion}</span>
            </>
          )}
          {currentVersion && newVersion && (
            <>
              <ArrowRight aria-hidden className={styles.arrow} />
              <span className="sr-only"> to </span>
            </>
          )}
          {newVersion && <span className={styles.next}>{newVersion}</span>}
        </>
      )}
    </p>
  );
}

export function PackageInfoDescription({ className, ...props }: ComponentPropsWithRef<"p">) {
  return <p {...props} className={cx(styles.description, className)} />;
}

export function PackageInfoContent({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.content, className)} />;
}

export type PackageInfoDependenciesProps = ComponentPropsWithRef<"div"> & {
  /** Section label (default "Dependencies"). */
  label?: ReactNode;
};

/** A labelled list of PackageInfoDependency rows. */
export function PackageInfoDependencies({ label = "Dependencies", className, children, ...props }: PackageInfoDependenciesProps) {
  const labelId = useId();
  return (
    <div {...props} className={cx(styles.dependencies, className)}>
      <p id={labelId} className={styles.sectionLabel}>
        {label}
      </p>
      <ul aria-labelledby={labelId} className={styles.list}>
        {children}
      </ul>
    </div>
  );
}

export type PackageInfoDependencyProps = ComponentPropsWithRef<"li"> & {
  name: string;
  /** Version or range, e.g. "^0.25.0". */
  version?: string;
};

export function PackageInfoDependency({ name, version, className, children, ...props }: PackageInfoDependencyProps) {
  return (
    <li {...props} className={cx(styles.dependency, className)}>
      {children ?? (
        <>
          <code className={styles.depName}>{name}</code>
          {version && <code className={styles.depVersion}>{version}</code>}
        </>
      )}
    </li>
  );
}
