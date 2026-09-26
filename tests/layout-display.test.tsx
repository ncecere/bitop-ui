import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Accordion, AccordionItem, AccordionPanel, AccordionTrigger } from "@/registry/bitop/ui/accordion/accordion";
import { AspectRatio } from "@/registry/bitop/ui/aspect-ratio/aspect-ratio";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/registry/bitop/ui/carousel/carousel";
import { DataTable, compareValues, type DataTableColumn } from "@/registry/bitop/ui/data-table/data-table";
import { DirectionProvider, useDirection } from "@/registry/bitop/ui/direction/direction";
import { Item, ItemContent, ItemGroup, ItemSeparator, ItemTitle } from "@/registry/bitop/ui/item/item";
import { Marker, MarkerContent, MarkerIcon } from "@/registry/bitop/ui/marker/marker";
import { Paginator, PaginationLink, getPaginationRange } from "@/registry/bitop/ui/pagination/pagination";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/bitop/ui/resizable/resizable";
import { ScrollArea } from "@/registry/bitop/ui/scroll-area/scroll-area";

/* ---------------- Accordion ---------------- */

function Faq(props: Partial<Parameters<typeof Accordion>[0]>) {
  return (
    <Accordion {...props}>
      <AccordionItem value="a">
        <AccordionTrigger>First</AccordionTrigger>
        <AccordionPanel>First panel</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionPanel>Second panel</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion", () => {
  it("wraps triggers in headings and wires aria-expanded / aria-controls", async () => {
    const user = userEvent.setup();
    const { container } = render(<Faq />);
    const first = screen.getByRole("button", { name: "First" });
    expect(first.closest("h3")).not.toBeNull();
    expect(first).toHaveAttribute("aria-expanded", "false");

    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(first.getAttribute("aria-controls")!);
    expect(panel).toHaveTextContent("First panel");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("opens one item at a time by default and several with multiple", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Faq defaultValue={["a"]} />);
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
    unmount();

    render(<Faq multiple defaultValue={["a"]} />);
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(screen.getByRole("button", { name: "First" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Second" })).toHaveAttribute("aria-expanded", "true");
  });

  it("is controllable, toggles with the keyboard and honours headingLevel", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<unknown[]>([]);
      return (
        <Faq
          headingLevel={2}
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange(v);
          }}
        />
      );
    }
    render(<Controlled />);
    const second = screen.getByRole("button", { name: "Second" });
    expect(second.closest("h2")).not.toBeNull();
    second.focus();
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["b"]);
    expect(second).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(second).toHaveAttribute("aria-expanded", "false");
  });
});

/* ---------------- ScrollArea ---------------- */

