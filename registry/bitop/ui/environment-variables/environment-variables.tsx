"use client";

import { Eye, EyeOff } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useCallback, useContext, useId, useMemo, useState } from "react";
import { Badge, type BadgeProps } from "@/registry/bitop/ui/badge/badge";
import { Button, type ButtonProps } from "@/registry/bitop/ui/button/button";
import { CopyButton, type CopyButtonProps } from "@/registry/bitop/ui/copy-button/copy-button";
import { Switch, type SwitchProps } from "@/registry/bitop/ui/switch/switch";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./environment-variables.module.css";

/*
 * EnvironmentVariables: a list of env vars with masked values. A switch
 * shows or hides every value; each row has its own show/hide toggle
 * (aria-pressed) and a copy button. Flipping the switch resets the per-row
 * choices, so "Hide values" really hides everything.
 *
 *   <EnvironmentVariables>
 *     <EnvironmentVariablesHeader>
 *       <EnvironmentVariablesTitle>Production</EnvironmentVariablesTitle>
 *       <EnvironmentVariablesToggle />
 *     </EnvironmentVariablesHeader>
 *     <EnvironmentVariablesContent>
 *       <EnvironmentVariable name="DATABASE_URL" value="postgres://…" required />
 *       <EnvironmentVariable name="LOG_LEVEL" value="info" />
 *     </EnvironmentVariablesContent>
 *   </EnvironmentVariables>
 *
 * Masked values render as dots for sighted users and "hidden" for screen
 * readers; the copy button always copies the real value.
 */

type EnvContextValue = {
  showValues: boolean;
  setShowValues: (show: boolean) => void;
  /** Bumped on every global toggle; per-row overrides from older versions are ignored. */
  version: number;
  titleId: string;
};

const EnvContext = createContext<EnvContextValue | null>(null);

function useEnv(part: string): EnvContextValue {
  const ctx = useContext(EnvContext);
  if (!ctx) throw new Error(`${part} must be used inside <EnvironmentVariables>`);
  return ctx;
}

export type EnvironmentVariablesProps = ComponentPropsWithRef<"div"> & {
  /** Show every value (controlled). */
  showValues?: boolean;
  defaultShowValues?: boolean;
  onShowValuesChange?: (show: boolean) => void;
};

export function EnvironmentVariables({
  showValues: showProp,
  defaultShowValues = false,
  onShowValuesChange,
  className,
  ...props
}: EnvironmentVariablesProps) {
  const [showState, setShowState] = useState(defaultShowValues);
  const [version, setVersion] = useState(0);
  const showValues = showProp ?? showState;
  const titleId = useId();
  const setShowValues = useCallback(
    (show: boolean) => {
      if (showProp === undefined) setShowState(show);
      setVersion((v) => v + 1);
      onShowValuesChange?.(show);
    },
    [showProp, onShowValuesChange],
  );
  const ctx = useMemo(() => ({ showValues, setShowValues, version, titleId }), [showValues, setShowValues, version, titleId]);
  return (
    <EnvContext.Provider value={ctx}>
      <div role="group" aria-labelledby={titleId} {...props} className={cx(styles.root, className)} />
    </EnvContext.Provider>
  );
}

export function EnvironmentVariablesHeader({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} className={cx(styles.header, className)} />;
}

export type EnvironmentVariablesTitleProps = ComponentPropsWithRef<"p"> & { as?: "p" | "h2" | "h3" | "h4" };

/** Names the list (default text "Environment variables"). */
export function EnvironmentVariablesTitle({ as: Tag = "p", className, children, ...props }: EnvironmentVariablesTitleProps) {
  const { titleId } = useEnv("EnvironmentVariablesTitle");
  return (
    <Tag id={titleId} {...props} className={cx(styles.title, className)}>
      {children ?? "Environment variables"}
    </Tag>
  );
}

export type EnvironmentVariablesToggleProps = Omit<SwitchProps, "label" | "checked" | "onCheckedChange" | "defaultChecked"> & {
  /** Switch label (default "Show values"). */
  label?: ReactNode;
};

/** A switch that shows or hides every value. */
export function EnvironmentVariablesToggle({ label = "Show values", labelPosition = "start", className, ...props }: EnvironmentVariablesToggleProps) {
  const { showValues, setShowValues } = useEnv("EnvironmentVariablesToggle");
  return (
    <Switch
      {...props}
      label={label}
      labelPosition={labelPosition}
      checked={showValues}
      onCheckedChange={(checked) => setShowValues(checked)}
      className={cx(styles.toggle, className)}
    />
  );
}

export function EnvironmentVariablesContent({ className, ...props }: ComponentPropsWithRef<"ul">) {
  return <ul {...props} className={cx(styles.list, className)} />;
}

type VarContextValue = {
  name: string;
  value: string;
  shown: boolean;
  setShown: (shown: boolean) => void;
};

const VarContext = createContext<VarContextValue | null>(null);

function useVar(part: string): VarContextValue {
  const ctx = useContext(VarContext);
  if (!ctx) throw new Error(`${part} must be used inside <EnvironmentVariable>`);
  return ctx;
}

