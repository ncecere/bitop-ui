"use client";

import { Upload } from "lucide-react";
import { type DragEvent, type ReactNode, useId, useRef, useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./drop-zone.module.css";

/*
 * DropZone: drag-and-drop area plus a real button that opens the file
 * picker, so it works with keyboard, switch and screen-reader users (the
 * drop target itself is a pointer-only enhancement). The area is a labelled
 * group; the button is described by the hint text.
 */

export type DropZoneProps = {
  /** Called with the chosen or dropped files (never empty). */
  onFiles: (files: File[]) => void;
  /** Group heading, e.g. "Upload documents". */
  label?: ReactNode;
  /** Visible button text; also its accessible name. */
  buttonLabel?: string;
  /** Hint text (accepted types, limits); describes the button. */
  description?: ReactNode;
  /** Passed to the file input, e.g. ".pdf,.docx". */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** An upload is running: the button shows a spinner. */
  busy?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function DropZone({
  onFiles,
  label = "Drag and drop files here, or",
  buttonLabel = "Choose files",
  description,
  accept,
  multiple = true,
  disabled = false,
  busy = false,
  icon,
  className,
  children,
}: DropZoneProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const inactive = disabled || busy;

  function deliver(list: FileList | null | undefined) {
    const files = [...(list ?? [])];
    if (files.length > 0 && !inactive) onFiles(multiple ? files : files.slice(0, 1));
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!inactive) setDragging(true);
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    deliver(e.dataTransfer?.files);
  };

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      data-dragging={dataFlag(dragging)}
      data-disabled={dataFlag(disabled)}
      className={cx(styles.zone, className)}
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={onDrop}
    >
      <span aria-hidden className={styles.icon}>
        {icon ?? <Upload />}
      </span>
      <p id={`${id}-label`} className={styles.label}>
        {label}
      </p>
      <Button
        variant="secondary"
        loading={busy}
        disabled={disabled}
        aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => input.current?.click()}
      >
        {buttonLabel}
      </Button>
      <input
        ref={input}
        type="file"
        hidden
        tabIndex={-1}
        multiple={multiple}
        accept={accept}
        disabled={inactive}
        aria-label={buttonLabel}
        onChange={(e) => {
          const files = e.target.files;
          deliver(files);
          e.target.value = "";
        }}
      />
      {description && (
        <p id={`${id}-desc`} className={styles.description}>
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
