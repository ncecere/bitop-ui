import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Bold, Italic, Search } from "lucide-react";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Button } from "@/registry/bitop/ui/button/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@/registry/bitop/ui/button-group/button-group";
import { Combobox, type ComboboxOption } from "@/registry/bitop/ui/combobox/combobox";
import { Field } from "@/registry/bitop/ui/field/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/registry/bitop/ui/input-group/input-group";
import { InputOTP } from "@/registry/bitop/ui/input-otp/input-otp";
import { Slider } from "@/registry/bitop/ui/slider/slider";
import { Toggle } from "@/registry/bitop/ui/toggle/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/registry/bitop/ui/toggle-group/toggle-group";

const regions: ComboboxOption[] = [
  { value: "iad", label: "Washington, D.C.", group: "Americas" },
  { value: "sfo", label: "San Francisco", group: "Americas" },
  { value: "fra", label: "Frankfurt", group: "Europe" },
  { value: "lhr", label: "London", group: "Europe" },
  { value: "hnd", label: "Tokyo", group: "Asia Pacific", disabled: true },
];

const people: ComboboxOption[] = [
  { value: "ana", label: "Ana Silva" },
  { value: "ben", label: "Ben Okafor" },
  { value: "chen", label: "Chen Wei" },
];

describe("Combobox", () => {
  it("is labelled, described and marked invalid by Field", async () => {
    const { container } = render(
      <Field label="Region" description="Where data is stored." error="Pick a region">
        <Combobox items={regions} placeholder="Search regions…" />
      </Field>,
    );
    const input = screen.getByRole("combobox", { name: "Region" });
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAccessibleDescription("Where data is stored. Pick a region");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("selects the chosen label when focused, so typing searches afresh instead of appending", async () => {
    const user = userEvent.setup();
    render(
      <Field label="Region">
        <Combobox items={regions} defaultValue="fra" />
      </Field>,
    );
    const input = screen.getByRole("combobox", { name: "Region" }) as HTMLInputElement;
    await waitFor(() => expect(input.value).not.toBe(""));
    await user.click(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
    await user.keyboard("dub");
    expect(input.value).toBe("dub");
  });

  it("filters, groups, shows an empty state and selects with the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Field label="Region">
        <Combobox items={regions} onValueChange={onValueChange} emptyText="No regions match." />
      </Field>,
    );
    const input = screen.getByRole("combobox", { name: "Region" });
    await user.click(input);
    const listbox = await screen.findByRole("listbox");
    expect(within(listbox).getByRole("group", { name: "Europe" })).toBeInTheDocument();
    expect(within(listbox).getByRole("option", { name: "Tokyo" })).toHaveAttribute("aria-disabled", "true");
    expect(await axe(listbox.closest("[role='presentation'], body") as HTMLElement)).toHaveNoViolations();

    await user.type(input, "zzz");
    expect(await screen.findByText("No regions match.")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "frank");
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("fra", regions[2]);
    await waitFor(() => expect(input).toHaveValue("Frankfurt"));
  });

  it("works controlled and clears with the clear button", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("lhr");
      return (
        <>
          <Combobox aria-label="Region" items={regions} value={value} onValueChange={setValue} clearable />
          <output>{value ?? "none"}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    const input = screen.getByRole("combobox", { name: "Region" });
    expect(input).toHaveValue("London");
    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(container.querySelector("output")).toHaveTextContent("none");
    expect(input).toHaveValue("");
  });

  it("selects several values as removable chips in multiple mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <Field label="Reviewers">
        <Combobox multiple items={people} defaultValue={["ana"]} onValueChange={onValueChange} chipsLabel="Selected reviewers" />
      </Field>,
    );
    expect(screen.getByRole("toolbar", { name: "Selected reviewers" })).toBeInTheDocument();
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    const input = screen.getByRole("combobox", { name: "Reviewers" });
    await user.click(input);
    await user.click(await screen.findByRole("option", { name: "Chen Wei" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["ana", "chen"], [people[0], people[2]]);

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await user.click(screen.getByRole("button", { name: "Remove Ana Silva" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["chen"], [people[2]]);
    expect(screen.queryByText("Ana Silva")).toBeNull();
  });

  it("Enter picks the highlighted option and never submits the surrounding form, open list or closed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const onValueChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Field label="Reviewers">
          <Combobox multiple items={people} onValueChange={onValueChange} />
        </Field>
        <button type="submit">Save</button>
      </form>,
    );
    const input = screen.getByRole("combobox", { name: "Reviewers" });
    await user.type(input, "chen");
    await screen.findByRole("option", { name: "Chen Wei" });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["chen"], [people[2]]);
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    // The form's own submit button still submits.
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("a single combobox keeps Enter too, unless submitOnEnter; freeText submits by default", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Combobox aria-label="Region" items={regions} defaultValue="lhr" />
        <button type="submit">Save</button>
      </form>,
    );
    act(() => screen.getByRole("combobox", { name: "Region" }).focus());
    await user.keyboard("{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();

    rerender(
      <form onSubmit={onSubmit}>
        <Combobox aria-label="Region" items={regions} defaultValue="lhr" submitOnEnter />
        <button type="submit">Save</button>
      </form>,
    );
    act(() => screen.getByRole("combobox", { name: "Region" }).focus());
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <form onSubmit={onSubmit}>
        <Combobox aria-label="Group" freeText items={[]} defaultValue="staff" />
        <button type="submit">Save</button>
      </form>,
    );
    act(() => screen.getByRole("combobox", { name: "Group" }).focus());
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});

describe("InputOTP", () => {
  it("is labelled by Field, names every slot, and advances as you type", async () => {
    const user = userEvent.setup();
    const onValueComplete = vi.fn();
    const { container } = render(
      <Field label="Verification code" description="Sent to •••• 4821.">
        <InputOTP length={6} groups={[3, 3]} onValueComplete={onValueComplete} />
      </Field>,
    );
    const group = screen.getByRole("group", { name: "Verification code" });
    expect(group).toHaveAccessibleDescription("Sent to •••• 4821.");
    const slots = within(group).getAllByRole("textbox");
    expect(slots).toHaveLength(6);
    expect(slots[0]).toHaveAccessibleName("Verification code");
    expect(slots[1]).toHaveAccessibleName("Character 2 of 6");
    expect(slots[0]).toHaveAttribute("autocomplete", "one-time-code");
    expect(within(group).getByRole("separator")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(slots[0]!);
    await user.keyboard("12a3");
    expect(slots[2]).toHaveValue("3");
    expect(slots[3]).toHaveFocus();
    await user.keyboard("456");
    expect(onValueComplete).toHaveBeenCalledWith("123456", expect.anything());
  });

  it("fills every slot from a paste and supports alphanumeric codes", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [code, setCode] = useState("");
      return (
        <>
          <InputOTP aria-label="Recovery code" length={4} validationType="alphanumeric" value={code} onValueChange={setCode} />
          <output>{code}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    const slots = screen.getAllByRole("textbox");
    expect(slots[0]).toHaveAccessibleName("Recovery code");
    await user.click(slots[0]!);
    await user.paste("A7C9");
    expect(container.querySelector("output")).toHaveTextContent("A7C9");
    expect(slots.map((s) => (s as HTMLInputElement).value).join("")).toBe("A7C9");
    await user.keyboard("{Backspace}");
    expect(container.querySelector("output")).toHaveTextContent(/^A7C$/);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Slider", () => {
  it("is named by its label, moves with arrow keys and shows its value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(<Slider label="Volume" defaultValue={40} step={5} showValue onValueChange={onValueChange} />);
    const thumb = screen.getByRole("slider", { name: "Volume" });
    expect(thumb).toHaveAttribute("aria-valuenow", "40");
    expect(await axe(container)).toHaveNoViolations();
    await user.tab();
    expect(thumb).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(thumb).toHaveAttribute("aria-valuenow", "45");
    expect(onValueChange).toHaveBeenLastCalledWith(45, expect.anything());
    expect(container.querySelector("output")).toHaveTextContent("45");
    await user.keyboard("{End}");
    expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });

  it("names each range thumb and stays controlled", async () => {
    const user = userEvent.setup();
    function Range() {
      const [value, setValue] = useState<number[]>([20, 80]);
      return (
        <>
          <Slider
            label="Price"
            value={value}
            onValueChange={(v) => setValue(v as number[])}
            thumbLabels={["Minimum price", "Maximum price"]}
            showValue
            formatValue={(_, values) => `$${values[0]}–$${values[1]}`}
          />
          <p data-testid="value">{value.join(",")}</p>
        </>
      );
    }
    const { container } = render(<Range />);
    const min = screen.getByRole("slider", { name: "Minimum price" });
    const max = screen.getByRole("slider", { name: "Maximum price" });
    await user.tab();
    expect(min).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByTestId("value")).toHaveTextContent("22,80");
    await user.tab();
    expect(max).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("value")).toHaveTextContent("22,79");
    expect(container.querySelector("output")).toHaveTextContent("$22–$79");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("accepts aria-label without a visible label and supports vertical orientation", async () => {
    const { container } = render(<Slider aria-label="Zoom" defaultValue={[25, 75]} orientation="vertical" />);
    expect(screen.getByRole("slider", { name: "Zoom minimum" })).toHaveAttribute("aria-orientation", "vertical");
    expect(screen.getByRole("slider", { name: "Zoom maximum" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Toggle and ToggleGroup", () => {
  it("toggles aria-pressed, uncontrolled and controlled", async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    function Controlled() {
      const [pressed, setPressed] = useState(true);
      return (
        <Toggle variant="outline" pressed={pressed} onPressedChange={setPressed}>
          Preview
        </Toggle>
      );
    }
    const { container } = render(
      <>
        <Toggle iconOnly aria-label="Bold" onPressedChange={onPressedChange}>
          <Bold aria-hidden />
        </Toggle>
        <Controlled />
      </>,
    );
    const bold = screen.getByRole("button", { name: "Bold" });
    expect(bold).toHaveAttribute("aria-pressed", "false");
    await user.click(bold);
    expect(bold).toHaveAttribute("aria-pressed", "true");
    expect(onPressedChange).toHaveBeenLastCalledWith(true, expect.anything());
    await user.keyboard(" ");
    expect(bold).toHaveAttribute("aria-pressed", "false");

    const preview = screen.getByRole("button", { name: "Preview" });
    expect(preview).toHaveAttribute("aria-pressed", "true");
    await user.click(preview);
    expect(preview).toHaveAttribute("aria-pressed", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("allows one pressed item by default and moves focus with arrow keys", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = render(
      <ToggleGroup aria-label="View" defaultValue={["list"]} onValueChange={onValueChange} variant="outline" joined>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="board">Board</ToggleGroupItem>
        <ToggleGroupItem value="calendar">Calendar</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole("group", { name: "View" })).toBeInTheDocument();
    const list = screen.getByRole("button", { name: "List" });
    const board = screen.getByRole("button", { name: "Board" });
    expect(list).toHaveAttribute("aria-pressed", "true");
    await user.click(board);
    expect(board).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveAttribute("aria-pressed", "false");
    expect(onValueChange).toHaveBeenLastCalledWith(["board"], expect.anything());
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Calendar" })).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("allows several pressed items with multiple, vertically", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string[]>(["bold"]);
      return (
        <>
          <ToggleGroup aria-label="Formatting" multiple orientation="vertical" value={value} onValueChange={setValue}>
            <ToggleGroupItem value="bold" iconOnly aria-label="Bold">
              <Bold aria-hidden />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" iconOnly aria-label="Italic">
              <Italic aria-hidden />
            </ToggleGroupItem>
          </ToggleGroup>
          <output>{value.join(",")}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    await user.click(screen.getByRole("button", { name: "Italic" }));
    expect(container.querySelector("output")).toHaveTextContent("bold,italic");
    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("button", { name: "Bold" })).toHaveFocus();
    expect(screen.getByRole("group", { name: "Formatting" })).toHaveAttribute("data-orientation", "vertical");
  });
});

describe("InputGroup", () => {
  it("keeps Field wiring, focuses the input from an addon and runs addon buttons", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { container } = render(
      <Field label="Search docs" description="Searches titles and body text." error="Enter at least 2 characters">
        <InputGroup>
          <InputGroupAddon>
            <Search aria-hidden data-testid="icon" />
          </InputGroupAddon>
          <InputGroupInput placeholder="Search…" />
          <InputGroupAddon align="end">
            <InputGroupText>12 results</InputGroupText>
            <InputGroupButton onClick={onSearch}>Go</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: "Search docs" });
    expect(input).toHaveAccessibleDescription("Searches titles and body text. Enter at least 2 characters");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await user.click(screen.getByTestId("icon"));
    expect(input).toHaveFocus();
    await user.type(input, "tokens");
    expect(input).toHaveValue("tokens");
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("supports a textarea with a block addon toolbar", async () => {
    const { container } = render(
      <Field label="Message">
        <InputGroup>
          <InputGroupTextarea placeholder="Write a reply…" />
          <InputGroupAddon align="block-end">
            <InputGroupText>0 / 280</InputGroupText>
            <InputGroupButton variant="primary" type="submit">
              Send
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>,
    );
    const textarea = screen.getByRole("textbox", { name: "Message" });
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("type", "submit");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ButtonGroup", () => {
  it("is a named group of buttons with separators and text", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();
    const { container } = render(
      <ButtonGroup aria-label="Pagination">
        <Button variant="secondary">Previous</Button>
        <ButtonGroupText>Page 2 of 9</ButtonGroupText>
        <ButtonGroupSeparator />
        <Button variant="secondary" onClick={onNext}>
          Next
        </Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Pagination" });
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(within(group).getAllByRole("button")).toHaveLength(2);
    expect(within(group).getByRole("separator")).toHaveAttribute("aria-orientation", "vertical");
    await user.tab();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Next" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("stacks vertically and renders text segments as other elements", () => {
    render(
      <ButtonGroup aria-labelledby="zoom-label" orientation="vertical">
        <ButtonGroupText render={<span id="zoom-label" />}>Zoom</ButtonGroupText>
        <Button variant="secondary">In</Button>
        <Button variant="secondary">Out</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole("group", { name: "Zoom" });
    expect(group).toHaveAttribute("data-orientation", "vertical");
    expect(screen.getByText("Zoom").tagName).toBe("SPAN");
  });
});
