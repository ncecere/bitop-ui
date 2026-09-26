"use client";

import { Toggle } from "@base-ui/react/toggle";
import { Mic, Square } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./speech-input.module.css";

/*
 * SpeechInput: a microphone toggle button (Base UI Toggle, aria-pressed)
 * that turns speech into text.
 *
 *  - Uses the Web Speech API (SpeechRecognition) when the browser has it:
 *    final phrases go to `onTranscriptionChange`, the in-progress phrase to
 *    `onInterimTranscript` and is shown under the button.
 *  - Otherwise, if `onAudioRecorded` is set, records with MediaRecorder and
 *    hands you the Blob to transcribe on your server; return the text (or
 *    call your own state setter) and it is passed to `onTranscriptionChange`.
 *  - With neither, the button is disabled and says why.
 *
 *   <SpeechInput
 *     onTranscriptionChange={(text) => setDraft((d) => (d ? `${d} ${text}` : text))}
 *     onAudioRecorded={async (blob) => (await transcribe(blob)).text}
 *   />
 *
 * State changes ("Listening", "Transcribing…", errors) are announced in a
 * polite live region; the interim transcript is visible but not announced
 * word by word.
 */

type RecognitionAlternative = { transcript: string };
type RecognitionResult = { isFinal: boolean; length: number; [index: number]: RecognitionAlternative };
type RecognitionEvent = Event & { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } };
type RecognitionErrorEvent = Event & { error: string };

/** The subset of the Web Speech API's SpeechRecognition this component uses. */
export type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
};

type RecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechInputMode = "speech-recognition" | "media-recorder" | "none";
export type SpeechInputStatus = "idle" | "listening" | "processing" | "error";

function recognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Which capture method this browser supports, given whether a recorder callback exists. */
export function detectSpeechInputMode(canRecord: boolean): SpeechInputMode {
  if (recognitionCtor()) return "speech-recognition";
  if (canRecord && typeof window !== "undefined" && "MediaRecorder" in window && typeof navigator.mediaDevices?.getUserMedia === "function") return "media-recorder";
  return "none";
}

function errorMessage(code: string): string {
  if (code === "not-allowed" || code === "service-not-allowed" || code === "NotAllowedError" || code === "SecurityError") return "Microphone access is blocked.";
  if (code === "no-speech") return "No speech was detected.";
  if (code === "audio-capture" || code === "NotFoundError") return "No microphone was found.";
  if (code === "network") return "Speech recognition needs a network connection.";
  return "Voice input stopped because of an error.";
}

