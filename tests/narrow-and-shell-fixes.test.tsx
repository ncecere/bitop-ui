/*
 * Regression tests for a consumer's pre-beta bug hunt: a long breadcrumb
 * trail, tables on a phone and at 1024px (stacked settings tables, pinned row
 * actions, empty states), segmented controls and pill tabs that wrap instead
 * of hiding choices, a card's actions on a narrow screen, and a popover opened
 * with the mouse. Each test failed before its fix.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { Button } from "@/registry/bitop/ui/button/button";
import { DataTable } from "@/registry/bitop/ui/data-table/data-table";
import { Popover } from "@/registry/bitop/ui/popover/popover";
import { Dialog } from "@/registry/bitop/ui/dialog/dialog";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { TagInput } from "@/registry/bitop/ui/tag-input/tag-input";
import { Field } from "@/registry/bitop/ui/field/field";
import { useState } from "react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Tab, Tabs, TabsList } from "@/registry/bitop/ui/tabs/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/registry/bitop/ui/toggle-group/toggle-group";

describe("Breadcrumbs on one line", () => {
  it("keeps one line by default and gives every text crumb its full text as a title", async () => {
    const long = "A shared source with a very long name that would never fit in the top bar of a window";
    const { container } = render(<Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Shared sources", href: "/s" }, { label: long }]} />);
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).not.toHaveAttribute("data-wrap");
    expect(screen.getByRole("link", { name: "Shared sources" })).toHaveAttribute("title", "Shared sources");
    expect(screen.getByText(long)).toHaveAttribute("aria-current", "page");
    expect(screen.getByText(long)).toHaveAttribute("title", long);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("never caps a crumb's width while the trail fits: no percentage of the trail, the current page cut first to its floor", () => {
    const css = readFileSync(resolve(__dirname, "../registry/bitop/ui/breadcrumbs/breadcrumbs.module.css"), "utf8");
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");
    // "max-width: min(16rem, 40%)" resolved against the trail itself cut "Admin" with a thousand pixels free.
    expect(rules).not.toMatch(/\.item[^{]*\{[^}]*max-width/);
    expect(rules).toMatch(/\.item:last-child\s*\{[^}]*flex-shrink:\s*10000;/);
    expect(rules).toMatch(/min-width:\s*min\(var\(--crumb-width, 0px\), 5\.5rem\)/);
    expect(rules).toMatch(/min-width:\s*min\(var\(--crumb-width, 0px\), 12rem, 25vw\)/);
  });

  it("measures each crumb's full width as its floor, so a short crumb is never stretched", () => {
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 60 } as DOMRect);
    const scroll = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(90);
    const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(40);
    render(<Breadcrumbs items={[{ label: "Office of the Registrar", href: "/" }, { label: "Agents" }]} />);
    const first = screen.getByRole("link", { name: "Office of the Registrar" }).closest("li")!;
    // 60 wide with its text cut to 40 of 90: 110 uncut.
    expect(first.style.getPropertyValue("--crumb-width")).toBe("110px");
    rect.mockRestore();
    scroll.mockRestore();
    client.mockRestore();
  });

  it("wraps on request", () => {
    render(<Breadcrumbs wrap items={[{ label: "Home", href: "/" }, { label: "Page" }]} />);
    expect(screen.getByRole("navigation")).toHaveAttribute("data-wrap");
  });
});

describe("Table: stacked rows, pinned actions and the empty state", () => {
  it("a stacked table names each cell after its column (not the first one or a hidden header)", async () => {
    const { container } = render(
      <Table caption="Limits" stack columns={["Limit", "Default", "Ceiling", ""]}>
        <Tr>
          <Td>Crawled pages per day</Td>
          <Td>5,000</Td>
          <Td>10,000</Td>
          <Td>…</Td>
        </Tr>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Limits" });
    expect(table).toHaveAttribute("data-stack");
    const cells = within(table).getAllByRole("cell");
    await waitFor(() => expect(cells[1]).toHaveAttribute("data-label", "Default"));
    expect(cells[2]).toHaveAttribute("data-label", "Ceiling");
    expect(cells[0]).not.toHaveAttribute("data-label");
    expect(cells[3]).not.toHaveAttribute("data-label");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("labels rows added later", async () => {
    const { rerender } = render(<Table caption="Settings" stack columns={["Event", "Email"]} />);
    rerender(
      <Table caption="Settings" stack columns={["Event", "Email"]}>
        <Tr>
          <Td>Invited</Td>
          <Td>On</Td>
        </Tr>
      </Table>,
    );
    await waitFor(() => expect(screen.getByRole("cell", { name: "On" })).toHaveAttribute("data-label", "Email"));
  });

  it("a stickyEnd column pins its header and cells, and replaces the end edge shadow", () => {
    render(
      <Table caption="Models" columns={["Name", { label: "Actions", hideLabel: true, stickyEnd: true }]}>
        <Tr>
          <Td>chat</Td>
          <Td stickyEnd>…</Td>
        </Tr>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Models" });
    expect(within(table).getAllByRole("columnheader")[1]).toHaveAttribute("data-sticky-end");
    expect(within(table).getByRole("cell", { name: "…" })).toHaveAttribute("data-sticky-end");
    expect(table.closest("[data-sticky-end]")).not.toBeNull();
  });

  it("DataTable pins its row actions column", () => {
    render(
      <DataTable
        caption="Teams"
        data={[{ id: "a", name: "Library" }]}
        getRowId={(r) => r.id}
        columns={[{ id: "name", header: "Name", accessor: (r) => r.name }]}
        rowActions={(r) => <Button size="sm">Open {r.name}</Button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Open Library" }).closest("td")).toHaveAttribute("data-sticky-end");
  });

  it("wraps the empty content in a box centred on the visible width", () => {
    render(<Table caption="Empty" columns={["A", "B"]} empty={<p>Nothing yet.</p>} />);
    const p = screen.getByText("Nothing yet.");
    expect(p.parentElement?.tagName).toBe("DIV");
    expect(p.parentElement?.parentElement?.tagName).toBe("TD");
  });
});

describe("Segmented controls and pill tabs that don't fit", () => {
  afterEach(() => vi.restoreAllMocks());

  it("a joined group wraps by default and spaces its items once they sit on two lines", async () => {
    // jsdom has no layout: the third item sits on a second line.
    vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.textContent === "Disabled by platform" ? 40 : 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockImplementation(() => document.body);
    const { container } = render(
      <ToggleGroup aria-label="Status" joined variant="outline" defaultValue={["any"]}>
        <ToggleGroupItem value="any">Any</ToggleGroupItem>
        <ToggleGroupItem value="team">Disabled by team</ToggleGroupItem>
        <ToggleGroupItem value="platform">Disabled by platform</ToggleGroupItem>
      </ToggleGroup>,
    );
    const group = screen.getByRole("group", { name: "Status" });
    expect(group).toHaveAttribute("data-overflow-mode", "wrap");
    await waitFor(() => expect(group).toHaveAttribute("data-wrapped"));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("scrolls on request, and a group that isn't joined has no overflow mode", () => {
    render(
      <>
        <ToggleGroup aria-label="Range" joined overflow="scroll">
          <ToggleGroupItem value="7d">7 days</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup aria-label="Format">
          <ToggleGroupItem value="b">Bold</ToggleGroupItem>
        </ToggleGroup>
      </>,
    );
    expect(screen.getByRole("group", { name: "Range" })).toHaveAttribute("data-overflow-mode", "scroll");
    expect(screen.getByRole("group", { name: "Format" })).not.toHaveAttribute("data-overflow-mode");
  });

  it("pill tabs wrap and underline tabs scroll by default", () => {
    render(
      <>
        <Tabs defaultValue="a">
          <TabsList aria-label="Pills" variant="pills">
            <Tab value="a">A</Tab>
          </TabsList>
        </Tabs>
        <Tabs defaultValue="a">
          <TabsList aria-label="Underline">
            <Tab value="a">A</Tab>
          </TabsList>
        </Tabs>
      </>,
    );
    expect(screen.getByRole("tablist", { name: "Pills" })).toHaveAttribute("data-overflow-mode", "wrap");
    expect(screen.getByRole("tablist", { name: "Underline" })).toHaveAttribute("data-overflow-mode", "scroll");
  });
});

describe("Popover pointerFocus", () => {
  it('"popup": a mouse opens it with focus on the popup, the keyboard on its first control', async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<Button>Notifications</Button>} title="Notifications" pointerFocus="popup">
        <a href="/n/1">First notification</a>
      </Popover>,
    );
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(dialog).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    screen.getByRole("button", { name: "Notifications" }).focus();
    await user.keyboard("{Enter}");
    await waitFor(() => expect(screen.getByRole("link", { name: "First notification" })).toHaveFocus());
  });
});

describe("TagInput noun", () => {
  it("names the list, the Remove buttons and the announcements after what the tags are", async () => {
    const user = userEvent.setup();
    function Origins() {
      const [v, setV] = useState(["https://a.example.edu"]);
      return (
        <Field label="Allowed origins">
          <TagInput value={v} onValueChange={setV} noun={{ one: "origin", other: "origins" }} normalize={(t) => t.trim()} />
        </Field>
      );
    }
    const { container } = render(<Origins />);
    expect(screen.getByRole("list", { name: "Origins" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove origin https://a.example.edu" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Allowed origins" })).toHaveAttribute("placeholder", "Add origins…");
    await user.type(screen.getByRole("textbox", { name: "Allowed origins" }), "https://b.example.edu{Enter}");
    expect(await screen.findByText("Added origin https://b.example.edu")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DataTable search in the filter bar's chips", () => {
  it("shows the search as a chip, and Clear all clears it with the filters", async () => {
    const user = userEvent.setup();
    const rows = [
      { id: "a", name: "Wi-Fi help", kind: "it" },
      { id: "b", name: "Library hours", kind: "library" },
    ];
    render(
      <DataTable
        caption="Agents"
        filterable
        data={rows}
        getRowId={(r) => r.id}
        columns={[{ id: "name", header: "Name", accessor: (r) => r.name }]}
        facets={[{ id: "kind", label: "Team", type: "select", accessor: (r) => r.kind, options: [{ value: "it", label: "IT" }, { value: "library", label: "Library" }] }]}
        facetValues={{ kind: ["it"] }}
        onFacetValuesChange={() => {}}
      />,
    );
    await user.type(screen.getByRole("searchbox"), "wi");
    expect(await screen.findByRole("button", { name: "Remove filter Search: wi" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveValue(""));
  });
});

describe("Dialog", () => {
  it("is aria-modal", async () => {
    render(<Dialog open title="Rename conversation">Body</Dialog>);
    expect(await screen.findByRole("dialog", { name: "Rename conversation" })).toHaveAttribute("aria-modal", "true");
  });
});
