import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentPropsWithRef, useState } from "react";
import { axe } from "vitest-axe";
import { Button } from "@/registry/bitop/ui/button/button";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuItem,
  ContextMenuLinkItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSubmenu,
} from "@/registry/bitop/ui/context-menu/context-menu";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/bitop/ui/drawer/drawer";
import { Field } from "@/registry/bitop/ui/field/field";
import { HoverCard } from "@/registry/bitop/ui/hover-card/hover-card";
import { Input } from "@/registry/bitop/ui/input/input";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSubmenu,
} from "@/registry/bitop/ui/menubar/menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/registry/bitop/ui/navigation-menu/navigation-menu";
import { Sheet, SheetClose } from "@/registry/bitop/ui/sheet/sheet";

/* ------------------------------------------------------------------ */

describe("Drawer", () => {
  function Example(props: { side?: "bottom" | "top" | "left" | "right"; onOpenChange?: (open: boolean) => void; showClose?: boolean }) {
    return (
      <Drawer side={props.side} onOpenChange={props.onOpenChange}>
        <DrawerTrigger render={<Button>Open drawer</Button>} />
        <DrawerContent showClose={props.showClose}>
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <Field label="Calories">
              <Input defaultValue="350" />
            </Field>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  it("opens as a labelled, described dialog with focus inside; Escape closes and restores focus", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Example onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole("button", { name: "Open drawer" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Move goal" });
    expect(dialog).toHaveAccessibleDescription("Set your daily activity goal.");
    expect(dialog).toHaveAttribute("data-side", "bottom");
    expect(dialog).toHaveAttribute("data-swipe-direction", "down");
    expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(await axe(dialog)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
  });

  it("maps side to the swipe direction and closes from DrawerClose and the × button", async () => {
    const user = userEvent.setup();
    render(<Example side="right" showClose />);
    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    const dialog = await screen.findByRole("dialog", { name: "Move goal" });
    expect(dialog).toHaveAttribute("data-swipe-direction", "right");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    await user.click(screen.getByRole("button", { name: "Open drawer" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("can be controlled", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Rename</Button>
          <span data-testid="state">{open ? "open" : "closed"}</span>
          <Drawer side="left" open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerTitle>Rename project</DrawerTitle>
              <DrawerClose>Done</DrawerClose>
            </DrawerContent>
          </Drawer>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Rename" }));
    const dialog = await screen.findByRole("dialog", { name: "Rename project" });
    expect(screen.getByTestId("state")).toHaveTextContent("open");
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByTestId("state")).toHaveTextContent("closed");
  });
});

/* ------------------------------------------------------------------ */

describe("Sheet", () => {
  it("opens from its trigger on the right, named and described, with a close button", async () => {
    const user = userEvent.setup();
    render(
      <Sheet
        trigger={<Button variant="secondary">Filters</Button>}
        title="Filter deployments"
        description="Only matching deployments are shown."
        footer={<SheetClose>Cancel</SheetClose>}
      >
        <Field label="Branch">
          <Input />
        </Field>
      </Sheet>,
    );
    const trigger = screen.getByRole("button", { name: "Filters" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Filter deployments" });
    expect(dialog).toHaveAccessibleDescription("Only matching deployments are shown.");
    expect(dialog).toHaveAttribute("data-side", "right");
    await waitFor(() => expect(within(dialog).getByRole("textbox", { name: "Branch" })).toHaveFocus());
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("is controllable; SheetClose reports the close; side and hideClose apply", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Sheet open onOpenChange={onOpenChange} side="left" hideClose title="Details" description="Deployment details." footer={<SheetClose>Done</SheetClose>}>
        <p>Body</p>
      </Sheet>,
    );
    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(dialog).toHaveAttribute("data-side", "left");
    expect(within(dialog).queryByRole("button", { name: "Close" })).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

/* ------------------------------------------------------------------ */

describe("HoverCard", () => {
  it("opens on hover after the delay, keeps the trigger a link, and closes on leave", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <p>
        Deployed by{" "}
        <HoverCard trigger={<a href="/u/ada">@ada</a>} delay={10} closeDelay={10} onOpenChange={onOpenChange}>
          Ada Lovelace, platform engineer.
        </HoverCard>
      </p>,
    );
    const link = screen.getByRole("link", { name: "@ada" });
    expect(link).toHaveAttribute("href", "/u/ada");
    expect(screen.queryByText("Ada Lovelace, platform engineer.")).toBeNull();

    await user.hover(link);
    expect(await screen.findByText("Ada Lovelace, platform engineer.")).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(link).toHaveAttribute("data-popup-open");
    expect(await axe(container)).toHaveNoViolations();

    await user.unhover(link);
    await waitFor(() => expect(screen.queryByText("Ada Lovelace, platform engineer.")).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("can be controlled", async () => {
    render(
      <HoverCard open trigger={<a href="/repo">bitop/ui</a>} side="top">
        Copy-and-own components.
      </HoverCard>,
    );
    expect(await screen.findByText("Copy-and-own components.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */

describe("ContextMenu", () => {
  it("opens on right-click, supports keyboard navigation and item callbacks", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const onDelete = vi.fn();
    render(
      <ContextMenu trigger={<div>quarterly-report.pdf</div>}>
        <ContextMenuItem onClick={onCopy} shortcut="⌘C">
          Copy
        </ContextMenuItem>
        <ContextMenuLinkItem href="/download">Download</ContextMenuLinkItem>
        <ContextMenuSeparator />
        <ContextMenuItem tone="danger" onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenu>,
    );
    expect(screen.queryByRole("menu")).toBeNull();
    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("quarterly-report.pdf") });

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Copy" })).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: "Download" })).toHaveAttribute("href", "/download");
    expect(await axe(menu)).toHaveNoViolations();

    await waitFor(() => expect(menu).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Copy" })).toHaveFocus());
    await user.keyboard("{ArrowDown}{ArrowDown}");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Delete" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onCopy).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("toggles checkbox items and selects radio items without closing", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    function Options() {
      const [sort, setSort] = useState("name");
      return (
        <ContextMenu trigger={<div>Files</div>}>
          <ContextMenuCheckboxItem defaultChecked={false} onCheckedChange={onCheckedChange}>
            Show hidden files
          </ContextMenuCheckboxItem>
          <ContextMenuRadioGroup label="Sort by" value={sort} onValueChange={setSort}>
            <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
            <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenu>
      );
    }
    render(<Options />);
    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("Files") });
    const menu = await screen.findByRole("menu");

    const hidden = within(menu).getByRole("menuitemcheckbox", { name: "Show hidden files" });
    expect(hidden).toHaveAttribute("aria-checked", "false");
    await user.click(hidden);
    expect(hidden).toHaveAttribute("aria-checked", "true");
    expect(onCheckedChange).toHaveBeenCalledWith(true, expect.anything());

    expect(within(menu).getByRole("group", { name: "Sort by" })).toBeInTheDocument();
    const size = within(menu).getByRole("menuitemradio", { name: "Size" });
    expect(within(menu).getByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "true");
    await user.click(size);
    expect(size).toHaveAttribute("aria-checked", "true");
    expect(within(menu).getByRole("menuitemradio", { name: "Name" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(await axe(menu)).toHaveNoViolations();
  });

  it("opens a submenu with ArrowRight and closes it with ArrowLeft", async () => {
    const user = userEvent.setup();
    const onCopyLink = vi.fn();
    render(
      <ContextMenu trigger={<div>Report</div>}>
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuSubmenu label="Share">
          <ContextMenuItem onClick={onCopyLink}>Copy link</ContextMenuItem>
          <ContextMenuItem>Email</ContextMenuItem>
        </ContextMenuSubmenu>
      </ContextMenu>,
    );
    await user.pointer({ keys: "[MouseRight]", target: screen.getByText("Report") });
    const menu = await screen.findByRole("menu");
    // Base UI focuses the popup itself on open; keys pressed before that are lost.
    await waitFor(() => expect(menu).toHaveFocus());
    const share = within(menu).getByRole("menuitem", { name: "Share" });
    expect(share).toHaveAttribute("aria-haspopup", "menu");

    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Rename" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(share).toHaveFocus());
    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(2));
    const copyLink = await screen.findByRole("menuitem", { name: "Copy link" });
    await waitFor(() => expect(copyLink).toHaveFocus());

    await user.keyboard("{ArrowLeft}");
    await waitFor(() => expect(screen.getAllByRole("menu")).toHaveLength(1));
    await waitFor(() => expect(share).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Copy link" })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onCopyLink).toHaveBeenCalledTimes(1);
  });
});

/* ------------------------------------------------------------------ */

describe("Menubar", () => {
  function Editor({ onNew = () => {} }: { onNew?: () => void }) {
    const [wrap, setWrap] = useState(false);
    const [panel, setPanel] = useState("terminal");
    return (
      <Menubar aria-label="Editor">
        <MenubarMenu label="File">
          <MenubarItem onClick={onNew} shortcut="⌘N">
            New file
          </MenubarItem>
          <MenubarSubmenu label="Export as">
            <MenubarItem>PDF</MenubarItem>
          </MenubarSubmenu>
        </MenubarMenu>
        <MenubarMenu label="View">
          <MenubarCheckboxItem checked={wrap} onCheckedChange={setWrap}>
            Word wrap
          </MenubarCheckboxItem>
          <MenubarRadioGroup label="Panel" value={panel} onValueChange={setPanel}>
            <MenubarRadioItem value="terminal">Terminal</MenubarRadioItem>
            <MenubarRadioItem value="output">Output</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarMenu>
        <MenubarMenu label="Help" disabled>
          <MenubarItem>Docs</MenubarItem>
        </MenubarMenu>
      </Menubar>
    );
  }

  it("is a named menubar; arrows move between menus and open menus follow", async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    const { container } = render(<Editor onNew={onNew} />);
    const bar = screen.getByRole("menubar", { name: "Editor" });
    const file = within(bar).getByRole("menuitem", { name: "File" });
    const view = within(bar).getByRole("menuitem", { name: "View" });
    expect(file).toHaveAttribute("aria-haspopup", "menu");
    expect(await axe(container)).toHaveNoViolations();

    await user.tab();
    expect(file).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(view).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(file).toHaveFocus();

    await user.keyboard("{Enter}");
    const fileMenu = await screen.findByRole("menu");
    expect(file).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(within(fileMenu).getByRole("menuitem", { name: "New file" })).toHaveFocus());

    await user.keyboard("{ArrowRight}");
    await waitFor(() => expect(view).toHaveAttribute("aria-expanded", "true"));
    const viewMenu = await screen.findByRole("menu");
    expect(within(viewMenu).getByRole("menuitemcheckbox", { name: "Word wrap" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("runs items and toggles checkbox / radio items", async () => {
    const user = userEvent.setup();
    const onNew = vi.fn();
    render(<Editor onNew={onNew} />);
    await user.click(screen.getByRole("menuitem", { name: "File" }));
    await user.click(await screen.findByRole("menuitem", { name: "New file" }));
    expect(onNew).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    await user.click(screen.getByRole("menuitem", { name: "View" }));
    const wrap = await screen.findByRole("menuitemcheckbox", { name: "Word wrap" });
    await user.click(wrap);
    expect(wrap).toHaveAttribute("aria-checked", "true");
    const output = screen.getByRole("menuitemradio", { name: "Output" });
    await user.click(output);
    expect(output).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("group", { name: "Panel" })).toBeInTheDocument();
    expect(await axe(screen.getByRole("menu"))).toHaveNoViolations();
  });

  it("respects a disabled menu", async () => {
    const user = userEvent.setup();
    render(<Editor />);
    const help = screen.getByRole("menuitem", { name: "Help" });
    await user.click(help);
    expect(screen.queryByRole("menu")).toBeNull();
  });
});

/* ------------------------------------------------------------------ */

describe("NavigationMenu", () => {
  /** Stand-in for a router link component (e.g. TanStack / Next Link). */
  function RouterLink({ to, ...props }: ComponentPropsWithRef<"a"> & { to: string }) {
    return <a {...props} href={to} data-router-link="" />;
  }

  function Nav({ onValueChange }: { onValueChange?: (value: unknown) => void }) {
    return (
      <NavigationMenu aria-label="Main" onValueChange={onValueChange}>
        <NavigationMenuList>
          <NavigationMenuItem value="platform">
            <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
            <NavigationMenuContent columns={2}>
              <NavigationMenuLink href="/deployments" description="Ship every push.">
                Deployments
              </NavigationMenuLink>
              <NavigationMenuLink href="/edge">Edge network</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink render={<RouterLink to="/pricing" />} active>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }

  it("renders a named nav; router links keep href and mark the current page", async () => {
    const { container } = render(<Nav />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const pricing = within(nav).getByRole("link", { name: "Pricing" });
    expect(pricing).toHaveAttribute("href", "/pricing");
    expect(pricing).toHaveAttribute("data-router-link");
    expect(pricing).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("button", { name: "Platform" })).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("opens a panel from the trigger and closes it with Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<Nav onValueChange={onValueChange} />);
    const trigger = screen.getByRole("button", { name: "Platform" });
    await user.click(trigger);

    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(onValueChange).toHaveBeenLastCalledWith("platform", expect.anything());
    const deployments = await screen.findByRole("link", { name: /Deployments/ });
    expect(deployments).toHaveAttribute("href", "/deployments");
    expect(deployments).toHaveTextContent("Ship every push.");
    expect(await axe(container)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(onValueChange).toHaveBeenLastCalledWith(null, expect.anything());
  });

  it("opens the focused trigger's panel with ArrowDown", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Platform" });
    expect(trigger).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "true"));
    expect(await screen.findByRole("link", { name: /Edge network/ })).toBeInTheDocument();
  });
});
