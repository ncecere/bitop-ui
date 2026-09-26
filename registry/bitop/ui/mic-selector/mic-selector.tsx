"use client";

import { CircleAlert, Mic } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Select } from "@/registry/bitop/ui/select/select";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./mic-selector.module.css";

/*
 * MicSelector: pick an audio input with navigator.mediaDevices, on the
 * bitop Select (Base UI). Browsers hide device names (and sometimes the
 * devices themselves) until the page has microphone permission, so the
 * selector offers an "Allow microphone access" button that asks once,
 * stops the temporary stream and re-lists the devices. The list refreshes
 * on `devicechange` (plugging in a headset).
 *
 *   const [mic, setMic] = useState<string | null>(null);
 *   <MicSelector label="Microphone" value={mic} onValueChange={setMic} />
 *   // later: getUserMedia({ audio: { deviceId: mic ? { exact: mic } : undefined } })
 *
 * Without mediaDevices (old browsers, insecure http:) it renders a short
 * explanation instead of a broken control. `useAudioInputs` is exported
 * for custom UIs.
 */

export type AudioInputsStatus = "unsupported" | "loading" | "ready" | "error";

export type AudioInputsState = {
  devices: MediaDeviceInfo[];
  status: AudioInputsStatus;
  /** True once device labels are available (permission granted). */
  hasPermission: boolean;
  /** The permission / enumeration error, if any (e.g. NotAllowedError). */
  error: Error | null;
  /** Ask for microphone permission, then re-list devices. Resolves to whether it was granted. */
  requestPermission: () => Promise<boolean>;
  /** Re-list devices. */
  refresh: () => Promise<void>;
};

const mediaDevices = () => (typeof navigator !== "undefined" ? navigator.mediaDevices : undefined);

/** Lists audio inputs and keeps the list current. */
export function useAudioInputs(): AudioInputsState {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [status, setStatus] = useState<AudioInputsStatus>("loading");
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    const md = mediaDevices();
    if (!md?.enumerateDevices) {
      setStatus("unsupported");
      return;
    }
    try {
      const list = (await md.enumerateDevices()).filter((d) => d.kind === "audioinput");
      if (!mounted.current) return;
      setDevices(list);
      setStatus("ready");
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
      setStatus("error");
    }
  }, []);

  const requestPermission = useCallback(async () => {
    const md = mediaDevices();
    if (!md?.getUserMedia) return false;
    try {
      const stream = await md.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
      if (mounted.current) setError(null);
      await refresh();
      return true;
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e : new Error(String(e)));
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    mounted.current = true;
    const md = mediaDevices();
    void refresh();
    if (!md?.addEventListener) return () => void (mounted.current = false);
    const onChange = () => void refresh();
    md.addEventListener("devicechange", onChange);
    return () => {
      mounted.current = false;
      md.removeEventListener("devicechange", onChange);
    };
  }, [refresh]);

  const hasPermission = devices.some((d) => d.label !== "");
  return { devices, status, hasPermission, error, requestPermission, refresh };
}

/** Drops the USB "(vendor:product)" suffix Chrome appends to device names. */
export function defaultMicLabel(device: MediaDeviceInfo, index: number): string {
  return device.label.replace(/\s*\([\da-f]{4}:[\da-f]{4}\)$/i, "") || `Microphone ${index + 1}`;
}

function describeError(error: Error): string {
  if (error.name === "NotAllowedError" || error.name === "SecurityError") {
    return "Microphone access is blocked. Allow it in your browser's site settings, then try again.";
  }
  if (error.name === "NotFoundError") return "No microphone was found.";
  return "Couldn't access the microphone.";
}

export type MicSelectorProps = {
  /** Visible label (the select's accessible name). */
  label: ReactNode;
  hideLabel?: boolean;
  /** Selected deviceId (controlled). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (deviceId: string | null, device: MediaDeviceInfo | null) => void;
  placeholder?: string;
  /** Text of the permission button. */
  permissionLabel?: string;
  /** Formats a device for display (default strips USB ids and numbers unnamed devices). */
  formatLabel?: (device: MediaDeviceInfo, index: number) => string;
  /** Shown instead of the select when mediaDevices is unavailable. */
  unsupportedText?: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function MicSelector({
  label,
  hideLabel,
  value,
  defaultValue = null,
  onValueChange,
  placeholder = "Select a microphone",
  permissionLabel = "Allow microphone access",
  formatLabel = defaultMicLabel,
  unsupportedText = "Microphone selection isn't available in this browser.",
  disabled,
  size = "md",
  className,
}: MicSelectorProps) {
  const { devices, status, hasPermission, error, requestPermission } = useAudioInputs();
  const [internal, setInternal] = useState<string | null>(defaultValue);
  const [asking, setAsking] = useState(false);
  const selected = value !== undefined ? value : internal;
  // Before permission some browsers report devices with an empty deviceId: they can't be selected.
  const items = devices
    .filter((d) => d.deviceId !== "")
    .map((d, i) => ({ value: d.deviceId, label: formatLabel(d, i), device: d }));
  const current = items.some((i) => i.value === selected) ? selected : null;

  if (status === "unsupported") {
    return (
      <div className={cx(styles.root, className)} data-status={status}>
        <span className={cx(styles.label, hideLabel && "sr-only")}>{label}</span>
        <p className={styles.message}>
          <Mic aria-hidden className={styles.messageIcon} />
          {unsupportedText}
        </p>
      </div>
    );
  }

  async function ask() {
    setAsking(true);
    await requestPermission();
    setAsking(false);
  }

  return (
    <div className={cx(styles.root, className)} data-status={status}>
      {items.length > 0 ? (
        <Select
          label={label}
          hideLabel={hideLabel}
          size={size}
          items={items}
          value={current}
          placeholder={placeholder}
          disabled={disabled || status === "loading"}
          onValueChange={(id) => {
            if (value === undefined) setInternal(id);
            onValueChange?.(id, items.find((i) => i.value === id)?.device ?? null);
          }}
        />
      ) : (
        <span className={cx(styles.label, hideLabel && "sr-only")}>{label}</span>
      )}
      {status !== "loading" && !hasPermission && (
        <Button variant="secondary" size="sm" className={styles.permission} loading={asking} disabled={disabled} onClick={ask}>
          <Mic aria-hidden />
          {permissionLabel}
        </Button>
      )}
      <div role="status" className={styles.status}>
        {error ? (
          <p className={styles.error}>
            <CircleAlert aria-hidden className={styles.messageIcon} />
            {describeError(error)}
          </p>
        ) : status === "ready" && items.length === 0 && hasPermission ? (
          <p className={styles.message}>No microphones found.</p>
        ) : null}
      </div>
    </div>
  );
}
