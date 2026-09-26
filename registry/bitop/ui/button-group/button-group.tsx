"use client";

import { useRender } from "@base-ui/react/use-render";
import type { ComponentPropsWithRef } from "react";
import { Separator, type SeparatorProps } from "@/registry/bitop/ui/separator/separator";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./button-group.module.css";

/*
 * ButtonGroup: joins related Buttons (and IconButtons, Inputs, Menu
 * triggers…) into one unit with shared borders. It is a role="group" and
 * must be named, so screen readers announce what the buttons belong to.
 *
 *   <ButtonGroup aria-label="Pagination">
 *     <Button variant="secondary">Previous</Button>
 *     <ButtonGroupText>Page 2 of 9</ButtonGroupText>
 *     <Button variant="secondary">Next</Button>
 *   </ButtonGroup>
 *
 * Groups can nest (a toolbar of groups: set `spaced` on the outer one).
 * Keyboard behaviour stays that of the individual buttons (Tab moves
 * between them); for arrow-key navigation use ToggleGroup or a toolbar.
 */

type ButtonGroupBaseProps = Omit<ComponentPropsWithRef<"div">, "role"> & {
  orientation?: "horizontal" | "vertical";
  /** Keep children apart (e.g. an outer group of groups) instead of joining them. */
  spaced?: boolean;
};

/** The group needs an accessible name: pass `aria-label` or `aria-labelledby`. */
export type ButtonGroupProps = ButtonGroupBaseProps & ({ "aria-label": string } | { "aria-labelledby": string });

export function ButtonGroup({ orientation = "horizontal", spaced = false, className, ...props }: ButtonGroupProps) {
  return (
    <div
      {...props}
      role="group"
      data-orientation={orientation}
      data-spaced={spaced ? "" : undefined}
      className={cx(styles.group, className)}
    />
  );
}

export type ButtonGroupTextProps = useRender.ComponentProps<"div">;

/** A non-interactive segment, e.g. "Page 2 of 9" or a label in front of an input. Use `render` for a <label>. */
export function ButtonGroupText({ className, render, ...props }: ButtonGroupTextProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: { ...props, className: cx(styles.text, className) },
  });
}

export type ButtonGroupSeparatorProps = SeparatorProps;

/** A visual divider between joined buttons (defaults to vertical, for horizontal groups). */
export function ButtonGroupSeparator({ orientation = "vertical", className, ...props }: ButtonGroupSeparatorProps) {
  return <Separator {...props} orientation={orientation} spacing="none" className={cx(styles.separator, className)} />;
}
