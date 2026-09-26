/*
 * Behaviour tests for interactive components that were previously only
 * rendered by the docs-page axe sweep: Select, Tabs/NavTabs, Popover,
 * Tooltip, CopyButton, AppShell, ColorMode, Task and Artifact.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import {
  AppShell,
  Brand,
  Main,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarModeSwitch,
  SidebarNav,
  SidebarSection,
  SidebarToggle,
  SidebarUser,
  TopBar,
  WorkspaceSwitcher,
  useAppShell,
} from "@/registry/bitop/ui/app-shell/app-shell";
import { Artifact, ArtifactActions, ArtifactClose, ArtifactContent, ArtifactHeader, ArtifactTitle } from "@/registry/bitop/ui/artifact/artifact";
import { Button } from "@/registry/bitop/ui/button/button";
import { COLOR_MODE_STORAGE_KEY, ColorModeToggle, colorModeScript, setColorMode, useColorMode } from "@/registry/bitop/ui/color-mode/color-mode";
import { CopyButton, writeClipboard } from "@/registry/bitop/ui/copy-button/copy-button";
import { MenuItem } from "@/registry/bitop/ui/menu/menu";
import { Popover } from "@/registry/bitop/ui/popover/popover";
import { Select, type SelectItem } from "@/registry/bitop/ui/select/select";
import { NavTab, NavTabs, Tab, Tabs, TabsList, TabsPanel } from "@/registry/bitop/ui/tabs/tabs";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "@/registry/bitop/ui/task/task";
import { Tooltip } from "@/registry/bitop/ui/tooltip/tooltip";

// Popups portal to <body>, outside any landmark in these bare renders, so the
// page-level "region" rule doesn't apply when auditing the whole body.
const noLandmarkRule = { rules: { region: { enabled: false } } };

/* ------------------------------------------------------------------ */

describe("Select", () => {
  const regions: SelectItem[] = [
    { value: "us", label: "United States", hint: "Default" },
    { value: "eu", label: "European Union" },
    { value: "ap", label: "Asia Pacific", disabled: true },
    { value: "ca", label: "Canada" },
  ];

  it("names the trigger with its label and shows the placeholder", async () => {
    const { container } = render(<Select label="Region" items={regions} placeholder="Pick a region" />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveTextContent("Pick a region");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps the label for assistive technology when hideLabel is set", () => {
    render(<Select label="Region" hideLabel items={regions} />);
    expect(screen.getByRole("combobox", { name: "Region" })).toBeInTheDocument();
    expect(screen.getByText("Region")).toHaveClass("sr-only");
  });

  it("opens on click, selects an option, closes and returns focus (uncontrolled)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Region" items={regions} onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    await user.click(trigger);

    const listbox = await screen.findByRole("listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(within(listbox).getAllByRole("option")).toHaveLength(4);
    expect(within(listbox).getByRole("option", { name: /Asia Pacific/ })).toHaveAttribute("aria-disabled", "true");
    expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();

    await user.click(within(listbox).getByRole("option", { name: /European Union/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("eu");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(trigger).toHaveTextContent("European Union");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("is operable from the keyboard and marks the selected option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Region" items={regions} defaultValue="us" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    expect(trigger).toHaveTextContent("United States");

    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("option", { name: /United States/ })).toHaveAttribute("aria-selected", "true");

    // Move past the selected option to the next one and pick it with Enter.
    await waitFor(() => expect(document.activeElement).toHaveAttribute("role", "option"));
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(listbox).getByRole("option", { name: /European Union/ })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("eu");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(trigger).toHaveTextContent("European Union");
  });

  it("never selects a disabled option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Region" items={regions} defaultValue="eu" onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowDown}");
    const listbox = await screen.findByRole("listbox");
    await waitFor(() => expect(within(listbox).getByRole("option", { name: /European Union/ })).toHaveFocus());
    // Base UI keeps disabled options reachable (APG-permitted) but Enter doesn't pick them.
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(listbox).getByRole("option", { name: /Asia Pacific/ })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(listbox).getByRole("option", { name: /Canada/ })).toHaveFocus());
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("ca");
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Select label="Region" items={regions} defaultValue="us" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    await user.click(trigger);
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("United States");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("respects a controlled value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Select label="Region" items={regions} value="us" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    await user.click(trigger);
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: /Canada/ }));
    expect(onValueChange).toHaveBeenLastCalledWith("ca");
    // The parent didn't accept the change, so the trigger still shows the old value.
    expect(trigger).toHaveTextContent("United States");

    rerender(<Select label="Region" items={regions} value="ca" onValueChange={onValueChange} />);
    expect(trigger).toHaveTextContent("Canada");
  });

  it("round-trips a controlled value through parent state", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <Select label="Region" items={regions} value={value} onValueChange={setValue} />
          <output aria-label="Chosen">{value ?? "none"}</output>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("status", { name: "Chosen" })).toHaveTextContent("none");
    await user.click(screen.getByRole("combobox", { name: "Region" }));
    await user.click(within(await screen.findByRole("listbox")).getByRole("option", { name: /Canada/ }));
    expect(screen.getByRole("status", { name: "Chosen" })).toHaveTextContent("ca");
  });

  it("submits its value with a form under `name`", async () => {
    const { container } = render(
      <form aria-label="Settings">
        <Select label="Region" items={regions} name="region" defaultValue="eu" />
      </form>,
    );
    const form = container.querySelector("form")!;
    expect(new FormData(form).get("region")).toBe("eu");
  });

  it("disables the trigger", () => {
    render(<Select label="Region" items={regions} disabled />);
    const trigger = screen.getByRole("combobox", { name: "Region" });
    expect(trigger).toHaveAttribute("data-disabled");
  });

  it("merges className onto the wrapper and sets the size flag", () => {
    const { container } = render(<Select label="Region" items={regions} className="scoped" size="sm" />);
    expect(container.querySelector(".scoped")).toContainElement(screen.getByRole("combobox"));
    expect(screen.getByRole("combobox")).toHaveAttribute("data-size", "sm");
  });
});

