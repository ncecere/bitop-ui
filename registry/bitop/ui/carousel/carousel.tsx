"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { IconButton, type IconButtonProps } from "@/registry/bitop/ui/button/button";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./carousel.module.css";

/*
 * Carousel: a row (or column) of slides on a CSS scroll-snap track, with
 * previous/next buttons. No dependencies: the browser does the scrolling,
 * swiping and snapping.
 *
 *   <Carousel label="Featured templates">
 *     <CarouselContent>
 *       <CarouselItem>…</CarouselItem>
 *       <CarouselItem>…</CarouselItem>
 *     </CarouselContent>
 *     <CarouselPrevious />
 *     <CarouselNext />
 *   </Carousel>
 *
 * Accessibility (WAI-ARIA APG carousel pattern): the root is a region with
 * aria-roledescription="carousel" named by `label`; every slide is a group
 * with aria-roledescription="slide" and a "2 of 5" label. Moving with the
 * buttons or the arrow keys (while focus is inside the carousel) announces
 * "Slide 2 of 5" in a polite live region. There is no autoplay.
 *
 * `onIndexChange` reports the slide nearest the start edge; `setApi`
 * receives { scrollTo, scrollPrev, scrollNext, selectedIndex, slideCount,
 * canScrollPrev, canScrollNext } whenever it changes.
 */

export type CarouselOrientation = "horizontal" | "vertical";