describe("ScrollArea", () => {
  it("is not a tab stop or landmark when the content fits", async () => {
    const { container } = render(
      <ScrollArea label="Notes">
        <p>Short</p>
      </ScrollArea>,
    );
    expect(screen.queryByRole("region", { name: "Notes" })).toBeNull();
    expect(screen.getByText("Short")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("becomes a focusable, named region when the content overflows", async () => {
    const heights = { clientHeight: 100, scrollHeight: 400, offsetHeight: 100, clientWidth: 200, scrollWidth: 200, offsetWidth: 200 };
    const restore = Object.entries(heights).map(([key, value]) => {
      const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, key);
      Object.defineProperty(HTMLElement.prototype, key, { configurable: true, get: () => value });
      return () => original && Object.defineProperty(HTMLElement.prototype, key, original);
    });
    try {
      const { container } = render(
        <ScrollArea label="Release notes" maxHeight="6rem">
          <p>Long content</p>
        </ScrollArea>,
      );
      const region = await screen.findByRole("region", { name: "Release notes" });
      expect(region).toHaveAttribute("tabindex", "0");
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      restore.forEach((r) => r());
    }
  });
});

/* ---------------- AspectRatio, Marker, Item, Direction ---------------- */

describe("display parts", () => {
  it("AspectRatio passes the ratio as a custom property", async () => {
    const { container } = render(
      <AspectRatio ratio={16 / 9} data-testid="box">
        <img src="data:," alt="Poster" />
      </AspectRatio>,
    );
    expect(screen.getByTestId("box").style.getPropertyValue("--aspect-ratio")).toBe(String(16 / 9));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Marker hides its icon and can render as a link or status", async () => {
    const { container } = render(
      <>
        <Marker role="status">
          <MarkerIcon>
            <svg data-testid="icon" />
          </MarkerIcon>
          <MarkerContent>Reading files</MarkerContent>
        </Marker>
        <Marker variant="separator" render={<a href="/runs/1" />}>
          <MarkerContent>Open run</MarkerContent>
        </Marker>
      </>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Reading files");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    const link = screen.getByRole("link", { name: "Open run" });
    expect(link).toHaveAttribute("href", "/runs/1");
    expect(link).toHaveAttribute("data-variant", "separator");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Item groups are lists and link items keep the link role", async () => {
    const { container } = render(
      <ItemGroup aria-label="Settings">
        <Item render={<a href="/billing" />} variant="outline" size="sm">
          <ItemContent>
            <ItemTitle>Billing</ItemTitle>
          </ItemContent>
        </Item>
        <ItemSeparator />
        <Item>
          <ItemContent>
            <ItemTitle>Members</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>,
    );
    const list = screen.getByRole("list", { name: "Settings" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const link = screen.getByRole("link", { name: "Billing" });
    expect(link).toHaveAttribute("href", "/billing");
    expect(link).toHaveAttribute("data-variant", "outline");
    expect(link).toHaveAttribute("data-size", "sm");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("DirectionProvider feeds useDirection", () => {
    function Show() {
      return <span>{useDirection()}</span>;
    }
    render(
      <>
        <Show />
        <DirectionProvider direction="rtl">
          <Show />
        </DirectionProvider>
      </>,
    );
    expect(screen.getByText("ltr")).toBeInTheDocument();
    expect(screen.getByText("rtl")).toBeInTheDocument();
  });
});

/* ---------------- Pagination ---------------- */

describe("Pagination", () => {
  it("computes page ranges with ellipses", () => {
    expect(getPaginationRange(1, 1)).toEqual([1]);
    expect(getPaginationRange(2, 3)).toEqual([1, 2, 3]);
    expect(getPaginationRange(1, 10)).toEqual([1, 2, 3, 4, 5, "end-ellipsis", 10]);
    expect(getPaginationRange(5, 10)).toEqual([1, "start-ellipsis", 4, 5, 6, "end-ellipsis", 10]);
    expect(getPaginationRange(10, 10)).toEqual([1, "start-ellipsis", 6, 7, 8, 9, 10]);
    expect(getPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(getPaginationRange(1, 0)).toEqual([]);
  });

  it("Paginator renders buttons for client-side state", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [page, setPage] = useState(1);
      return <Paginator label="Results pages" page={page} pageCount={10} onPageChange={setPage} />;
    }
    const { container } = render(<Demo />);
    const nav = screen.getByRole("navigation", { name: "Results pages" });
    expect(within(nav).getByRole("button", { name: "Page 1" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Go to previous page" })).toBeDisabled();
    expect(within(nav).getByText("More pages")).toBeInTheDocument();

    await user.click(within(nav).getByRole("button", { name: "Go to next page" }));
    expect(within(nav).getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    await user.click(within(nav).getByRole("button", { name: "Page 10" }));
    expect(within(nav).getByRole("button", { name: "Page 10" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Go to next page" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Paginator renders links with getHref or renderLink", async () => {
    const { container, unmount } = render(<Paginator page={2} pageCount={3} getHref={(p) => `/docs?page=${p}`} />);
    const nav = screen.getByRole("navigation", { name: "Pagination" });
    expect(within(nav).getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Go to next page" })).toHaveAttribute("href", "/docs?page=3");
    expect(within(nav).getByRole("link", { name: "Go to previous page" })).toHaveAttribute("href", "/docs?page=1");
    expect(await axe(container)).toHaveNoViolations();
    unmount();

    render(<Paginator page={1} pageCount={2} renderLink={(p) => <a href={`#p${p}`} data-router="" />} />);
    const link = screen.getByRole("link", { name: "Page 2" });
    expect(link).toHaveAttribute("href", "#p2");
    expect(link).toHaveAttribute("data-router");
    // A disabled step can't be a link.
    expect(screen.getByRole("button", { name: "Go to previous page" })).toBeDisabled();
  });

  it("PaginationLink supports router render and aria-current", () => {
    render(
      <PaginationLink isActive render={<a href="/p/3" data-router="" />}>
        3
      </PaginationLink>,
    );
    const link = screen.getByRole("link", { name: "3" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveAttribute("data-router");
  });
});

/* ---------------- Carousel ---------------- */

describe("Carousel", () => {
  function Slides(props: { onIndexChange?: (i: number) => void; setApi?: (api: CarouselApi) => void }) {
    return (
      <Carousel label="Templates" {...props}>
        <CarouselContent>
          <CarouselItem>Alpha</CarouselItem>
          <CarouselItem>Beta</CarouselItem>
          <CarouselItem>Gamma</CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );
  }

  it("uses carousel and slide semantics", async () => {
    const { container } = render(<Slides />);
    const region = screen.getByRole("region", { name: "Templates" });
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    const slides = within(region).getAllByRole("group");
    expect(slides).toHaveLength(3);
    expect(slides[1]).toHaveAttribute("aria-roledescription", "slide");
    expect(slides[1]).toHaveAccessibleName("2 of 3");
    const track = slides[0]!.parentElement!;
    expect(screen.getByRole("button", { name: "Next slide" })).toHaveAttribute("aria-controls", track.id);
    expect(screen.getByRole("button", { name: "Previous slide" })).toHaveAttribute("aria-disabled", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("moves with the buttons and arrow keys, announces, and reports the index", async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    const apis: CarouselApi[] = [];
    render(<Slides onIndexChange={onIndexChange} setApi={(api) => apis.push(api)} />);
    expect(apis.at(-1)).toMatchObject({ selectedIndex: 0, slideCount: 3, canScrollPrev: false, canScrollNext: true });

    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("status")).toHaveTextContent("Slide 2 of 3");
    expect(screen.getByRole("button", { name: "Previous slide" })).not.toHaveAttribute("aria-disabled");

    await user.keyboard("{ArrowRight}");
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByRole("status")).toHaveTextContent("Slide 3 of 3");
    const next = screen.getByRole("button", { name: "Next slide" });
    expect(next).toHaveAttribute("aria-disabled", "true");
    // Stays focusable at the end, and does nothing.
    await user.click(next);
    expect(onIndexChange).toHaveBeenCalledTimes(2);

    await user.keyboard("{ArrowLeft}");
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    expect(apis.at(-1)).toMatchObject({ selectedIndex: 1 });
    act(() => apis.at(-1)!.scrollTo(0));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });
});

/* ---------------- Resizable ---------------- */

describe("Resizable", () => {
  function Layout(props: { onLayoutChange?: (l: number[]) => void; defaultLayout?: number[]; orientation?: "horizontal" | "vertical" }) {
    return (
      <ResizablePanelGroup {...props} style={{ width: "100%" }}>
        <ResizablePanel id="side" defaultSize={30} minSize={20} maxSize={60}>
          Sidebar
        </ResizablePanel>
        <ResizableHandle label="Resize sidebar" withHandle />
        <ResizablePanel id="main" minSize={30}>
          Main
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  it("exposes a focusable splitter with value, limits and controls", async () => {
    const { container } = render(<Layout />);
    const handle = screen.getByRole("separator", { name: "Resize sidebar" });
    expect(handle).toHaveAttribute("tabindex", "0");
    expect(handle).toHaveAttribute("aria-orientation", "vertical");
    expect(handle).toHaveAttribute("aria-controls", "side");
    expect(handle).toHaveAttribute("aria-valuenow", "30");
    expect(handle).toHaveAttribute("aria-valuemin", "20");
    // max is limited by the main panel's minSize (100 - 30).
    expect(handle).toHaveAttribute("aria-valuemax", "60");
    expect(screen.getByText("Sidebar").style.getPropertyValue("--panel-size")).toBe("30");
    expect(screen.getByText("Main").style.getPropertyValue("--panel-size")).toBe("70");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("resizes with the keyboard within min/max and reports the layout", async () => {
    const user = userEvent.setup();
    const onLayoutChange = vi.fn();
    render(<Layout onLayoutChange={onLayoutChange} />);
    const handle = screen.getByRole("separator");
    handle.focus();
    await user.keyboard("{ArrowRight}");
    expect(handle).toHaveAttribute("aria-valuenow", "35");
    expect(onLayoutChange).toHaveBeenLastCalledWith([35, 65]);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "25");
    await user.keyboard("{Home}");
    expect(handle).toHaveAttribute("aria-valuenow", "20");
    await user.keyboard("{ArrowLeft}");
    expect(handle).toHaveAttribute("aria-valuenow", "20");
    await user.keyboard("{End}");
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
  });

  it("restores defaultLayout and uses Up/Down when vertical", async () => {
    const user = userEvent.setup();
    render(<Layout orientation="vertical" defaultLayout={[50, 50]} />);
    const handle = screen.getByRole("separator");
    expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle).toHaveAttribute("aria-valuenow", "50");
    handle.focus();
    await user.keyboard("{ArrowDown}");
    expect(handle).toHaveAttribute("aria-valuenow", "55");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(handle).toHaveAttribute("aria-valuenow", "45");
  });

  it("resizes by pointer drag", () => {
    const onLayoutChange = vi.fn();
    render(<Layout onLayoutChange={onLayoutChange} />);
    const side = screen.getByText("Sidebar");
    const main = screen.getByText("Main");
    side.getBoundingClientRect = () => ({ width: 300, height: 100, top: 0, left: 0, right: 300, bottom: 100, x: 0, y: 0, toJSON() {} });
    main.getBoundingClientRect = () => ({ width: 700, height: 100, top: 0, left: 300, right: 1000, bottom: 100, x: 300, y: 0, toJSON() {} });
    const handle = screen.getByRole("separator");
    fireEvent.pointerDown(handle, { button: 0, clientX: 300, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 400, pointerId: 1 });
    expect(handle).toHaveAttribute("aria-valuenow", "40");
    fireEvent.pointerMove(handle, { clientX: 900, pointerId: 1 });
    expect(handle).toHaveAttribute("aria-valuenow", "60");
    fireEvent.pointerUp(handle, { clientX: 900, pointerId: 1 });
    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(onLayoutChange).toHaveBeenLastCalledWith([60, 40]);
  });
});

/* ---------------- DataTable ---------------- */

type Row = { id: string; name: string; size: number };
const rows: Row[] = [
  { id: "r1", name: "beta.pdf", size: 30 },
  { id: "r2", name: "alpha.md", size: 200 },
  { id: "r3", name: "gamma.txt", size: 5 },
  { id: "r4", name: "delta.csv", size: 80 },
  { id: "r5", name: "alpine.png", size: 120 },
];
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Name", accessor: "name", sortable: true, rowHeader: true },
  { id: "size", header: "Size", accessor: "size", sortable: true, numeric: true, cell: (r) => `${r.size} KB` },
];
const bodyNames = () =>
  screen
    .getAllByRole("rowheader")
    .map((c) => c.textContent);

describe("DataTable", () => {
  it("compares values with numbers, dates and empties", () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues("file2", "file10")).toBeLessThan(0);
    expect(compareValues(new Date(2020, 0, 1), new Date(2021, 0, 1))).toBeLessThan(0);
    expect(compareValues(null, "a")).toBeGreaterThan(0);
  });

  it("sorts with header buttons and sets aria-sort", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const { container } = render(<DataTable caption="Files" columns={columns} data={rows} getRowId={(r) => r.id} onSortChange={onSortChange} />);
    expect(bodyNames()).toEqual(["beta.pdf", "alpha.md", "gamma.txt", "delta.csv", "alpine.png"]);
    const sizeHeader = screen.getByRole("columnheader", { name: "Size" });
    expect(sizeHeader).not.toHaveAttribute("aria-sort");

    await user.click(within(sizeHeader).getByRole("button", { name: "Size" }));
    expect(sizeHeader).toHaveAttribute("aria-sort", "ascending");
    expect(onSortChange).toHaveBeenLastCalledWith({ columnId: "size", direction: "ascending" });
    expect(bodyNames()).toEqual(["gamma.txt", "beta.pdf", "delta.csv", "alpine.png", "alpha.md"]);

    await user.click(within(sizeHeader).getByRole("button", { name: "Size" }));
    expect(sizeHeader).toHaveAttribute("aria-sort", "descending");
    expect(bodyNames()[0]).toBe("alpha.md");

    await user.click(within(sizeHeader).getByRole("button", { name: "Size" }));
    expect(sizeHeader).not.toHaveAttribute("aria-sort");
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    expect(bodyNames()[0]).toBe("beta.pdf");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("selects rows, including select-all with a mixed state", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { container } = render(
      <DataTable
        caption="Files"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        selectable
        rowLabel={(r) => r.name}
        onSelectionChange={onSelectionChange}
      />,
    );
    const all = screen.getByRole("checkbox", { name: "Select all rows" });
    await user.click(screen.getByRole("checkbox", { name: "Select alpha.md" }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(["r2"]);
    expect(all).toHaveAttribute("aria-checked", "mixed");
    expect(screen.getByText("1 of 5 selected")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Select alpha.md" }).closest("tr")).toHaveAttribute("data-selected");

    await user.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith(["r1", "r2", "r3", "r4", "r5"]);
    expect(all).toHaveAttribute("aria-checked", "true");
    await user.click(all);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("filters rows, announces the count and shows a no-results message", async () => {
    const user = userEvent.setup();
    const { container } = render(<DataTable caption="Files" columns={columns} data={rows} filterable filterLabel="Filter files" />);
    const input = screen.getByRole("searchbox", { name: "Filter files" });
    await user.type(input, "alp");
    expect(bodyNames()).toEqual(["alpha.md", "alpine.png"]);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("2 rows match the filter"));
    await user.clear(input);
    await user.type(input, "zzz");
    expect(screen.getByText("No results for “zzz”.")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("paginates with the Paginator and resets to page 1 on sort", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { container } = render(
      <DataTable caption="Files" columns={columns} data={rows} getRowId={(r) => r.id} pageSize={2} onPageChange={onPageChange} />,
    );
    const nav = screen.getByRole("navigation", { name: "Files pages" });
    expect(bodyNames()).toEqual(["beta.pdf", "alpha.md"]);
    expect(screen.getByText("Rows 1–2 of 5")).toBeInTheDocument();

    await user.click(within(nav).getByRole("button", { name: "Page 3" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(bodyNames()).toEqual(["alpine.png"]);

    await user.click(screen.getByRole("button", { name: "Name" }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(bodyNames()).toEqual(["alpha.md", "alpine.png"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the empty state when there is no data", () => {
    render(<DataTable caption="Files" columns={columns} data={[]} empty={<p>No files yet</p>} />);
    expect(screen.getByText("No files yet")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).toBeNull();
  });
});
