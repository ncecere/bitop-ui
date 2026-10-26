/* Visible labels and counts must also be present in the computed accessible name.
 * textContent deliberately checks the actual text separator: a CSS gap is not text.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { CommandPalette } from "@/registry/bitop/ui/command-palette/command-palette";
import { type Facet, FilterBar } from "@/registry/bitop/ui/filter-bar/filter-bar";
import { NavTab, NavTabs, Tab, Tabs, TabsList } from "@/registry/bitop/ui/tabs/tabs";

const counts = [undefined, 0, 1, 1234, 1234567];
const labelWithCount = (label: string, count: number | undefined) => count === undefined ? label : `${label} ${count.toLocaleString()}`;
const icon = <svg aria-hidden data-testid="icon" />;

describe("tab visible labels and accessible names", () => {
  it.each(counts)("Tab preserves the label and count %s as separated text", (count) => {
    const ref = { current: null as HTMLButtonElement | null };
    render(
      <Tabs defaultValue="all">
        <TabsList aria-label="Activity">
          <Tab value="all" count={count} icon={icon} ref={ref} render={<button data-custom="tab" />}>
            <span>All</span>
          </Tab>
        </TabsList>
      </Tabs>,
    );
    const tab = screen.getByRole("tab");
    expect(tab).toHaveAccessibleName(labelWithCount("All", count));
    expect(tab.textContent).toBe(labelWithCount("All", count));
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("data-custom", "tab");
    expect(ref.current).toBe(tab);
    expect(within(tab).getByTestId("icon")).toBeVisible();
  });

  it.each(counts)("NavTab preserves the label and count %s as separated text", (count) => {
    const ref = { current: null as HTMLAnchorElement | null };
    render(
      <NavTabs aria-label="Activity">
        <NavTab href="/activity" current count={count} icon={icon} ref={ref} render={<a data-custom="link" />}>
          <span>All</span>
        </NavTab>
      </NavTabs>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAccessibleName(labelWithCount("All", count));
    expect(link.textContent).toBe(labelWithCount("All", count));
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveAttribute("href", "/activity");
    expect(link).toHaveAttribute("data-custom", "link");
    expect(ref.current).toBe(link);
    expect(within(link).getByTestId("icon")).toBeVisible();
    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("preserves caller-provided names while displaying the same localized count", () => {
    const count = 1234;
    const name = `All, ${count.toLocaleString()}`;
    render(
      <>
        <Tabs defaultValue="all">
          <TabsList aria-label="Panels">
            <Tab value="all" count={count} aria-label={name}>All</Tab>
          </TabsList>
        </Tabs>
        <NavTabs aria-label="Pages">
          <NavTab href="/all" count={count} aria-label={name}>All</NavTab>
        </NavTabs>
      </>,
    );
    for (const element of [screen.getByRole("tab"), screen.getByRole("link")]) {
      expect(element).toHaveAccessibleName(name);
      expect(element.textContent).toBe(labelWithCount("All", count));
    }
  });
});

describe("filter visible labels and accessible names", () => {
  const facets: Facet[] = [{
    id: "action",
    label: "Action",
    type: "toggle",
    allLabel: "All",
    options: [{ value: "added", label: "Added", icon }],
  }];

  it.each(counts)("keeps the option and count %s in the visible and computed names", async (count) => {
    const onValueChange = vi.fn();
    render(<FilterBar facets={facets} counts={count === undefined ? {} : { action: { added: count } }} onValueChange={onValueChange} />);
    const group = screen.getByRole("group", { name: "Action" });
    const added = within(group).getAllByRole("button")[1]!;
    expect(added).toHaveAccessibleName(labelWithCount("Added", count));
    expect(added.textContent).toBe(labelWithCount("Added", count));
    expect(within(added).getByTestId("icon")).toBeVisible();
    await userEvent.click(added);
    expect(added).toHaveAttribute("aria-pressed", "true");
    expect(onValueChange).toHaveBeenLastCalledWith({ action: ["added"] });
    await userEvent.click(within(group).getByRole("button", { name: "All" }));
    expect(onValueChange).toHaveBeenLastCalledWith({});
  });

  it("does not invent counts when none are supplied", () => {
    render(<FilterBar facets={facets} />);
    const added = screen.getByRole("button", { name: "Added" });
    expect(added).toHaveAccessibleName("Added");
    expect(added.textContent).toBe("Added");
  });
});

describe("command palette close label", () => {
  it.each([
    ["click", false],
    ["Escape", false],
    ["click", true],
    ["Escape", true],
  ] as const)("includes Esc and the close action; closes via %s (custom finalFocus: %s)", async (action, customFinalFocus) => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(false);
      const headingRef = useRef<HTMLHeadingElement>(null);
      return (
        <>
          <h1 ref={headingRef} tabIndex={-1}>Destination</h1>
          <button type="button" onClick={() => setOpen(true)}>Open palette</button>
          <CommandPalette
            open={open}
            onOpenChange={(next) => { onOpenChange(next); setOpen(next); }}
            finalFocus={customFinalFocus ? headingRef : undefined}
            groups={[{ label: "Actions", items: [{ id: "run", label: "Run", onSelect }] }]}
          />
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "Open palette" });
    await user.click(opener);
    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    const input = within(dialog).getByRole("combobox", { name: "Command palette" });
    await waitFor(() => expect(input).toHaveFocus());
    const close = within(dialog).getByRole("button", { name: /Close command palette/ });
    expect(close.textContent).toBe("Esc");
    expect(close).toHaveAccessibleName("Close command palette (Esc)");
    if (action === "click") await user.click(close);
    else await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(onSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(customFinalFocus ? screen.getByRole("heading", { name: "Destination" }) : opener).toHaveFocus());
  });
});