export type CarouselApi = {
  scrollTo: (index: number) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  selectedIndex: number;
  slideCount: number;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

type CarouselContextValue = CarouselApi & {
  trackRef: RefObject<HTMLDivElement | null>;
  trackId: string;
  orientation: CarouselOrientation;
  slideLabel: (index: number, count: number) => string;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

/** The carousel's API from inside a Carousel (e.g. for custom dots). */
export function useCarousel(): CarouselContextValue {
  const ctx = useContext(CarouselContext);
  if (!ctx) throw new Error("useCarousel must be used inside <Carousel>");
  return ctx;
}

export type CarouselProps = Omit<ComponentPropsWithRef<"section">, "aria-label"> & {
  /** Names the carousel region (required), e.g. "Featured templates". */
  label: string;
  orientation?: CarouselOrientation;
  /** Slide to show first (default 0). */
  defaultIndex?: number;
  /** Called when the current slide changes (by buttons, keys, swipe or scroll). */
  onIndexChange?: (index: number) => void;
  /** Receives the carousel API whenever it changes. */
  setApi?: (api: CarouselApi) => void;
  /** Label of each slide (default "2 of 5"). */
  slideLabel?: (index: number, count: number) => string;
  /** Text announced after navigating (default "Slide 2 of 5"). */
  announcement?: (index: number, count: number) => string;
};

const defaultSlideLabel = (i: number, n: number) => `${i + 1} of ${n}`;
const defaultAnnouncement = (i: number, n: number) => `Slide ${i + 1} of ${n}`;

function prefersReducedMotion() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Carousel({
  label,
  orientation = "horizontal",
  defaultIndex = 0,
  onIndexChange,
  setApi,
  slideLabel = defaultSlideLabel,
  announcement = defaultAnnouncement,
  className,
  onKeyDown,
  children,
  ...props
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const trackId = useId();
  const [index, setIndex] = useState(defaultIndex);
  const [count, setCount] = useState(0);
  // null = can't measure (no layout), so fall back to the index.
  const [edges, setEdges] = useState<{ start: boolean; end: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const horizontal = orientation === "horizontal";
  // While a programmatic (smooth) scroll runs, keep the target slide as the
  // index instead of reporting every slide it passes.
  const target = useRef<number | null>(null);
  const targetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const geometry = useCallback(() => {
    const track = trackRef.current;
    if (!track) return null;
    const rtl = horizontal && getComputedStyle(track).direction === "rtl";
    const box = track.getBoundingClientRect();
    const offset = (el: Element) => {
      const r = el.getBoundingClientRect();
      return horizontal ? (rtl ? box.right - r.right : r.left - box.left) : r.top - box.top;
    };
    return { track, rtl, offset };
  }, [horizontal]);

  const measure = useCallback(() => {
    const g = geometry();
    if (!g) return;
    const { track, offset } = g;
    setCount(track.children.length);
    const max = horizontal ? track.scrollWidth - track.clientWidth : track.scrollHeight - track.clientHeight;
    if ((horizontal ? track.clientWidth : track.clientHeight) === 0) {
      setEdges(null);
      return;
    }
    const pos = Math.abs(horizontal ? track.scrollLeft : track.scrollTop);
    setEdges({ start: pos <= 1, end: pos >= max - 1 });
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((slide, i) => {
      const d = Math.abs(offset(slide));
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    if (target.current !== null) {
      if (nearest !== target.current) return;
      target.current = null;
    }
    setIndex(nearest);
  }, [geometry, horizontal]);

  // Count slides, follow scrolling and resizing.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    setCount(track.children.length);
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const mo = new MutationObserver(() => setCount(track.children.length));
    mo.observe(track, { childList: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(track);
    track.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(targetTimer.current);
      mo.disconnect();
      ro?.disconnect();
      track.removeEventListener("scroll", schedule);
    };
  }, [measure]);

  const scrollTo = useCallback(
    (to: number, announce = false, instant = false) => {
      const g = geometry();
      if (!g) return;
      const { track, rtl, offset } = g;
      const n = track.children.length;
      if (n === 0) return;
      const i = Math.min(Math.max(0, to), n - 1);
      const slide = track.children[i]!;
      const delta = offset(slide);
      const behavior: ScrollBehavior = instant || prefersReducedMotion() ? "auto" : "smooth";
      if (typeof track.scrollBy === "function") {
        track.scrollBy(horizontal ? { left: rtl ? -delta : delta, behavior } : { top: delta, behavior });
      }
      target.current = i;
      clearTimeout(targetTimer.current);
      targetTimer.current = setTimeout(() => {
        target.current = null;
      }, 1000);
      setIndex(i);
      if (announce) setMessage(announcement(i, n));
    },
    [geometry, horizontal, announcement],
  );

  // Initial slide.
  const initial = useRef(defaultIndex);
  useLayoutEffect(() => {
    if (initial.current > 0) scrollTo(initial.current, false, true);
    initial.current = 0;
  }, [scrollTo]);

  const canScrollPrev = index > 0 && edges?.start !== true;
  const canScrollNext = index < count - 1 && edges?.end !== true;
  const scrollPrev = useCallback(() => scrollTo(index - 1, true), [scrollTo, index]);
  const scrollNext = useCallback(() => scrollTo(index + 1, true), [scrollTo, index]);

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;
  const lastIndex = useRef(index);
  useEffect(() => {
    if (lastIndex.current === index) return;
    lastIndex.current = index;
    onIndexChangeRef.current?.(index);
  }, [index]);

  const api = useMemo<CarouselApi>(
    () => ({
      scrollTo: (i: number) => scrollTo(i, true),
      scrollPrev,
      scrollNext,
      selectedIndex: index,
      slideCount: count,
      canScrollPrev,
      canScrollNext,
    }),
    [scrollTo, scrollPrev, scrollNext, index, count, canScrollPrev, canScrollNext],
  );

  useEffect(() => {
    setApi?.(api);
  }, [api, setApi]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const el = event.target as HTMLElement;
    if (el.closest("input, textarea, select, [contenteditable='true']")) return;
    const rtl = horizontal && trackRef.current !== null && getComputedStyle(trackRef.current).direction === "rtl";
    const prevKey = horizontal ? (rtl ? "ArrowRight" : "ArrowLeft") : "ArrowUp";
    const nextKey = horizontal ? (rtl ? "ArrowLeft" : "ArrowRight") : "ArrowDown";
    if (event.key === prevKey) {
      event.preventDefault();
      if (canScrollPrev) scrollPrev();
    } else if (event.key === nextKey) {
      event.preventDefault();
      if (canScrollNext) scrollNext();
    }
  }

  const value = useMemo<CarouselContextValue>(
    () => ({ ...api, trackRef, trackId, orientation, slideLabel }),
    [api, trackId, orientation, slideLabel],
  );

  return (
    <CarouselContext.Provider value={value}>
      <section
        {...props}
        aria-roledescription="carousel"
        aria-label={label}
        data-orientation={orientation}
        className={cx(styles.root, className)}
        onKeyDown={handleKeyDown}
      >
        {children}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {message}
        </div>
      </section>
    </CarouselContext.Provider>
  );
}

export type CarouselContentProps = ComponentPropsWithRef<"div"> & {
  /** Slides visible at once (default 1). Items size themselves to fit, gaps included. */
  slidesPerView?: number;
};

/** The scroll-snap track. Its direct children must be CarouselItems. */
export function CarouselContent({ slidesPerView, className, style, ref, ...props }: CarouselContentProps) {
  const { trackRef, trackId, orientation } = useCarousel();
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      trackRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [trackRef, ref],
  );
  const perView = slidesPerView ? ({ "--carousel-per-view": slidesPerView } as CSSProperties) : undefined;
  return (
    <div
      {...props}
      ref={setRef}
      id={trackId}
      data-orientation={orientation}
      style={{ ...perView, ...style }}
      className={cx(styles.track, className)}
    />
  );
}

export type CarouselItemProps = ComponentPropsWithRef<"div"> & {
  /** Explicit slide size along the track, e.g. "18rem" (overrides slidesPerView). */
  basis?: string;
};

export function CarouselItem({ basis, className, style, ref, ...props }: CarouselItemProps) {
  const { slideCount, slideLabel, selectedIndex } = useCarousel();
  const self = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(-1);
  useLayoutEffect(() => {
    const el = self.current;
    if (el?.parentElement) setPosition(Array.prototype.indexOf.call(el.parentElement.children, el));
  }, [slideCount]);
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      self.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const basisStyle = basis ? ({ "--carousel-basis": basis } as CSSProperties) : undefined;
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={position >= 0 && slideCount > 0 ? slideLabel(position, slideCount) : undefined}
      {...props}
      ref={setRef}
      data-current={position === selectedIndex ? "" : undefined}
      data-basis={basis ? "" : undefined}
      style={{ ...basisStyle, ...style }}
      className={cx(styles.slide, className)}
    />
  );
}

export type CarouselButtonProps = Omit<IconButtonProps, "icon" | "label"> & {
  /** Accessible name (default "Previous slide" / "Next slide"). */
  label?: string;
};

function CarouselStep({ step, label, className, onClick, variant = "secondary", ...props }: CarouselButtonProps & { step: "prev" | "next" }) {
  const { orientation, trackId, canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useCarousel();
  const enabled = step === "prev" ? canScrollPrev : canScrollNext;
  const Icon = orientation === "horizontal" ? (step === "prev" ? ChevronLeft : ChevronRight) : step === "prev" ? ChevronUp : ChevronDown;
  return (
    <IconButton
      {...props}
      variant={variant}
      label={label ?? (step === "prev" ? "Previous slide" : "Next slide")}
      icon={<Icon aria-hidden className={orientation === "horizontal" ? styles.flip : undefined} />}
      aria-controls={trackId}
      // Stay focusable at the ends so focus isn't lost; just do nothing.
      aria-disabled={!enabled || undefined}
      data-step={step}
      data-orientation={orientation}
      className={cx(styles.button, className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && enabled) (step === "prev" ? scrollPrev : scrollNext)();
      }}
    />
  );
}

export function CarouselPrevious(props: CarouselButtonProps) {
  return <CarouselStep {...props} step="prev" />;
}

export function CarouselNext(props: CarouselButtonProps) {
  return <CarouselStep {...props} step="next" />;
}
