"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { AudioLines, ChevronsUpDown, Pause, Play, Search } from "lucide-react";
import { type ReactElement, type ReactNode, useId, useMemo, useState } from "react";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { Dialog, DialogClose } from "@/registry/bitop/ui/dialog/dialog";
import { Input } from "@/registry/bitop/ui/input/input";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./voice-selector.module.css";

/*
 * VoiceSelector: pick a text-to-speech voice in a dialog (bitop Dialog, Base
 * UI) with a search box and a radio list (Base UI RadioGroup). Each voice
 * shows its metadata (gender · accent · language · age) and, when
 * `onPreview` is set, a preview button next to it.
 *
 *   <VoiceSelector
 *     label="Voice"
 *     voices={voices}
 *     value={voiceId}
 *     onValueChange={setVoiceId}
 *     onPreview={(voice) => play(voice.previewUrl)}
 *     previewingId={playingId}
 *   />
 *
 * A dialog (rather than a listbox popup) keeps the preview buttons valid:
 * interactive content can't live inside listbox options. Arrow keys move
 * between voices and select them; Tab reaches the preview buttons; the
 * dialog stays open so voices can be compared, and Done / Esc close it.
 */

export type Voice = {
  id: string;
  name: string;
  description?: string;
  /** Free text, e.g. "Female", "Male", "Neutral". */
  gender?: string;
  /** Free text, e.g. "British", "American". */
  accent?: string;
  /** Language name or tag, e.g. "English (UK)". */
  language?: string;
  /** e.g. "Young adult", "Middle-aged". */
  age?: string;
  /** Decorative avatar or icon. */
  icon?: ReactNode;
};

export type VoiceSelectorProps = {
  voices: Voice[];
  /** Accessible name of the trigger and the list, e.g. "Voice". */
  label: string;
  /** Selected voice id (controlled). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (id: string, voice: Voice) => void;
  /** Called by a voice's preview button. Omit to hide preview buttons. */
  onPreview?: (voice: Voice) => void;
  /** The voice whose preview is playing (its button shows Pause and aria-pressed). */
  previewingId?: string | null;
  /** The voice whose preview is loading (its button shows a spinner). */
  previewLoadingId?: string | null;
  /** Dialog title (default "Choose a voice"). */
  title?: ReactNode;
  description?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger element (default: a button showing the selected voice). */
  trigger?: ReactElement;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** "Female · British · English (UK)" */
export function voiceMeta(voice: Voice): string {
  return [voice.gender, voice.accent, voice.language, voice.age].filter(Boolean).join(" · ");
}

function matches(voice: Voice, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [voice.name, voice.description, voiceMeta(voice), voice.id].join(" ").toLowerCase();
  return q.split(/\s+/).every((w) => hay.includes(w));
}

export function VoiceSelector({
  voices,
  label,
  value,
  defaultValue = null,
  onValueChange,
  onPreview,
  previewingId,
  previewLoadingId,
  title = "Choose a voice",
  description,
  placeholder = "Select a voice",
  searchPlaceholder = "Search voices…",
  emptyText = "No voices match your search.",
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  disabled,
  size = "md",
  className,
}: VoiceSelectorProps) {
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const [query, setQuery] = useState("");
  const listId = useId();
  const selectedId = value !== undefined ? value : internal;
  const selected = voices.find((v) => v.id === selectedId) ?? null;
  const shown = useMemo(() => voices.filter((v) => matches(v, query)), [voices, query]);

  function select(id: string) {
    const voice = voices.find((v) => v.id === id);
    if (!voice) return;
    if (value === undefined) setInternal(id);
    onValueChange?.(id, voice);
  }

  const defaultTrigger = (
    <Button variant="secondary" size={size} disabled={disabled} className={cx(styles.trigger, className)} aria-label={`${label}: ${selected?.name ?? placeholder}`}>
      <span aria-hidden className={styles.triggerIcon}>
        {selected?.icon ?? <AudioLines />}
      </span>
      <span className={styles.triggerValue} data-placeholder={selected ? undefined : ""}>
        {selected?.name ?? placeholder}
      </span>
      <ChevronsUpDown aria-hidden className={styles.chevron} />
    </Button>
  );

  return (
    <Dialog
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(o) => {
        if (!o) setQuery("");
        onOpenChange?.(o);
      }}
      title={title}
      description={description}
      trigger={trigger ?? defaultTrigger}
      footer={<DialogClose variant="primary">Done</DialogClose>}
      className={styles.dialog}
    >
      <div className={styles.body}>
        <Input
          type="search"
          size="sm"
          startIcon={<Search />}
          aria-label={`Search ${label.toLowerCase()}s`}
          aria-controls={listId}
          placeholder={searchPlaceholder}
          value={query}
          onValueChange={setQuery}
          className={styles.search}
        />
        <RadioGroup
          id={listId}
          aria-label={label}
          value={selectedId ?? undefined}
          onValueChange={(v) => select(v as string)}
          className={styles.list}
        >
          {shown.map((voice) => {
            const meta = voiceMeta(voice);
            const previewing = previewingId === voice.id;
            return (
              <div key={voice.id} className={styles.row} data-checked={voice.id === selectedId ? "" : undefined}>
                <label className={styles.option}>
                  <Radio.Root value={voice.id} className={styles.radio}>
                    <Radio.Indicator className={styles.indicator} />
                  </Radio.Root>
                  {voice.icon && (
                    <span aria-hidden className={styles.avatar}>
                      {voice.icon}
                    </span>
                  )}
                  <span className={styles.text}>
                    <span className={styles.name}>{voice.name}</span>
                    {meta && <span className={styles.meta}>{meta}</span>}
                    {voice.description && <span className={styles.description}>{voice.description}</span>}
                  </span>
                </label>
                {onPreview && (
                  <IconButton
                    size="sm"
                    variant="ghost"
                    className={styles.preview}
                    label={`Preview ${voice.name}`}
                    aria-pressed={previewing}
                    loading={previewLoadingId === voice.id}
                    icon={previewing ? <Pause aria-hidden /> : <Play aria-hidden />}
                    onClick={() => onPreview(voice)}
                  />
                )}
              </div>
            );
          })}
        </RadioGroup>
        <div role="status" className={styles.status}>
          {shown.length === 0 ? <p className={styles.empty}>{emptyText}</p> : query ? <span className="sr-only">{`${shown.length} ${shown.length === 1 ? "voice" : "voices"}`}</span> : null}
        </div>
      </div>
    </Dialog>
  );
}
