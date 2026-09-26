"use client";

import { Slider } from "@base-ui/react/slider";
import { Toggle } from "@base-ui/react/toggle";
import { Pause, Play, RotateCcw, RotateCw, Volume1, Volume2, VolumeX } from "lucide-react";
import { type ComponentPropsWithRef, type ReactNode, type Ref, useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "@/registry/bitop/ui/button/button";
import { Select } from "@/registry/bitop/ui/select/select";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./audio-player.module.css";

/*
 * AudioPlayer: a native <audio> element with custom controls: play/pause,
 * optional skip back/forward, a seek slider (Base UI Slider), elapsed and
 * total time, mute (Base UI Toggle), volume and playback speed.
 *
 *   <AudioPlayer label="Generated speech" base64={speech.audio.base64} mediaType="audio/mpeg" />
 *   <AudioPlayer label="Episode 12" src="/audio/episode-12.mp3" skipSeconds={15} />
 *
 * Every control is a native button, a slider (arrow keys, Page Up/Down,
 * Home/End) or a select, so the player is fully keyboard operable. The
 * sliders announce times ("1:05 of 3:20") and volume as percentages.
 */

export type AudioSource =
  | { src: string; base64?: never; uint8Array?: never; mediaType?: string }
  | { base64: string; mediaType?: string; src?: never; uint8Array?: never }
  | { uint8Array: Uint8Array; mediaType?: string; src?: never; base64?: never };

export type AudioPlayerProps = Omit<ComponentPropsWithRef<"div">, "children" | "onPlay" | "onPause" | "onEnded" | "onTimeUpdate"> &
  AudioSource & {
    /** Accessible name of the player, e.g. "Generated speech". */
    label: string;
    /** Speeds offered in the speed menu (default 0.5–2). Pass [] to hide it. */
    playbackRates?: number[];
    defaultPlaybackRate?: number;
    /** Show skip back/forward buttons that jump this many seconds (default 0: hidden). */
    skipSeconds?: number;
    /** Show the volume slider next to the mute button (default true). */
    showVolume?: boolean;
    autoPlay?: boolean;
    loop?: boolean;
    preload?: "none" | "metadata" | "auto";
    onPlay?: () => void;
    onPause?: () => void;
    onEnded?: () => void;
    /** Called as playback progresses, with the current time in seconds. */
    onTimeUpdate?: (time: number) => void;
    /** Ref to the underlying <audio> element. */
    audioRef?: Ref<HTMLAudioElement>;
    /** Extra children for the <audio> element, e.g. <track kind="captions">. */
    tracks?: ReactNode;
  };

const DEFAULT_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

/** Formats seconds as m:ss (or h:mm:ss). */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

function useMediaUrl(src: string | undefined, base64: string | undefined, bytes: Uint8Array | undefined, mediaType: string): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!bytes || typeof URL.createObjectURL !== "function") return;
    const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mediaType }));
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(undefined);
    };
  }, [bytes, mediaType]);
  if (src) return src;
  if (base64) return base64.startsWith("data:") ? base64 : `data:${mediaType};base64,${base64}`;
  return bytes ? objectUrl : undefined;
}

