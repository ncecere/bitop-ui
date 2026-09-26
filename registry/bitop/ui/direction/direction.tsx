"use client";

import { DirectionProvider as BaseDirectionProvider, useDirection as useBaseDirection } from "@base-ui/react/direction-provider";
import type { ReactNode } from "react";

/*
 * DirectionProvider: tells Base UI-driven components (menus, sliders,
 * tabs, accordions, scroll areas, carousels, resizable panels…) whether the
 * text reads left-to-right or right-to-left, so arrow keys, popup placement
 * and scrollbars follow the reading direction.
 *
 *   <html dir="rtl">…
 *   <DirectionProvider direction="rtl"><App /></DirectionProvider>
 *
 * The provider does not set the HTML `dir` attribute: set `dir` on <html>
 * (or the subtree) as well, so the browser lays text out correctly. Portaled
 * popups render outside that subtree; read `useDirection()` to pass the
 * direction on.
 */

export type Direction = "ltr" | "rtl";

export type DirectionProviderProps = {
  /** Reading direction (default "ltr"). */
  direction?: Direction;
  children?: ReactNode;
};

export function DirectionProvider({ direction = "ltr", children }: DirectionProviderProps) {
  return <BaseDirectionProvider direction={direction}>{children}</BaseDirectionProvider>;
}

/** The reading direction from the nearest DirectionProvider ("ltr" without one). */
export function useDirection(): Direction {
  return useBaseDirection();
}
