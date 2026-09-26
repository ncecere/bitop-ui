"use client";

import { ImageOff } from "lucide-react";
import { type CSSProperties, type ComponentPropsWithRef, type ReactNode, useEffect, useState } from "react";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./image.module.css";

/*
 * Image: shows an AI-generated image from base64, a Uint8Array or a URL,
 * with a shimmering placeholder while it loads and a text fallback if it
 * fails. `alt` is required: describe the image (or pass "" only when it is
 * purely decorative).
 *
 *   <Image base64={result.image.base64} mediaType="image/png" alt="A lighthouse at dusk" aspectRatio="1 / 1" />
 *   <Image uint8Array={bytes} mediaType="image/webp" alt="…" />
 *   <Image src="https://…/render.png" alt="…" />
 *
 * Byte arrays become an object URL that is revoked on unmount.
 */

export type ImageSource =
  | { base64: string; mediaType?: string; uint8Array?: never; src?: never }
  | { uint8Array: Uint8Array; mediaType?: string; base64?: never; src?: never }
  | { src: string; base64?: never; uint8Array?: never; mediaType?: never };

export type ImageProps = Omit<ComponentPropsWithRef<"img">, "src" | "alt" | "children"> &
  ImageSource & {
    /** Text alternative (required; "" marks the image decorative). */
    alt: string;
    /** CSS aspect-ratio reserved before the image loads, e.g. "16 / 9" or "1". */
    aspectRatio?: string;
    /** Rounded frame and ring (default true). */
    framed?: boolean;
    /** Shown when the image fails to load (default: "Image unavailable" plus the alt text). */
    fallback?: ReactNode;
    /** Class for the wrapping frame; `className` goes on the <img>. */
    frameClassName?: string;
  };

type LoadState = "loading" | "loaded" | "error";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Resolves an ImageSource to a URL, creating (and revoking) an object URL for byte arrays. */
export function useImageSource({ base64, uint8Array, src, mediaType = "image/png" }: { base64?: string; uint8Array?: Uint8Array; src?: string; mediaType?: string }): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined);
  const canObjectUrl = typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
  useEffect(() => {
    if (!uint8Array || !canObjectUrl) return;
    const url = URL.createObjectURL(new Blob([uint8Array as Uint8Array<ArrayBuffer>], { type: mediaType }));
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(undefined);
    };
  }, [uint8Array, mediaType, canObjectUrl]);
  if (src) return src;
  if (base64) return base64.startsWith("data:") ? base64 : `data:${mediaType};base64,${base64}`;
  if (uint8Array) return canObjectUrl ? objectUrl : `data:${mediaType};base64,${bytesToBase64(uint8Array)}`;
  return undefined;
}

export function Image({
  base64,
  uint8Array,
  src,
  mediaType,
  alt,
  aspectRatio,
  framed = true,
  fallback,
  frameClassName,
  className,
  style,
  onLoad,
  onError,
  ref,
  ...props
}: ImageProps) {
  const url = useImageSource({ base64, uint8Array, src, mediaType });
  const [state, setState] = useState<LoadState>("loading");
  const [prevUrl, setPrevUrl] = useState(url);
  if (url !== prevUrl) {
    setPrevUrl(url);
    setState("loading");
  }
  const frameStyle = aspectRatio ? ({ "--image-aspect": aspectRatio } as CSSProperties) : undefined;
  return (
    <span
      className={cx(styles.frame, frameClassName)}
      data-state={state}
      data-framed={framed ? "" : undefined}
      data-aspect={aspectRatio ? "" : undefined}
      aria-busy={state === "loading" || undefined}
      style={frameStyle}
    >
      {state === "error" ? (
        <span className={styles.fallback}>
          {fallback ?? (
            <>
              <ImageOff aria-hidden className={styles.fallbackIcon} />
              <span>
                Image unavailable
                {alt ? <span className={styles.fallbackAlt}>{alt}</span> : null}
              </span>
            </>
          )}
        </span>
      ) : (
        url && (
          <img
            decoding="async"
            {...props}
            ref={(node) => {
              // An image that finished before hydration never fires onLoad.
              if (node?.complete && node.naturalWidth > 0) setState("loaded");
              if (typeof ref === "function") return ref(node);
              if (ref) ref.current = node;
            }}
            src={url}
            alt={alt}
            style={style}
            className={cx(styles.img, className)}
            onLoad={(e) => {
              setState("loaded");
              onLoad?.(e);
            }}
            onError={(e) => {
              setState("error");
              onError?.(e);
            }}
          />
        )
      )}
    </span>
  );
}