export type EnvironmentVariableProps = Omit<ComponentPropsWithRef<"li">, "children"> & {
  name: string;
  value: string;
  /** Adds a "Required" badge. */
  required?: boolean;
  /** Short note under the name, e.g. "Used by the worker". */
  description?: ReactNode;
  /** What the copy button copies (default "value"). */
  copyFormat?: EnvironmentVariableCopyFormat;
  /** Custom row content; defaults to name, badge, value, show/hide and copy. */
  children?: ReactNode;
};

export function EnvironmentVariable({ name, value, required, description, copyFormat, className, children, ...props }: EnvironmentVariableProps) {
  const env = useEnv("EnvironmentVariable");
  const [local, setLocal] = useState<{ version: number; shown: boolean } | null>(null);
  const shown = local && local.version === env.version ? local.shown : env.showValues;
  const setShown = useCallback((next: boolean) => setLocal({ version: env.version, shown: next }), [env.version]);
  const ctx = useMemo(() => ({ name, value, shown, setShown }), [name, value, shown, setShown]);
  return (
    <VarContext.Provider value={ctx}>
      <li {...props} className={cx(styles.row, className)} data-shown={dataFlag(shown)}>
        {children ?? (
          <>
            <div className={styles.nameCell}>
              <span className={styles.nameLine}>
                <EnvironmentVariableName />
                {required && <EnvironmentVariableRequired />}
              </span>
              {description && <span className={styles.description}>{description}</span>}
            </div>
            <div className={styles.valueCell}>
              <EnvironmentVariableValue />
              <EnvironmentVariableVisibilityToggle />
              <EnvironmentVariableCopyButton format={copyFormat} />
            </div>
          </>
        )}
      </li>
    </VarContext.Provider>
  );
}

export function EnvironmentVariableName({ className, children, ...props }: ComponentPropsWithRef<"code">) {
  const { name } = useVar("EnvironmentVariableName");
  return (
    <code {...props} className={cx(styles.name, className)}>
      {children ?? name}
    </code>
  );
}

export type EnvironmentVariableValueProps = Omit<ComponentPropsWithRef<"code">, "children"> & {
  /** Dots shown while masked (default 8, independent of the value's length). */
  maskLength?: number;
};

/** The value, or dots (announced as "hidden") while masked. */
export function EnvironmentVariableValue({ maskLength = 8, className, ...props }: EnvironmentVariableValueProps) {
  const { value, shown } = useVar("EnvironmentVariableValue");
  return (
    <code {...props} className={cx(styles.value, className)} data-masked={dataFlag(!shown)}>
      {shown ? (
        value || <span className={styles.empty}>(empty)</span>
      ) : (
        <>
          <span aria-hidden>{"•".repeat(maskLength)}</span>
          <span className="sr-only">hidden</span>
        </>
      )}
    </code>
  );
}

export type EnvironmentVariableVisibilityToggleProps = Omit<ButtonProps, "children" | "onClick" | "iconOnly" | "aria-label" | "aria-pressed">;

/** Shows / hides this row's value (a toggle button: aria-pressed = shown). */
export function EnvironmentVariableVisibilityToggle({ variant = "ghost", size = "sm", className, ...props }: EnvironmentVariableVisibilityToggleProps) {
  const { name, shown, setShown } = useVar("EnvironmentVariableVisibilityToggle");
  return (
    <Tooltip content={shown ? "Hide value" : "Show value"}>
      <Button
        {...props}
        variant={variant}
        size={size}
        iconOnly
        aria-label={`Show ${name}`}
        aria-pressed={shown}
        onClick={() => setShown(!shown)}
        className={cx(styles.action, className)}
      >
        {shown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </Tooltip>
  );
}

export type EnvironmentVariableCopyFormat = "value" | "name" | "export" | "dotenv";

/** Formats a variable for copying: value, name, `export NAME="value"` or `NAME=value`. */
export function formatEnvironmentVariable(name: string, value: string, format: EnvironmentVariableCopyFormat = "value"): string {
  if (format === "name") return name;
  if (format === "export") return `export ${name}="${value.replace(/(["\\$`])/g, "\\$1")}"`;
  if (format === "dotenv") return `${name}=${/[\s#"']/.test(value) ? JSON.stringify(value) : value}`;
  return value;
}

export type EnvironmentVariableCopyButtonProps = Omit<CopyButtonProps, "value"> & {
  format?: EnvironmentVariableCopyFormat;
};

/** Copies the value (or another format); named "Copy NAME". */
export function EnvironmentVariableCopyButton({ format = "value", label, className, ...props }: EnvironmentVariableCopyButtonProps) {
  const { name, value } = useVar("EnvironmentVariableCopyButton");
  return <CopyButton {...props} value={() => formatEnvironmentVariable(name, value, format)} label={label ?? name} className={cx(styles.action, className)} />;
}

export type EnvironmentVariableRequiredProps = BadgeProps;

export function EnvironmentVariableRequired({ tone = "warning", size = "sm", children, ...props }: EnvironmentVariableRequiredProps) {
  return (
    <Badge {...props} tone={tone} size={size}>
      {children ?? "Required"}
    </Badge>
  );
}