export function AudioPlayer({
  label,
  src,
  base64,
  uint8Array,
  mediaType = "audio/mpeg",
  playbackRates = DEFAULT_RATES,
  defaultPlaybackRate = 1,
  skipSeconds = 0,
  showVolume = true,
  autoPlay,
  loop,
  preload = "metadata",
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  audioRef,
  tracks,
  className,
  ...props
}: AudioPlayerProps) {
  const url = useMediaUrl(src, base64, uint8Array, mediaType);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(Number.NaN);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(defaultPlaybackRate);

  const setAudio = useCallback(
    (node: HTMLAudioElement | null) => {
      audio.current = node;
      if (node) node.playbackRate = defaultPlaybackRate;
      if (typeof audioRef === "function") audioRef(node);
      else if (audioRef) audioRef.current = node;
    },
    [audioRef, defaultPlaybackRate],
  );

  const known = Number.isFinite(duration) && duration > 0;

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) {
      // play() rejects when autoplay is blocked or the source fails; the
      // element's own events keep the UI in sync, so the rejection is ignored.
      void el.play()?.catch(() => {});
    } else el.pause();
  }

  function seek(to: number) {
    const el = audio.current;
    if (!el || !known) return;
    const next = Math.min(Math.max(0, to), duration);
    el.currentTime = next;
    setTime(next);
  }

  function changeVolume(v: number) {
    const el = audio.current;
    setVolume(v);
    if (el) {
      el.volume = v;
      if (v > 0 && el.muted) el.muted = false;
    }
    if (v > 0) setMuted(false);
  }

  function changeMuted(next: boolean) {
    setMuted(next);
    if (audio.current) audio.current.muted = next;
  }

  function changeRate(value: string | null) {
    const next = Number(value ?? 1);
    setRate(next);
    if (audio.current) audio.current.playbackRate = next;
  }

  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const syncFromElement = (el: HTMLAudioElement) => {
    setDuration(el.duration);
    setTime(el.currentTime);
  };

  return (
    <div role="group" aria-label={label} {...props} data-playing={playing ? "" : undefined} className={cx(styles.root, className)}>
      <audio
        ref={setAudio}
        src={url}
        autoPlay={autoPlay}
        loop={loop}
        preload={preload}
        className={styles.audio}
        onLoadedMetadata={(e) => syncFromElement(e.currentTarget)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          onTimeUpdate?.(e.currentTarget.currentTime);
        }}
        onPlay={() => {
          setPlaying(true);
          onPlay?.();
        }}
        onPause={() => {
          setPlaying(false);
          onPause?.();
        }}
        onEnded={() => {
          setPlaying(false);
          onEnded?.();
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onRateChange={(e) => setRate(e.currentTarget.playbackRate)}
        onEmptied={() => {
          setPlaying(false);
          setTime(0);
          setDuration(Number.NaN);
        }}
      >
        {tracks}
      </audio>

      <IconButton
        size="sm"
        variant="secondary"
        className={styles.play}
        label={playing ? "Pause" : "Play"}
        icon={playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        disabled={!url}
        onClick={toggle}
      />
      {skipSeconds > 0 && (
        <>
          <IconButton size="sm" label={`Back ${skipSeconds} seconds`} icon={<RotateCcw aria-hidden />} disabled={!known} onClick={() => seek(time - skipSeconds)} />
          <IconButton size="sm" label={`Forward ${skipSeconds} seconds`} icon={<RotateCw aria-hidden />} disabled={!known} onClick={() => seek(time + skipSeconds)} />
        </>
      )}

      <span className={styles.time}>{formatTime(time)}</span>
      <Slider.Root
        className={styles.seek}
        value={known ? Math.min(time, duration) : 0}
        min={0}
        max={known ? duration : 1}
        step={1}
        largeStep={10}
        disabled={!known}
        onValueChange={(v) => seek(v as number)}
      >
        <Slider.Control className={styles.control}>
          <Slider.Track className={styles.track}>
            <Slider.Indicator className={styles.indicator} />
            <Slider.Thumb
              className={styles.thumb}
              aria-label="Seek"
              getAriaValueText={(_, v) => `${formatTime(v)} of ${known ? formatTime(duration) : "unknown duration"}`}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
      <span className={styles.time}>{known ? formatTime(duration) : "--:--"}</span>

      <Toggle
        pressed={muted}
        onPressedChange={(next) => changeMuted(next)}
        render={<IconButton size="sm" label="Mute" icon={<VolumeIcon aria-hidden />} />}
      />
      {showVolume && (
        <Slider.Root
          className={styles.volume}
          value={muted ? 0 : volume}
          min={0}
          max={1}
          step={0.05}
          largeStep={0.25}
          onValueChange={(v) => changeVolume(v as number)}
        >
          <Slider.Control className={styles.control}>
            <Slider.Track className={styles.track}>
              <Slider.Indicator className={styles.indicator} />
              <Slider.Thumb className={styles.thumb} aria-label="Volume" getAriaValueText={(_, v) => `${Math.round(v * 100)}%`} />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
      )}
      {playbackRates.length > 0 && (
        <Select
          label="Playback speed"
          hideLabel
          size="sm"
          className={styles.rate}
          value={String(rate)}
          onValueChange={changeRate}
          items={playbackRates.map((r) => ({ value: String(r), label: `${r}×` }))}
        />
      )}
    </div>
  );
}
