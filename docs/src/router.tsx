/*
 * A tiny history router for the docs (no dependency). Paths are relative to
 * Vite's BASE_URL so the site works under a GitHub Pages project path.
 */
import { type ComponentPropsWithRef, createContext, type MouseEvent, type ReactNode, useContext, useEffect, useState } from "react";

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

export function RouterProvider({ initialPath, children }: { initialPath?: string; children: ReactNode }) {
  const [path, setPath] = useState(() => initialPath ?? currentPath());
  useEffect(() => {
    if (initialPath !== undefined) return;
    const onPop = () => setPath(currentPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [initialPath]);
  const navigate = (to: string) => {
    const [pathname, hash] = to.split("#");
    if (initialPath === undefined) window.history.pushState(null, "", toHref(pathname || "/") + (hash ? `#${hash}` : ""));
    setPath(pathname || "/");
    if (hash) requestAnimationFrame(() => document.getElementById(hash)?.scrollIntoView());
    else if (typeof window !== "undefined") window.scrollTo?.(0, 0);
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
