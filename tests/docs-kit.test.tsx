/*
 * The docs site keeps the command palette out of its entry chunk by copying
 * the registry's CommandPaletteTrigger and useCommandPaletteShortcut into
 * docs/src/kit/lazy-command-palette.tsx. These tests fail if the copies drift
 * from the registry versions.
 */
import { fireEvent, render, renderHook } from "@testing-library/react";
import * as docsCopy from "../docs/src/kit/lazy-command-palette";
import * as registry from "@/registry/bitop/ui/command-palette/command-palette";

describe("docs copies of the command palette trigger and shortcut", () => {
  it.each([{}, { label: "Search or jump to…" }, { className: "extra" }])("render the same trigger markup (%o)", (props) => {
    const a = render(<registry.CommandPaletteTrigger onClick={() => {}} {...props} />);
    const b = render(<docsCopy.CommandPaletteTrigger onClick={() => {}} {...props} />);
    expect(b.container.innerHTML).toBe(a.container.innerHTML);
  });

  it("respond to the same shortcuts", () => {
    const calls = { registry: 0, docs: 0 };
    renderHook(() => registry.useCommandPaletteShortcut(() => calls.registry++));
    renderHook(() => docsCopy.useCommandPaletteShortcut(() => calls.docs++));
    const keys = [
      { key: "k", ctrlKey: true },
      { key: "k", metaKey: true },
      { key: "K", ctrlKey: true, shiftKey: true },
      { key: "k" },
      { key: "j", ctrlKey: true },
    ];
    for (const init of keys) {
      const before = { ...calls };
      fireEvent.keyDown(window, init);
      expect(calls.docs - before.docs, JSON.stringify(init)).toBe(calls.registry - before.registry);
    }
    // Sanity: at least one of the shortcuts fired, so the comparison means something.
    expect(calls.registry).toBeGreaterThan(0);
  });
});
