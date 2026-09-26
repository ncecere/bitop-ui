/*
 * A tiny history router for the docs (no dependency). Paths are relative to
 * Vite's BASE_URL so the site works under a GitHub Pages project path.
 */
import { type ComponentPropsWithRef, createContext, type MouseEvent, type ReactNode, startTransition, useContext, useEffect, useState } from "react";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function toHref(path: string) {
  return `${base}${path}`;
}

function currentPath() {
  if (typeof window === "undefined") return "/";
  const p = window.location.pathname;
  const stripped = p.startsWith(base) ? p.slice(base.length) : p;
  return stripped.replace(/\/+$/, "") || "/";
}

type RouterState = { path: string; navigate: (to: string) => void };
const RouterContext = createContext<RouterState>({ path: "/", navigate: () => {} });

/**
 * Where focus goes after a client-side navigation: the `#hash` target, else
 * the page's <h1>, else <main>. Moving focus there puts keyboard users at the
 * new content and makes screen readers announce it (WCAG 2.4.3). Non-focusable
 * targets get tabIndex=-1 so they can take programmatic focus.
 */
export function routeFocusTarget(hash?: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const el = (hash && document.getElementById(decodeURIComponent(hash))) || document.querySelector<HTMLElement>("main h1") || document.querySelector<HTMLElement>("main");
  if (el && !el.hasAttribute("tabindex") && el.tabIndex < 0) el.setAttribute("tabindex", "-1");
  return el;
}

export function RouterProvider({ initialPath, children }: { initialPath?: string; children: ReactNode }) {
  const [path, setPath] = useState(() => initialPath ?? currentPath());
  // Bumped on every navigation (not on first load), so focus moves only then.
  const [navigation, setNavigation] = useState<{ count: number; hash?: string }>({ count: 0 });
  useEffect(() => {
    if (initialPath !== undefined) return;
    const onPop = () => {
      const hash = window.location.hash.slice(1) || undefined;
      startTransition(() => {
        setPath(currentPath());
        setNavigation((n) => ({ count: n.count + 1, hash }));
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initialPath]);

  useEffect(() => {
    if (navigation.count === 0) return;
    const target = routeFocusTarget(navigation.hash);
    if (!target) return;
    if (navigation.hash) target.scrollIntoView?.();
    else window.scrollTo?.(0, 0);
    target.focus({ preventScroll: true });
  }, [navigation]);

  // Navigations are transitions: while a code-split page loads, the current
  // page stays on screen (no fallback flash), and path + focus update together
  // once the new page has rendered, so focus lands on its heading.
  const navigate = (to: string) => {
    const [pathname, hash] = to.split("#");
    if (initialPath === undefined) window.history.pushState(null, "", toHref(pathname || "/") + (hash ? `#${hash}` : ""));
    startTransition(() => {
      setPath(pathname || "/");
      setNavigation((n) => ({ count: n.count + 1, hash: hash || undefined }));
    });
  };
  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}

export type LinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & { to: string };

/** An <a> that navigates client-side. Sets aria-current="page" on the active route. */
export function Link({ to, onClick, "aria-current": ariaCurrent, ...props }: LinkProps) {
  const { path, navigate } = useRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  // Props first: components that render through us (useRender) pass href: undefined.
  return <a {...props} href={toHref(to)} aria-current={ariaCurrent ?? (path === to.split("#")[0] ? "page" : undefined)} onClick={handle} />;
}