/* ------------------------------------------------------------------ */

describe("Tabs", () => {
  function Basic(props: { onValueChange?: (v: unknown) => void; activateOnFocus?: boolean }) {
    return (
      <Tabs defaultValue="overview" onValueChange={props.onValueChange}>
        <TabsList aria-label="Source" activateOnFocus={props.activateOnFocus}>
          <Tab value="overview">Overview</Tab>
          <Tab value="files" count={12}>
            Files
          </Tab>
          <Tab value="archived" disabled>
            Archived
          </Tab>
          <Tab value="settings">Settings</Tab>
        </TabsList>
        <TabsPanel value="overview">Overview panel</TabsPanel>
        <TabsPanel value="files">Files panel</TabsPanel>
        <TabsPanel value="archived">Archived panel</TabsPanel>
        <TabsPanel value="settings">Settings panel</TabsPanel>
      </Tabs>
    );
  }

  it("wires tablist, tabs and panels together", async () => {
    const { container } = render(<Basic />);
    const tablist = screen.getByRole("tablist", { name: "Source" });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(4);
    const overview = screen.getByRole("tab", { name: "Overview" });
    expect(overview).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: /Files/ })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tab", { name: /Files/ })).toHaveTextContent("12");

    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("Overview panel");
    expect(panel).toHaveAccessibleName("Overview");
    expect(overview).toHaveAttribute("aria-controls", panel.id);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses roving focus: only the selected tab is in the tab order", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.tab();
    // Tab leaves the tablist (to the focusable panel or the next control).
    expect(screen.getByRole("tab", { name: /Files/ })).not.toHaveFocus();
    expect(screen.getByRole("tab", { name: "Settings" })).not.toHaveFocus();
  });

  it("moves focus with arrow keys, wraps, and activates with Enter (disabled tabs can't be activated)", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    const files = screen.getByRole("tab", { name: /Files/ });
    expect(files).toHaveFocus();
    // Base UI keeps disabled tabs focusable (APG-permitted) but never activates them.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Archived" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Overview panel");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("settings", expect.anything());
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Settings panel");
  });

  it("activates on focus when activateOnFocus is set", async () => {
    const user = userEvent.setup();
    render(<Basic activateOnFocus />);
    await user.tab();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: /Files/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Files panel");
  });

  it("activates on click and ignores disabled tabs", async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole("tab", { name: /Files/ }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Files panel");
    const archived = screen.getByRole("tab", { name: "Archived" });
    expect(archived).toHaveAttribute("aria-disabled", "true");
    await user.click(archived);
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Files panel");
  });

  it("supports a controlled value", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState("a");
      return (
        <>
          <Tabs value={value} onValueChange={(v) => setValue(v as string)}>
            <TabsList aria-label="Letters" variant="pills">
              <Tab value="a">A</Tab>
              <Tab value="b">B</Tab>
            </TabsList>
            <TabsPanel value="a">Panel A</TabsPanel>
            <TabsPanel value="b">Panel B</TabsPanel>
          </Tabs>
          <button type="button" onClick={() => setValue("b")}>
            Jump to B
          </button>
        </>
      );
    }
    render(<Harness />);
    expect(screen.getByRole("tablist")).toHaveAttribute("data-variant", "pills");
    await user.click(screen.getByRole("button", { name: "Jump to B" }));
    expect(screen.getByRole("tab", { name: "B" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel B");
    await user.click(screen.getByRole("tab", { name: "A" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Panel A");
  });

  it("stays on the controlled value when the parent ignores changes", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Tabs value="a" onValueChange={onValueChange}>
        <TabsList aria-label="Letters">
          <Tab value="a">A</Tab>
          <Tab value="b">B</Tab>
        </TabsList>
        <TabsPanel value="a">Panel A</TabsPanel>
        <TabsPanel value="b">Panel B</TabsPanel>
      </Tabs>,
    );
    await user.click(screen.getByRole("tab", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
    expect(screen.getByRole("tab", { name: "A" })).toHaveAttribute("aria-selected", "true");
  });
});

describe("NavTabs", () => {
  it("is a named nav of links with aria-current on the current one", async () => {
    const { container } = render(
      <NavTabs aria-label="Team" className="scoped">
        <NavTab href="/members" current count={4}>
          Members
        </NavTab>
        <NavTab href="/sources">Sources</NavTab>
      </NavTabs>,
    );
    const nav = screen.getByRole("navigation", { name: "Team" });
    expect(nav).toHaveClass("scoped");
    expect(within(nav).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Members/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Members/ })).toHaveTextContent("4");
    expect(screen.getByRole("link", { name: "Sources" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("tab")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders through a router link and forwards ref", () => {
    const ref = { current: null as HTMLAnchorElement | null };
    function RouterLink(props: React.ComponentProps<"a">) {
      return <a data-router="" {...props} />;
    }
    render(
      <NavTabs aria-label="Team">
        <NavTab ref={ref} render={<RouterLink href="/x" />}>
          Router
        </NavTab>
      </NavTabs>,
    );
    const link = screen.getByRole("link", { name: "Router" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("href", "/x");
    expect(ref.current).toBe(link);
  });
});

/* ------------------------------------------------------------------ */

describe("Popover", () => {
  it("opens as a dialog named by its title and closes on Escape, returning focus", async () => {
    const user = userEvent.setup();
    render(
      <Popover trigger={<Button>Details</Button>} title="Retention" description="How long files are kept." className="scoped">
        <p>Files are deleted after 30 days.</p>
      </Popover>,
    );
    const trigger = screen.getByRole("button", { name: "Details" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Retention" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(dialog).toHaveAccessibleDescription("How long files are kept.");
    expect(dialog).toHaveClass("scoped");
    expect(dialog).toHaveTextContent("Files are deleted after 30 days.");
    expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("opens from the keyboard and closes on an outside click", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <>
        <Popover trigger={<Button>Details</Button>} title="Retention" onOpenChange={onOpenChange}>
          <button type="button">Inside</button>
        </Popover>
        <p>Outside</p>
      </>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    await screen.findByRole("dialog", { name: "Retention" });
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await user.click(screen.getByText("Outside"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("is controllable", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(<Popover open={false} onOpenChange={onOpenChange} trigger={<Button>Details</Button>} title="Retention" />);
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<Popover open onOpenChange={onOpenChange} trigger={<Button>Details</Button>} title="Retention" />);
    expect(await screen.findByRole("dialog", { name: "Retention" })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */

describe("Tooltip", () => {
  it("shows on hover after the delay and hides on unhover", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Archive source" delay={0} shortcut="A" className="scoped">
        <Button aria-label="Archive">A</Button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Archive" });
    expect(screen.queryByText("Archive source")).toBeNull();
    await user.hover(trigger);
    const tip = await screen.findByText("Archive source");
    expect(tip).toHaveClass("scoped");
    expect(tip).toHaveTextContent("Archive sourceA");
    await user.unhover(trigger);
    await waitFor(() => expect(screen.queryByText("Archive source")).toBeNull());
  });

  it("shows on keyboard focus and closes on Escape without changing the accessible name", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip content="Archive source">
        <Button aria-label="Archive">A</Button>
      </Tooltip>,
    );
    await user.tab();
    const trigger = screen.getByRole("button", { name: "Archive" });
    expect(trigger).toHaveFocus();
    expect(await screen.findByText("Archive source")).toBeInTheDocument();
    // The tooltip supplements the label; it never replaces it.
    expect(trigger).toHaveAccessibleName("Archive");
    expect(await axe(document.body, noLandmarkRule)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Archive source")).toBeNull());
    expect(trigger).toHaveFocus();
  });
});

/* ------------------------------------------------------------------ */

describe("CopyButton", () => {
  it("copies, renames itself to “Copied …”, announces, and resets after the timeout", async () => {
    const user = userEvent.setup(); // installs a clipboard stub
    const onCopy = vi.fn();
    const { container } = render(<CopyButton value="npm test" label="command" timeout={100} onCopy={onCopy} />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    const button = screen.getByRole("button", { name: "Copy command" });
    expect(button).toHaveAttribute("data-state", "idle");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(button);
    expect(await navigator.clipboard.readText()).toBe("npm test");
    expect(onCopy).toHaveBeenCalledWith("npm test");
    await waitFor(() => expect(button).toHaveAccessibleName("Copied command"));
    expect(button).toHaveAttribute("data-state", "copied");
    expect(status).toHaveTextContent("Copied command to clipboard");

    await waitFor(() => expect(button).toHaveAccessibleName("Copy command"));
    expect(status).toBeEmptyDOMElement();
  });

  it("reads a function value at click time", async () => {
    const user = userEvent.setup();
    let current = "first";
    render(<CopyButton value={() => current} />);
    current = "second";
    await user.click(screen.getByRole("button", { name: "Copy text" }));
    expect(await navigator.clipboard.readText()).toBe("second");
  });

  it("announces a failure and calls onError", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
    render(<CopyButton value="secret" label="key" onError={onError} />);
    const button = screen.getByRole("button", { name: "Copy key" });
    await user.click(button);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Couldn't copy. Select the text and copy it manually."));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(button).toHaveAttribute("data-state", "failed");
    expect(button).toHaveAccessibleName("Copy key");
  });

  it("shows visible text with showText and keeps the name in sync", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="x" label="link" showText className="scoped" />);
    const button = screen.getByRole("button", { name: "Copy link" });
    expect(button).toHaveClass("scoped");
    expect(button).toHaveTextContent("Copy");
    await user.click(button);
    await waitFor(() => expect(button).toHaveAccessibleName("Copied link"));
    expect(button).toHaveTextContent("Copied");
  });

  it("shows a tooltip on an icon-only button", async () => {
    const user = userEvent.setup();
    render(<CopyButton value="x" />);
    await user.tab();
    expect(await screen.findByText("Copy")).toBeInTheDocument();
  });

  describe("writeClipboard fallback", () => {
    const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
    const originalExec = document.execCommand;
    beforeEach(() => {
      Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    });
    afterEach(() => {
      if (original) Object.defineProperty(navigator, "clipboard", original);
      else delete (navigator as { clipboard?: unknown }).clipboard;
      document.execCommand = originalExec;
    });

    it("uses execCommand('copy') with a temporary textarea", async () => {
      let copied = "";
      document.execCommand = vi.fn(() => {
        copied = document.querySelector("textarea")?.value ?? "";
        return true;
      });
      await writeClipboard("fallback text");
      expect(document.execCommand).toHaveBeenCalledWith("copy");
      expect(copied).toBe("fallback text");
      expect(document.querySelector("textarea")).toBeNull();
    });

    it("rejects when execCommand fails", async () => {
      document.execCommand = vi.fn(() => false);
      await expect(writeClipboard("x")).rejects.toThrow();
      expect(document.querySelector("textarea")).toBeNull();
    });
  });
});

/* ------------------------------------------------------------------ */

describe("AppShell", () => {
  function Shell(props: { collapsed?: boolean; defaultCollapsed?: boolean; onCollapsedChange?: (c: boolean) => void; skipTo?: string | null }) {
    return (
      <AppShell
        {...props}
        className="scoped-shell"
        sidebar={
          <Sidebar>
            <SidebarHeader>
              <Brand name="Bitop" />
              <WorkspaceSwitcher name="Acme" description="Owner">
                <MenuItem>Globex</MenuItem>
              </WorkspaceSwitcher>
            </SidebarHeader>
            <SidebarContent>
              <SidebarModeSwitch
                label="Mode"
                items={[
                  { label: "Workspace", icon: <span />, href: "/", current: true },
                  { label: "Admin", icon: <span />, href: "/admin", current: false },
                ]}
              />
              <SidebarNav aria-label="Main">
                <SidebarSection label="Knowledge">
                  <SidebarItem label="Sources" href="/sources" current trailing="12" />
                  <SidebarItem label="Agents" href="/agents" dot />
                </SidebarSection>
              </SidebarNav>
            </SidebarContent>
            <SidebarFooter>
              <SidebarUser name="Ada Lovelace" email="ada@example.com">
                <MenuItem>Sign out</MenuItem>
              </SidebarUser>
            </SidebarFooter>
          </Sidebar>
        }
        topbar={<TopBar start={<span>Crumbs</span>} end={<Button>New</Button>} />}
      >
        <Main>
          <h1>Sources</h1>
        </Main>
      </AppShell>
    );
  }

  it("renders landmarks, a skip link first in the tab order, and a focusable main target", async () => {
    const user = userEvent.setup();
    const { container } = render(<Shell />);
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
    await user.tab();
    expect(skip).toHaveFocus();

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Mode" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Knowledge" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Sources/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Agents" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Workspace" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Bitop" })).toHaveAttribute("href", "/");
    expect(container.querySelector(".scoped-shell")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("omits the skip link when skipTo is null and targets a custom id", () => {
    const { unmount } = render(<Shell skipTo={null} />);
    expect(screen.queryByRole("link", { name: "Skip to content" })).toBeNull();
    unmount();
    render(<Shell skipTo="content" />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#content");
  });

  it("collapses and expands the sidebar; collapsed labels stay accessible", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { container } = render(<Shell onCollapsedChange={onCollapsedChange} />);
    const toggle = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const sidebar = document.getElementById(toggle.getAttribute("aria-controls")!);
    expect(sidebar).toContainElement(screen.getByRole("navigation", { name: "Main" }));
    expect(screen.getByText("Knowledge")).not.toHaveClass("sr-only");

    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    expect(toggle).toHaveAccessibleName("Expand sidebar");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(sidebar).toHaveAttribute("data-collapsed");
    expect(container.querySelector(".scoped-shell")).toHaveAttribute("data-collapsed");
    // Labels become visually hidden but keep naming the links and list.
    expect(screen.getByText("Knowledge")).toHaveClass("sr-only");
    expect(screen.getByRole("list", { name: "Knowledge" })).toBeInTheDocument();
    expect(screen.getByText("Agents")).toHaveClass("sr-only");
    expect(screen.getByRole("link", { name: "Agents" })).toBeInTheDocument();
    // Trailing counts are dropped when collapsed.
    expect(screen.getByRole("link", { name: "Sources" })).not.toHaveTextContent("12");

    // Collapsed labels show as tooltips on focus.
    screen.getByRole("link", { name: "Agents" }).focus();
    await waitFor(() => expect(screen.getAllByText("Agents").length).toBeGreaterThan(1));

    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(sidebar).not.toHaveAttribute("data-collapsed");
  });

  it("respects a controlled collapsed state", async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<Shell collapsed onCollapsedChange={onCollapsedChange} />);
    const toggle = screen.getByRole("button", { name: "Expand sidebar" });
    await user.click(toggle);
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(toggle).toHaveAccessibleName("Expand sidebar");
  });

  it("starts collapsed with defaultCollapsed", () => {
    render(<Shell defaultCollapsed />);
    expect(screen.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-expanded", "false");
  });

  it("announces the workspace switcher and account menus", async () => {
    const user = userEvent.setup();
    render(<Shell />);
    // jsdom drops the space browsers keep after the sr-only prefix, so match loosely.
    const switcher = screen.getByRole("button", { name: /^Current workspace:\s*Acme/ });
    expect(screen.getByRole("button", { name: /^Account:\s*Ada Lovelace/ })).toHaveAttribute("aria-haspopup", "menu");
    await user.click(switcher);
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Globex" })).toBeInTheDocument();
  });

  it("exposes state through useAppShell and hides the toggle outside a shell", async () => {
    const user = userEvent.setup();
    function Probe() {
      const shell = useAppShell();
      return <span data-testid="probe">{shell ? String(shell.collapsed) : "none"}</span>;
    }
    const { unmount } = render(
      <>
        <SidebarToggle />
        <Probe />
      </>,
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("probe")).toHaveTextContent("none");
    unmount();

    render(
      <AppShell topbar={<TopBar />}>
        <Probe />
      </AppShell>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });

  it("lets Main render another element and skip the container", () => {
    render(
      <Main render={<div />} contained={false} id="demo" className="scoped-main">
        Body
      </Main>,
    );
    expect(screen.queryByRole("main")).toBeNull();
    const el = document.getElementById("demo")!;
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("scoped-main");
    expect(el).toHaveTextContent("Body");
  });

  it("hides the TopBar sidebar toggle when sidebarToggle is false", () => {
    render(
      <AppShell topbar={<TopBar sidebarToggle={false} />}>
        <Main>Body</Main>
      </AppShell>,
    );
    expect(screen.queryByRole("button", { name: /sidebar/ })).toBeNull();
  });
});

/* ------------------------------------------------------------------ */

describe("ColorMode", () => {
  const html = document.documentElement;
  beforeEach(() => {
    window.localStorage.clear();
    delete html.dataset.theme;
  });
  afterEach(() => {
    window.localStorage.clear();
    delete html.dataset.theme;
    vi.restoreAllMocks();
  });

  function mockPrefersDark(dark: boolean) {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: dark && query.includes("dark"),
          media: query,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  }

  it("setColorMode updates data-theme and persists the choice", () => {
    setColorMode("dark");
    expect(html.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
    setColorMode("light");
    expect(html.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
  });

  it("system mode clears the stored preference and follows prefers-color-scheme", () => {
    setColorMode("light");
    mockPrefersDark(true);
    setColorMode("system");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBeNull();
    expect(html.dataset.theme).toBe("dark");
  });

  it("the toggle keeps a constant name and reports dark mode with aria-pressed", async () => {
    const user = userEvent.setup();
    const { container } = render(<ColorModeToggle />);
    const toggle = screen.getByRole("button", { name: "Dark mode" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(html.dataset.theme).toBe("light");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(toggle);
    expect(toggle).toHaveAccessibleName("Dark mode");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(html.dataset.theme).toBe("dark");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(html.dataset.theme).toBe("light");
    expect(window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
  });

  it("reads the stored preference on mount", () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    render(<ColorModeToggle label="Theme" />);
    expect(screen.getByRole("button", { name: "Theme" })).toHaveAttribute("aria-pressed", "true");
    expect(html.dataset.theme).toBe("dark");
  });

  it("keeps every consumer on the page in sync", async () => {
    const user = userEvent.setup();
    function Readout() {
      const { mode, resolved, setMode } = useColorMode();
      return (
        <>
          <span data-testid="readout">
            {mode}/{resolved}
          </span>
          <button type="button" onClick={() => setMode("system")}>
            Use system
          </button>
        </>
      );
    }
    render(
      <>
        <ColorModeToggle />
        <Readout />
      </>,
    );
    expect(screen.getByTestId("readout")).toHaveTextContent("system/light");
    await user.click(screen.getByRole("button", { name: "Dark mode" }));
    expect(screen.getByTestId("readout")).toHaveTextContent("dark/dark");
    await user.click(screen.getByRole("button", { name: "Use system" }));
    expect(screen.getByTestId("readout")).toHaveTextContent("system/light");
    expect(screen.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "false");
  });

  it("colorModeScript applies the stored theme before React runs", () => {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    new Function(colorModeScript)();
    expect(html.dataset.theme).toBe("dark");
    window.localStorage.removeItem(COLOR_MODE_STORAGE_KEY);
    new Function(colorModeScript)();
    expect(html.dataset.theme).toBe("light");
  });
});

/* ------------------------------------------------------------------ */

describe("Task", () => {
  it("is a disclosure: the trigger toggles aria-expanded and the item list", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Task onOpenChange={onOpenChange} className="scoped">
        <TaskTrigger title="Searched 3 folders" />
        <TaskContent>
          <TaskItem>
            Read <TaskItemFile>refunds.md</TaskItemFile>
          </TaskItem>
        </TaskContent>
      </Task>,
    );
    expect(container.firstElementChild).toHaveClass("scoped");
    const trigger = screen.getByRole("button", { name: "Searched 3 folders" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("refunds.md")).toBeNull();

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listitem")).toHaveTextContent("Read refunds.md");
    expect(await axe(container)).toHaveNoViolations();

    await user.keyboard("{Enter}");
    await waitFor(() => expect(trigger).toHaveAttribute("aria-expanded", "false"));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("says “(in progress)” while running instead of relying on the animation", () => {
    render(
      <Task defaultOpen>
        <TaskTrigger title="Searching" running />
        <TaskContent>
          <TaskItem>One</TaskItem>
        </TaskContent>
      </Task>,
    );
    expect(screen.getByRole("button", { name: "Searching (in progress)" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("One")).toBeVisible();
  });
});

/* ------------------------------------------------------------------ */

describe("Artifact", () => {
  it("is a region named by its title with a keyboard-scrollable body", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Artifact className="scoped">
        <ArtifactHeader>
          <ArtifactTitle as="h2">Q3 summary</ArtifactTitle>
          <ArtifactActions>
            <ArtifactClose onClick={onClose} />
          </ArtifactActions>
        </ArtifactHeader>
        <ArtifactContent flush>Body</ArtifactContent>
      </Artifact>,
    );
    const region = screen.getByRole("region", { name: "Q3 summary" });
    expect(region).toHaveClass("scoped");
    expect(screen.getByRole("heading", { level: 2, name: "Q3 summary" })).toBeInTheDocument();
    const body = screen.getByText("Body");
    expect(body).toHaveAttribute("tabindex", "0");
    expect(body).toHaveAttribute("data-flush");
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(region).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lets an explicit aria-label override the title", () => {
    render(
      <Artifact aria-label="Preview" aria-labelledby={undefined}>
        <ArtifactTitle>Q3</ArtifactTitle>
      </Artifact>,
    );
    expect(screen.getByRole("region", { name: "Preview" })).toBeInTheDocument();
  });
});
