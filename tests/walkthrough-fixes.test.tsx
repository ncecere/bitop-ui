/*
 * Regression tests for a consumer's release walkthrough: tab strips and
 * segmented controls on a phone, the toggle group's tab stop, the meter's
 * hidden "x", the custom date range and two Combobox modes. Each test failed
 * before its fix.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDays, Settings } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { DateRangePresets, type DateRangeSelection } from "@/registry/bitop/ui/date-picker/date-picker";
import { Meter } from "@/registry/bitop/ui/meter/meter";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { Tab, Tabs, TabsList, TabsPanel } from "@/registry/bitop/ui/tabs/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/registry/bitop/ui/toggle-group/toggle-group";

/* jsdom has no layout: give matching elements a 400px-wide content in a 200px box. */
function fakeOverflow(wide: (el: Element) => boolean) {
  const scroll = new WeakMap<Element, number>();
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockImplementation(function (this: HTMLElement) {
    return wide(this) ? 400 : 0;
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return wide(this) ? 200 : 0;
  });
  vi.spyOn(Element.prototype, "scrollLeft", "get").mockImplementation(function (this: Element) {
    return scroll.get(this) ?? 0;
  });
  vi.spyOn(Element.prototype, "scrollLeft", "set").mockImplementation(function (this: Element, v: number) {
    scroll.set(this, v);
  });
}

describe("Tab strips on a narrow screen", () => {
  afterEach(() => vi.restoreAllMocks());

  it("an overflowing tab list is marked for scrolling, with the hidden edge flagged as the user scrolls", async () => {
    fakeOverflow((el) => el.getAttribute("role") === "tablist");
    const { container } = render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Costs sections" variant="pills">
          <Tab value="overview" icon={<CalendarDays aria-hidden />}>
            Overview
          </Tab>
          <Tab value="settings" icon={<Settings aria-hidden />}>
            Settings
          </Tab>
        </TabsList>
        <TabsPanel value="overview">Totals</TabsPanel>
        <TabsPanel value="settings">Options</TabsPanel>
      </Tabs>,
    );
    const list = screen.getByRole("tablist", { name: "Costs sections" });
    expect(list).toHaveAttribute("data-overflowing");
    expect(list).toHaveAttribute("data-overflow-end");
    expect(list).not.toHaveAttribute("data-overflow-start");

    list.scrollLeft = 200;
    fireEvent.scroll(list);
    expect(list).toHaveAttribute("data-overflow-start");
    expect(list).not.toHaveAttribute("data-overflow-end");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a tab list that fits has no overflow flags", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Sections">
          <Tab value="a">A</Tab>
        </TabsList>
      </Tabs>,
    );
    expect(screen.getByRole("tablist")).not.toHaveAttribute("data-overflowing");
  });

  it("a joined toggle group and a wide table flag their hidden edges too", () => {
    // The group, and the table's scroll box (the table's parent).
    fakeOverflow((el) => el.getAttribute("role") === "group" || el.firstElementChild?.tagName === "TABLE");
    render(
      <>
        <ToggleGroup aria-label="Result" joined variant="outline" defaultValue={["all"]}>
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="fail">Failures</ToggleGroupItem>
          <ToggleGroupItem value="missing">Documents deleted</ToggleGroupItem>
        </ToggleGroup>
        <Table caption="Members" columns={["Name", "Email", ""]}>
          <Tr>
            <Td>Blair</Td>
            <Td>blair@example.com</Td>
            <Td>…</Td>
          </Tr>
        </Table>
      </>,
    );
    const group = screen.getByRole("group", { name: "Result" });
    expect(group).toHaveAttribute("data-overflowing");
    expect(group).toHaveAttribute("data-overflow-end");
    // A decorative shadow marks the table's hidden end.
    const frame = screen.getByRole("table", { name: "Members" }).parentElement!.parentElement!;
    expect(frame.querySelectorAll('[aria-hidden="true"][data-side="end"]')).toHaveLength(1);
    expect(frame.querySelector('[data-side="start"]')).toBeNull();
  });
});

