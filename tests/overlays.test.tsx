import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { axe } from "vitest-axe";
import { Button } from "@/registry/bitop/ui/button/button";
import { CommandPalette, useCommandPaletteShortcut } from "@/registry/bitop/ui/command-palette/command-palette";
import { AlertDialog, Dialog, DialogClose } from "@/registry/bitop/ui/dialog/dialog";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Menu, MenuItem, MenuSeparator } from "@/registry/bitop/ui/menu/menu";
import { Toaster, toast } from "@/registry/bitop/ui/toast/toast";

describe("Dialog", () => {
  it("opens from its trigger, moves focus inside, and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Dialog trigger={<Button>Open settings</Button>} title="Settings" description="Team preferences." footer={<DialogClose>Cancel</DialogClose>}>
        <Field label="Team name">
          <Input />
        </Field>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open settings" });
    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", { name: "Settings" });
    expect(dialog).toHaveAccessibleDescription("Team preferences.");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes from the footer close button", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Dialog open onOpenChange={onOpenChange} title="Rename" footer={<DialogClose>Cancel</DialogClose>} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("AlertDialog", () => {
  function Harness({ onConfirm, busy = false, error }: { onConfirm: () => void; busy?: boolean; error?: unknown }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Delete…
        </Button>
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Policies?"
          description="This cannot be undone."
          confirmLabel="Delete source"
          onConfirm={onConfirm}
          busy={busy}
          error={error}
        />
      </>
    );
  }

  it("is an alertdialog with focus inside; confirm calls the handler; Escape closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "Delete…" }));

    const dialog = await screen.findByRole("alertdialog", { name: "Delete Policies?" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    expect(await axe(dialog)).toHaveNoViolations();

    await user.click(within(dialog).getByRole("button", { name: "Delete source" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
  });

  it("returns focus to finalFocus on Cancel when opened by a control's change", async () => {
    const user = userEvent.setup();
    function SelectHarness() {
      const [pending, setPending] = useState(false);
      const ref = useRef<HTMLSelectElement>(null);
      return (
        <>
          <label>
            Role
            <select ref={ref} onChange={() => setPending(true)} defaultValue="none">
              <option value="none">None</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button type="button">Elsewhere</button>
          <AlertDialog open={pending} onOpenChange={setPending} title="Make admin?" description="Admins can change everything." confirmLabel="Make admin" onConfirm={() => {}} finalFocus={ref} />
        </>
      );
    }
    render(<SelectHarness />);
    // Focus is elsewhere when the change opens the dialog (e.g. a native picker that took focus).
    screen.getByRole("button", { name: "Elsewhere" }).focus();
    fireEvent.change(screen.getByRole("combobox", { name: "Role" }), { target: { value: "admin" } });
    const dialog = await screen.findByRole("alertdialog", { name: "Make admin?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull());
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Role" })).toHaveFocus());
  });

  it("shows busy and error states", async () => {
    const user = userEvent.setup();
    render(<Harness onConfirm={() => {}} busy error={new Error("Detach it from 2 knowledge bases first.")} />);
    await user.click(screen.getByRole("button", { name: "Delete…" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("button", { name: "Delete source" })).toHaveAttribute("aria-busy", "true");
    expect(within(dialog).getByRole("button", { name: "Delete source" })).toBeDisabled();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Detach it from 2 knowledge bases first.");
  });
});

describe("Menu", () => {
  it("opens from the keyboard and selects an item", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    render(
      <Menu trigger={<Button variant="secondary">Actions</Button>}>
        <MenuItem onClick={onRename}>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem tone="danger" onClick={onDelete}>
          Delete
        </MenuItem>
      </Menu>,
    );
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");

    const menu = await screen.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Rename" })).toHaveFocus());
    await user.keyboard("{ArrowDown}");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Delete" })).toHaveFocus());
    await user.keyboard("{Enter}");

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onRename).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
});

describe("Toast", () => {
  it("add() shows a message in the polite notifications region", async () => {
    render(<Toaster />);
    act(() => {
      toast.add({ title: "Source created", description: "Policies is ready.", tone: "success" });
    });
    const title = await screen.findByText("Source created");
    const region = screen.getByRole("region", { name: "Notifications" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toContainElement(title);
    expect(screen.getByText("Policies is ready.")).toBeInTheDocument();
    act(() => toast.close());
  });

  it("places the viewport with position (bottom-right by default)", async () => {
    const { unmount } = render(<Toaster />);
    act(() => {
      toast.add({ title: "Saved" });
    });
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("data-position", "bottom-right");
    act(() => toast.close());
    unmount();
    render(<Toaster position="bottom-center" />);
    act(() => {
      toast.add({ title: "Saved again" });
    });
    await screen.findByText("Saved again");
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("data-position", "bottom-center");
    act(() => toast.close());
  });

  it("can sit over the sidebar footer (bottom-left)", async () => {
    render(<Toaster position="bottom-left" />);
    act(() => {
      toast.add({ title: "Agent created" });
    });
    await screen.findByText("Agent created");
    expect(screen.getByRole("region", { name: "Notifications" })).toHaveAttribute("data-position", "bottom-left");
    act(() => toast.close());
  });
});

describe("CommandPalette", () => {
  function Harness({ onUsers }: { onUsers: () => void }) {
    const [open, setOpen] = useState(false);
    useCommandPaletteShortcut(() => setOpen((o) => !o));
    return (
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={[
          {
            label: "Admin",
            items: [
              { id: "users", label: "Users", keywords: ["people"], onSelect: onUsers },
              { id: "teams", label: "Teams", onSelect: () => {} },
            ],
          },
        ]}
      />
    );
  }

  it("opens with Ctrl+K, filters as you type and runs the highlighted command with Enter", async () => {
    const user = userEvent.setup();
    const onUsers = vi.fn();
    render(<Harness onUsers={onUsers} />);
    await user.keyboard("{Control>}k{/Control}");
    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    const input = within(dialog).getByRole("combobox", { name: "Command palette" });
    await waitFor(() => expect(input).toHaveFocus());
    await user.type(input, "people");
    expect(within(dialog).getByRole("option", { name: "Users" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("option", { name: "Teams" })).toBeNull();
    await user.keyboard("{Enter}");
    expect(onUsers).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("merges className onto the dialog popup without dropping its own styles", async () => {
    render(<CommandPalette open onOpenChange={() => {}} groups={[]} className="scoped-palette" />);
    const dialog = await screen.findByRole("dialog", { name: "Command palette" });
    expect(dialog).toHaveClass("scoped-palette");
    expect(dialog.classList.length).toBeGreaterThan(1);
  });
});
