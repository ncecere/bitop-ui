"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./alert.module.css";

export type AlertTone = "info" | "success" | "warning" | "danger";

export type AlertProps = Omit<ComponentPropsWithRef<"div">, "title"> & {
  tone?: AlertTone;
  title?: ReactNode;
  /** Trailing actions (buttons/links). */
  actions?: ReactNode;
  /** Shows a dismiss button. */
  onDismiss?: () => void;
  /** Hide the leading icon. */
  hideIcon?: boolean;
};

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, danger: CircleAlert } as const;

/**
 * An inline message. Danger alerts use role="alert" (assertive); the other
 * tones use role="status" (polite). Mount the alert when the message
 * appears so it is announced.
 */
export function Alert({ tone = "info", title, actions, onDismiss, hideIcon, className, children, ...props }: AlertProps) {
  const Icon = icons[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} data-tone={tone} className={cx(styles.alert, className)} {...props}>
      {!hideIcon && <Icon aria-hidden className={styles.icon} />}
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        {children && <div className={styles.content}>{children}</div>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Extracts a human-readable message from an unknown error value. */
export function errorMessage(error: unknown): string {
  if (!error) return "";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

export type ErrorAlertProps = Omit<AlertProps, "tone" | "children"> & { error: unknown };

/** Renders nothing when `error` is falsy; otherwise a danger Alert with its message. */
export function ErrorAlert({ error, ...props }: ErrorAlertProps) {
  if (!error) return null;
  return (
    <Alert tone="danger" {...props}>
      {errorMessage(error)}
    </Alert>
  );
}