export type SpeechInputProps = Omit<ComponentPropsWithRef<"div">, "children" | "onError"> & {
  /** Called with each final phrase (or the text returned by `onAudioRecorded`). */
  onTranscriptionChange?: (text: string) => void;
  /** Called with the in-progress phrase while speaking (Web Speech API only). */
  onInterimTranscript?: (text: string) => void;
  /**
   * Fallback for browsers without SpeechRecognition: receives the recorded
   * audio. Return the transcript to have it passed to onTranscriptionChange.
   */
  onAudioRecorded?: (audio: Blob) => Promise<string | void> | string | void;
  onListeningChange?: (listening: boolean) => void;
  onError?: (code: string) => void;
  /** BCP 47 language for recognition (default: the document language, else "en-US"). */
  lang?: string;
  /** Accessible name of the toggle (default "Voice input"). */
  label?: string;
  /** Show the interim transcript under the button (default true). */
  showInterim?: boolean;
  /** Show status text (Listening…, errors) visibly; it is always announced. */
  showStatus?: boolean;
  /** Text when the browser can't capture speech. */
  unsupportedText?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function SpeechInput({
  onTranscriptionChange,
  onInterimTranscript,
  onAudioRecorded,
  onListeningChange,
  onError,
  lang,
  label = "Voice input",
  showInterim = true,
  showStatus = false,
  unsupportedText = "Voice input isn't supported in this browser.",
  disabled,
  size = "md",
  className,
  ...props
}: SpeechInputProps) {
  const [mode, setMode] = useState<SpeechInputMode>("none");
  const [status, setStatus] = useState<SpeechInputStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const statusId = useId();

  // Latest callbacks, so running sessions never call stale props.
  const cb = useRef({ onTranscriptionChange, onInterimTranscript, onAudioRecorded, onListeningChange, onError });
  cb.current = { onTranscriptionChange, onInterimTranscript, onAudioRecorded, onListeningChange, onError };

  const canRecord = Boolean(onAudioRecorded);
  // Detected after mount so server and client render the same markup.
  useEffect(() => setMode(detectSpeechInputMode(canRecord)), [canRecord]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      recognition.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      for (const t of stream.current?.getTracks() ?? []) t.stop();
    };
  }, []);

  const statusRef = useRef<SpeechInputStatus>("idle");
  function update(next: SpeechInputStatus) {
    if (!alive.current) return;
    const prev = statusRef.current;
    statusRef.current = next;
    setStatus(next);
    if ((prev === "listening") !== (next === "listening")) cb.current.onListeningChange?.(next === "listening");
  }

  function fail(code: string) {
    if (!alive.current) return;
    setError(errorMessage(code));
    setInterim("");
    update("error");
    cb.current.onError?.(code);
  }

  function startRecognition() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang || document.documentElement.lang || "en-US";
    r.addEventListener("start", () => update("listening"));
    r.addEventListener("result", (event) => {
      const e = event as RecognitionEvent;
      let final = "";
      let partial = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) final += text;
        else partial += text;
      }
      if (!alive.current) return;
      setInterim(partial);
      cb.current.onInterimTranscript?.(partial);
      if (final.trim()) cb.current.onTranscriptionChange?.(final.trim());
    });
    r.addEventListener("error", (event) => {
      const code = (event as RecognitionErrorEvent).error;
      // "aborted" is our own stop(); not an error worth reporting.
      if (code !== "aborted") fail(code);
    });
    r.addEventListener("end", () => {
      recognition.current = null;
      if (!alive.current) return;
      setInterim("");
      if (statusRef.current !== "error") update("idle");
    });
    recognition.current = r;
    setError(null);
    try {
      r.start();
      // Some implementations fire "start" late; reflect the press immediately.
      update("listening");
    } catch {
      fail("start-failed");
    }
  }

  async function startRecorder() {
    setError(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) {
        for (const t of s.getTracks()) t.stop();
        return;
      }
      stream.current = s;
      const rec = new MediaRecorder(s);
      const chunks: Blob[] = [];
      rec.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      });
      rec.addEventListener("stop", async () => {
        for (const t of s.getTracks()) t.stop();
        stream.current = null;
        recorder.current = null;
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (blob.size === 0 || !cb.current.onAudioRecorded) {
          update("idle");
          return;
        }
        update("processing");
        try {
          const text = await cb.current.onAudioRecorded(blob);
          if (typeof text === "string" && text.trim()) cb.current.onTranscriptionChange?.(text.trim());
          update("idle");
        } catch {
          fail("transcription-failed");
        }
      });
      recorder.current = rec;
      rec.start();
      update("listening");
    } catch (e) {
      fail(e instanceof Error ? e.name : "start-failed");
    }
  }

  function stop() {
    if (mode === "speech-recognition") recognition.current?.stop();
    else if (recorder.current?.state === "recording") recorder.current.stop();
    else update("idle");
  }

  function onPressedChange(pressed: boolean) {
    if (!pressed) return stop();
    if (mode === "speech-recognition") startRecognition();
    else if (mode === "media-recorder") void startRecorder();
  }

  const listening = status === "listening";
  const processing = status === "processing";
  const unsupported = mode === "none";
  const statusText = unsupported
    ? unsupportedText
    : listening
      ? "Listening…"
      : processing
        ? "Transcribing…"
        : status === "error"
          ? error
          : null;

  return (
    <div {...props} className={cx(styles.root, className)} data-status={status} data-mode={mode}>
      <span className={styles.button}>
        {listening && <span aria-hidden className={styles.pulse} />}
        <Toggle
          pressed={listening}
          onPressedChange={onPressedChange}
          disabled={disabled || unsupported || processing}
          render={
            <IconButton
              size={size}
              variant={listening ? "danger" : "secondary"}
              label={label}
              loading={processing}
              aria-describedby={statusText ? statusId : undefined}
              className={styles.toggle}
              icon={listening ? <Square aria-hidden /> : <Mic aria-hidden />}
            />
          }
        />
      </span>
      <span id={statusId} role="status" className={cx(styles.status, !showStatus && !unsupported && status !== "error" && "sr-only")} data-tone={status === "error" ? "danger" : undefined}>
        {statusText}
      </span>
      {showInterim && interim && (
        <span className={styles.interim}>{interim}</span>
      )}
    </div>
  );
}