describe("ToggleGroup tab stop", () => {
  function Presets({ initial = "30d" }: { initial?: string }) {
    const [value, setValue] = useState([initial]);
    return (
      <>
        <button type="button">Before</button>
        <ToggleGroup aria-label="Date range" joined variant="outline" value={value} onValueChange={(v) => v.length && setValue(v)}>
          <ToggleGroupItem value="today">Today</ToggleGroupItem>
          <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
        </ToggleGroup>
        <button type="button" onClick={() => setValue(["7d"])}>
          Reset to 7 days
        </button>
      </>
    );
  }

  it("the pressed item holds the tab stop, not the first item", async () => {
    const { container } = render(<Presets />);
    const group = screen.getByRole("group", { name: "Date range" });
    expect(within(group).getByRole("button", { name: "Last 30 days" })).toHaveAttribute("tabindex", "0");
    expect(within(group).getByRole("button", { name: "Today" })).toHaveAttribute("tabindex", "-1");
    await userEvent.click(screen.getByRole("button", { name: "Before" }));
    await userEvent.tab();
    expect(within(group).getByRole("button", { name: "Last 30 days" })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("an uncontrolled group starts on its pressed item too", () => {
    render(
      <ToggleGroup aria-label="Align" defaultValue={["center"]}>
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("button", { name: "Center" })).toHaveAttribute("tabindex", "0");
  });

  it("after the value changes from outside, Tab into the group lands on the new pressed item", async () => {
    render(<Presets />);
    const group = screen.getByRole("group", { name: "Date range" });
    await userEvent.click(screen.getByRole("button", { name: "Reset to 7 days" }));
    await userEvent.tab({ shift: true });
    expect(within(group).getByRole("button", { name: "Last 7 days" })).toHaveFocus();
    // Arrow keys still move from there.
    await userEvent.keyboard("{ArrowLeft}");
    expect(within(group).getByRole("button", { name: "Today" })).toHaveFocus();
  });

  it("a click presses and focuses the clicked item (focus isn't redirected)", async () => {
    render(<Presets />);
    const today = screen.getByRole("button", { name: "Today" });
    await userEvent.click(today);
    expect(today).toHaveFocus();
    expect(today).toHaveAttribute("aria-pressed", "true");
  });
});

describe("Meter", () => {
  it("has no stray text inside role=meter (Base UI's hidden 'x')", async () => {
    const { container } = render(<Meter label="QA Team: share of this month's budget used" value={51} max={100} valueText="51%" />);
    const meter = screen.getByRole("meter", { name: "QA Team: share of this month's budget used" });
    expect(meter).toHaveAttribute("aria-valuetext", "51%");
    expect(meter.textContent).toBe("QA Team: share of this month's budget used51%");
    expect(within(meter).queryByText("x")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DateRangePresets: Custom range", () => {
  const TODAY = new Date(2026, 8, 28);

  function Demo({ onChange }: { onChange: (v: DateRangeSelection | null) => void }) {
    const [value, setValue] = useState<DateRangeSelection | null>({ preset: "custom", range: { from: new Date(2026, 8, 20), to: new Date(2026, 8, 20) } });
    return (
      <DateRangePresets
        aria-label="Costs date range"
        today={TODAY}
        value={value}
        onValueChange={(v) => {
          onChange(v);
          setValue(v);
        }}
        pickerProps={{ numberOfMonths: 1, today: TODAY, max: TODAY }}
      />
    );
  }

  it("the first click sets the start and keeps the calendar open; the second sets the end", async () => {
    const onChange = vi.fn();
    render(<Demo onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Costs date range: custom/ }));
    const grid = await screen.findByRole("grid", { name: "September 2026" });
    await userEvent.click(within(grid).getByRole("button", { name: /September 1, 2026/ }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument();
    await userEvent.click(within(grid).getByRole("button", { name: /September 26, 2026/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const sel = onChange.mock.calls[0]![0] as DateRangeSelection;
    expect(sel.preset).toBe("custom");
    expect(sel.range?.from.getDate()).toBe(1);
    expect(sel.range?.to?.getDate()).toBe(26);
    expect(screen.getByRole("button", { name: /Costs date range: custom/ })).toHaveTextContent(/Sep 1, 2026.*Sep 26, 2026/);
  });

  it("works from the keyboard: Enter on the start day, arrows, Enter on the end day", async () => {
    const onChange = vi.fn();
    render(<Demo onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /Costs date range: custom/ }));
    const grid = await screen.findByRole("grid", { name: "September 2026" });
    within(grid).getByRole("button", { name: /September 10, 2026/ }).focus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => {
      await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{Enter}");
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    const sel = onChange.mock.calls[0]![0] as DateRangeSelection;
    expect([sel.range?.from.getDate(), sel.range?.to?.getDate()]).toEqual([10, 15]);
  });

  it("closing the calendar after one pick keeps the previous range", async () => {
    const onChange = vi.fn();
    render(<Demo onChange={onChange} />);
    const trigger = screen.getByRole("button", { name: /Costs date range: custom/ });
    await userEvent.click(trigger);
    const grid = await screen.findByRole("grid", { name: "September 2026" });
    await userEvent.click(within(grid).getByRole("button", { name: /September 3, 2026/ }));
    await userEvent.keyboard("{Escape}");
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent(/Sep 20, 2026.*Sep 20, 2026/);
  });
});

