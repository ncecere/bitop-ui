"use client";

import { CircleCheck, CircleX, ShieldQuestion } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, createContext, useContext, useEffect, useId, useRef } from "react";
import { Button, type ButtonProps } from "@/registry/bitop/ui/button/button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./confirmation.module.css";

/*
 * Confirmation: ask the user to approve a tool call before it runs.
 *
 *   <Confirmation state={approval}>
 *     <ConfirmationTitle>Send the email to 42 recipients?</ConfirmationTitle>
 *     <ConfirmationRequest>The agent wants to call send_email.</ConfirmationRequest>
 *     <ConfirmationAccepted>Approved. Sending…</ConfirmationAccepted>
 *     <ConfirmationRejected>Rejected. Nothing was sent.</ConfirmationRejected>
 *     <ConfirmationActions>
 *       <ConfirmationAction variant="secondary" onClick={reject}>Reject</ConfirmationAction>
 *       <ConfirmationAction onClick={approve}>Approve</ConfirmationAction>
 *     </ConfirmationActions>
 *   </Confirmation>
 *
 * The outcome is announced (role="status") when it appears. The action
 * buttons disappear once answered; if focus was on them it moves to the
 * card so keyboard users don't lose their place.
 */

export type ConfirmationState = "requested" | "accepted" | "rejected";

type Ctx = { state: ConfirmationState; titleId: string };
const ConfirmationContext = createContext<Ctx | null>(null);

function useConfirmation() {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("Confirmation parts must be inside <Confirmation>");
  return ctx;
}

export type ConfirmationProps = ComponentPropsWithRef<"div"> & { state: ConfirmationState };

export function Confirmation({ state, className, children, ...props }: ConfirmationProps) {
  const titleId = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const hadFocus = useRef(false);
  useEffect(() => {
    if (state !== "requested" && hadFocus.current && root.current && !root.current.contains(document.activeElement)) {
      root.current.focus({ preventScroll: true });
    }
  }, [state]);
  return (
    <ConfirmationContext.Provider value={{ state, titleId }}>
      <div
        {...props}
        ref={root}
        role="group"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-state={state}
        className={cx(styles.root, className)}
        onFocus={(e) => {
          props.onFocus?.(e);
          hadFocus.current = true;
        }}
        onBlur={(e) => {
          props.onBlur?.(e);
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hadFocus.current = false;
        }}
      >
        <span aria-hidden className={styles.icon}>
          {state === "accepted" ? <CircleCheck /> : state === "rejected" ? <CircleX /> : <ShieldQuestion />}
        </span>
        <div className={styles.body}>{children}</div>
      </div>
    </ConfirmationContext.Provider>
  );
}

export function ConfirmationTitle({ className, ...props }: ComponentPropsWithRef<"p">) {
  const { titleId } = useConfirmation();
  return <p {...props} id={titleId} className={cx(styles.title, className)} />;
}

function Only({ when, status, className, children }: { when: ConfirmationState; status?: boolean; className?: string; children: ReactNode }) {
  const { state } = useConfirmation();
  if (state !== when) return null;
  return (
    <div role={status ? "status" : undefined} className={className}>
      {children}
    </div>
  );
}

/** Shown while the request is pending. */
export function ConfirmationRequest({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Only when="requested" className={cx(styles.text, className)}>
      {children}
    </Only>
  );
}

/** Shown (and announced) after approval. */
export function ConfirmationAccepted({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Only when="accepted" status className={cx(styles.text, styles.outcome, className)}>
      {children}
    </Only>
  );
}

/** Shown (and announced) after rejection. */
export function ConfirmationRejected({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Only when="rejected" status className={cx(styles.text, styles.outcome, className)}>
      {children}
    </Only>
  );
}

/** Action buttons, shown only while the request is pending. */
export function ConfirmationActions({ className, children }: { className?: string; children: ReactNode }) {
  const { state } = useConfirmation();
  if (state !== "requested") return null;
  return <div className={cx(styles.actions, className)}>{children}</div>;
}

export function ConfirmationAction({ size = "sm", ...props }: ButtonProps) {
  return <Button size={size} {...props} />;
}
