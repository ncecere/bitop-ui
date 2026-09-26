"use client";

import { OTPField } from "@base-ui/react/otp-field";
import { Minus } from "lucide-react";
import { Fragment, type ReactNode, useId } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./input-otp.module.css";

/*
 * InputOTP: a one-time-code field built on Base UI OTPField. One input per
 * character; typing advances, Backspace goes back, arrow keys move, and
 * pasting a whole code fills every slot. The first slot carries
 * autocomplete="one-time-code" so SMS autofill works.
 *
 *   <Field label="Verification code" description="We sent it to •••• 4821.">
 *     <InputOTP length={6} groups={[3, 3]} onValueComplete={verify} />
 *   </Field>
 *
 * Inside a Field the first slot is labelled by the Field label and the
 * description / error are announced for the group; the other slots are
 * named "Character 2 of 6" and so on. Standalone, pass `aria-label`.
 */

export type InputOTPProps = Omit<OTPField.Root.Props, "className" | "children" | "render" | "aria-label"> & {
  /** Number of characters. */
  length: number;
  /**
   * Split the slots into visual groups with a separator between them, e.g.
   * [3, 3] for "123–456". The sizes should add up to `length`.
   */
  groups?: number[];
  /** Separator between groups (decorative). Default: a dash icon. */
  separator?: ReactNode;
  /** Accessible name when the field is not inside a labelled Field. */
  "aria-label"?: string;
  /** Name for slot 2…n; defaults to "Character 2 of 6". */
  slotLabel?: (position: number, length: number) => string;
  size?: "sm" | "md";
  className?: string;
};

const defaultSlotLabel = (position: number, length: number) => `Character ${position} of ${length}`;

function splitGroups(length: number, groups: number[] | undefined): number[] {
  if (!groups || groups.length === 0) return [length];
  const out: number[] = [];
  let left = length;
  for (const g of groups) {
    if (left <= 0) break;
    const n = Math.max(1, Math.min(Math.floor(g), left));
    out.push(n);
    left -= n;
  }
  if (left > 0) out.push(left);
  return out;
}

export function InputOTP({
  length,
  groups,
  separator,
  "aria-label": ariaLabel,
  slotLabel = defaultSlotLabel,
  size = "md",
  id: idProp,
  className,
  ...props
}: InputOTPProps) {
  const generatedId = useId();
  const id = idProp ?? (ariaLabel ? `${generatedId}otp` : undefined);
  const sizes = splitGroups(length, groups);
  let position = 0;

  return (
    <>
      {ariaLabel && (
        <label htmlFor={id} className="sr-only">
          {ariaLabel}
        </label>
      )}
      <OTPField.Root {...props} id={id} length={length} data-size={size} className={cx(styles.root, className)}>
        {sizes.map((count, g) => (
          <Fragment key={g}>
            {g > 0 && (
              <OTPField.Separator className={styles.separator}>{separator ?? <Minus aria-hidden />}</OTPField.Separator>
            )}
            <div className={styles.group}>
              {Array.from({ length: count }, () => {
                const index = position++;
                return (
                  <OTPField.Input
                    key={index}
                    className={styles.slot}
                    aria-label={index === 0 ? undefined : slotLabel(index + 1, length)}
                  />
                );
              })}
            </div>
          </Fragment>
        ))}
      </OTPField.Root>
    </>
  );
}
