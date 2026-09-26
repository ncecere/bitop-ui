/*
 * The docs' ⌘K palette, code-split. CommandPalette (Base UI Dialog +
 * Autocomplete, ~45 kB minified) is only needed once someone opens it, but
 * importing CommandPaletteTrigger or useCommandPaletteShortcut from the same
 * registry module would pull the whole module into the entry chunk. So the
 * trigger and the shortcut are mirrored here (same markup, same CSS module)
 * and the palette itself loads on first open, or earlier on hover/focus of the
 * trigger and when the browser is idle.
 */
import { Search } from "lucide-react";
import { type ComponentProps, lazy, Suspense, useEffect } from "react";
import triggerStyles from "@/registry/bitop/ui/command-palette/command-palette.module.css";
import { KbdShortcut } from "@/registry/bitop/ui/kbd/kbd";
import { cx } from "@/registry/bitop/lib/bitop-utils";

const loadPalette = () => import("@/registry/bitop/ui/command-palette/command-palette");
const CommandPalette = lazy(() => loadPalette().then((m) => ({ default: m.CommandPalette })));

export function preloadCommandPalette() {
  void loadPalette().catch(() => {});
}

/** Renders the palette once it has been opened at least once (`mounted`). */
export function LazyCommandPalette({ mounted, ...props }: ComponentProps<typeof CommandPalette> & { mounted: boolean }) {
  // Warm the chunk when the browser has nothing better to do, so ⌘K is instant.
  useEffect(() => {
    if (typeof window.requestIdleCallback !== "function") return;
    const id = window.requestIdleCallback(preloadCommandPalette, { timeout: 5000 });
    return () => window.cancelIdleCallback(id);
  }, []);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette {...props} />
    </Suspense>
  );
}

/** Same as the registry's useCommandPaletteShortcut: ⌘K (Apple) / Ctrl+K (others). */
export function useCommandPaletteShortcut(toggle: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);
}

/** Same markup and styles as the registry's CommandPaletteTrigger. */
export function CommandPaletteTrigger({ onClick, label = "Search…", className }: { onClick: () => void; label?: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={preloadCommandPalette}
      onFocus={preloadCommandPalette}
      className={cx(triggerStyles.trigger, className)}
      aria-keyshortcuts="Meta+K Control+K"
    >
      <Search aria-hidden className={triggerStyles.triggerIcon} />
      <span className={triggerStyles.triggerLabel}>{label}</span>
      <span aria-hidden className={triggerStyles.triggerKbd}>
        <KbdShortcut keys={["mod", "K"]} size="sm" />
      </span>
    </button>
  );
}
