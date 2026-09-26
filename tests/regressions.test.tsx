/*
 * Regression tests for components that have no dedicated test file yet.
 */
import { act, render, screen } from "@testing-library/react";
import { COLOR_MODE_STORAGE_KEY, ColorModeToggle } from "@/registry/bitop/ui/color-mode/color-mode";

describe("ColorMode", () => {
  afterEach(() => {
    window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    delete document.documentElement.dataset.theme;
  });

  it("re-syncs when another tab changes the stored mode (storage event)", () => {
    render(<ColorModeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    // Another tab writes the key; this tab only hears the storage event.
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: COLOR_MODE_STORAGE_KEY, newValue: "dark", storageArea: window.localStorage }));
    });
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    // Clearing the key in the other tab goes back to the system preference (light in jsdom).
    window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: COLOR_MODE_STORAGE_KEY, newValue: null, storageArea: window.localStorage }));
    });
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
