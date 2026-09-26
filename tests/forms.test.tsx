import { act, render, screen } from "@testing-library/react";
import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { Checkbox, CheckboxGroup } from "@/registry/bitop/ui/checkbox/checkbox";
import { ColorField, contrastRatio, formatRatio, normalizeHex } from "@/registry/bitop/ui/color-field/color-field";
import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input, NativeSelect, Textarea } from "@/registry/bitop/ui/input/input";
import { RadioGroup } from "@/registry/bitop/ui/radio-group/radio-group";
import { Switch } from "@/registry/bitop/ui/switch/switch";
import { TagInput } from "@/registry/bitop/ui/tag-input/tag-input";

describe("Field", () => {
  it("labels the control and wires description and error", async () => {
    const { container } = render(
      <Field label="Base URL" description="Include /v1" error="Invalid URL">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Base URL");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Include /v1 Invalid URL");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("is not invalid without an error, and works for textarea and native select", async () => {
    const { container } = render(
      <>
        <Field label="Notes" description="Optional context">
          <Textarea />
        </Field>
        <Field label="Classification" error="Pick a level">
          <NativeSelect defaultValue="open">
            <option value="open">Open</option>
            <option value="restricted">Restricted</option>
          </NativeSelect>
        </Field>
      </>,
    );
    const notes = screen.getByRole("textbox", { name: "Notes" });
    expect(notes.tagName).toBe("TEXTAREA");
    expect(notes).not.toHaveAttribute("aria-invalid");
    expect(notes).toHaveAccessibleDescription("Optional context");

    const select = screen.getByRole("combobox", { name: "Classification" });
    expect(select.tagName).toBe("SELECT");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Pick a level");
    await userEvent.selectOptions(select, "restricted");
    expect(select).toHaveValue("restricted");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps working for controlled inputs", async () => {
    function Controlled() {
      return (
        <Field label="Name">
          <Input defaultValue="" onChange={() => {}} />
        </Field>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Policies");
    expect(input).toHaveValue("Policies");
  });
});

describe("Button", () => {
  it("defaults to type=button", () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute("type", "button");
  });

  it("keeps an explicit submit type", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  it("loading sets aria-busy and disables the button", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("names icon-only buttons with their label", () => {
    render(<IconButton icon={<svg aria-hidden />} label="Delete source" />);
    expect(screen.getByRole("button", { name: "Delete source" })).toBeInTheDocument();
  });

  it("renders as a link through the render prop without a button type", () => {
    render(
      <Button render={<a href="/docs" />} variant="secondary">
        Docs
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "/docs");
    expect(link).not.toHaveAttribute("type");
  });

  it.each([
    ["disabled", { disabled: true }],
    ["loading", { loading: true }],
  ])("a %s rendered link stays focusable but cannot be activated", async (_, state) => {
    const onButtonClick = vi.fn();
    const onLinkClick = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <Button {...state} onClick={onButtonClick} render={<a href="/danger" onClick={onLinkClick} />}>
          Delete
        </Button>
      </div>,
    );
    const link = screen.getByRole("link", { name: "Delete" });
    expect(link).toHaveAttribute("aria-disabled", "true");

    // A click whose default was prevented returns false from dispatchEvent.
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    expect(link.dispatchEvent(click)).toBe(false);

    link.focus();
    expect(link).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(link);
    expect(onButtonClick).not.toHaveBeenCalled();
    expect(onLinkClick).not.toHaveBeenCalled();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it("an enabled rendered link still runs its handlers", async () => {
    const onClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <Button onClick={onClick} render={<a href="/docs" />}>
        Docs
      </Button>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Docs" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("choices", () => {
  it("checkboxes, switches and radios are labelled and operable", async () => {
    const onScopes = vi.fn();
    const { container } = render(
      <>
        <CheckboxGroup legend="Scopes" defaultValue={["query"]} onValueChange={onScopes}>
          <Checkbox value="query" label="Query" description="Search knowledge bases" />
          <Checkbox value="ingest" label="Ingest" />
        </CheckboxGroup>
        <Switch label="Hybrid search" />
        <RadioGroup
          legend="Key type"
          defaultValue="personal"
          options={[
            { value: "personal", label: "Personal" },
            { value: "service", label: "Service" },
          ]}
        />
      </>,
    );
    expect(screen.getByRole("group", { name: "Scopes" })).toBeInTheDocument();
    const query = screen.getByRole("checkbox", { name: "Query" });
    expect(query).toBeChecked();
    expect(query).toHaveAccessibleDescription("Search knowledge bases");
    await userEvent.click(screen.getByRole("checkbox", { name: "Ingest" }));
    expect(onScopes).toHaveBeenLastCalledWith(["query", "ingest"], expect.anything());

    const toggle = screen.getByRole("switch", { name: "Hybrid search" });
    await userEvent.click(toggle);
    expect(toggle).toBeChecked();

    expect(screen.getByRole("radiogroup", { name: "Key type" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Service" }));
    expect(screen.getByRole("radio", { name: "Service" })).toBeChecked();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Disclosure", () => {
  it("is a button that expands and collapses its panel", async () => {
    const { container } = render(
      <Disclosure title="Advanced options" summary="Depth 2">
        <Field label="Maximum depth">
          <Input defaultValue="2" />
        </Field>
      </Disclosure>,
    );
    const trigger = screen.getByRole("button", { name: /Advanced options/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("Maximum depth")).toBeNull();
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Maximum depth")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TagInput", () => {
  function Demo({ initial = ["policy"], maxTags = 4 }: { initial?: string[]; maxTags?: number }) {
    const [tags, setTags] = useState<string[]>(initial);
    return (
      <>
        <Field label="Tags">
          <TagInput value={tags} onValueChange={setTags} maxTags={maxTags} />
        </Field>
        <output>{tags.join("|")}</output>
      </>
    );
  }

  it("adds on Enter and comma, lower-cases, dedupes, removes with Backspace and the remove button", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo />);
    const input = screen.getByRole("textbox", { name: "Tags" });
    await user.type(input, "Fees{Enter}refunds,POLICY,");
    expect(screen.getByText("Added tag refunds")).toHaveAttribute("role", "status");
    expect(container.querySelector("output")).toHaveTextContent("policy|fees|refunds");
    await user.type(input, "{Backspace}");
    expect(container.querySelector("output")).toHaveTextContent("policy|fees");
    await user.click(screen.getByRole("button", { name: "Remove tag policy" }));
    expect(container.querySelector("output")).toHaveTextContent(/^fees$/);
    expect(input).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps pending text on blur, splits pasted lists and stops at maxTags", async () => {
    const user = userEvent.setup();
    const { container } = render(<Demo initial={[]} maxTags={3} />);
    const input = screen.getByRole("textbox", { name: "Tags" });
    await user.type(input, "summer");
    act(() => input.blur());
    expect(container.querySelector("output")).toHaveTextContent("summer");
    await user.click(input);
    await user.paste("a, b, c, d");
    expect(container.querySelector("output")).toHaveTextContent("summer|a|b");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Limit of 3 tags reached");
  });

  it("doesn't submit the form on an empty Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Demo initial={[]} />
      </form>,
    );
    await user.type(screen.getByRole("textbox", { name: "Tags" }), "{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("ColorField", () => {
  it("computes WCAG ratios and normalises hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("1d4ed8")).toBe("#1d4ed8");
    expect(normalizeHex("blue")).toBeUndefined();
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(formatRatio(4.46)).toBe("4.4:1");
  });

  it("reports contrast in words, applies presets and flags invalid hex", async () => {
    const user = userEvent.setup();
    function Demo() {
      const [v, setV] = useState("#f97316");
      return (
        <Field label="Accent colour">
          <ColorField
            value={v}
            onValueChange={setV}
            defaultColor="#1d4ed8"
            contrastWith="#ffffff"
            contrastLabel="white text"
            presets={[{ value: "#1d4ed8", label: "Blue" }]}
          />
        </Field>
      );
    }
    const { container } = render(<Demo />);
    const hex = screen.getByRole("textbox", { name: "Accent colour" });
    expect(hex).toHaveAccessibleDescription(/below 4.5:1\. Choose a darker colour/);
    await user.click(screen.getByRole("button", { name: "Blue" }));
    expect(hex).toHaveValue("#1d4ed8");
    expect(hex).toHaveAccessibleDescription(/meets WCAG AA/);
    expect(screen.getByRole("button", { name: "Blue" })).toHaveAttribute("aria-pressed", "true");
    await user.clear(hex);
    await user.type(hex, "#12");
    expect(hex).toHaveAccessibleDescription("Enter a hex colour such as #1d4ed8.");
    await user.clear(hex);
    // Empty: the default colour is used and checked.
    expect(hex).toHaveAttribute("placeholder", "#1d4ed8 (default)");
    expect(hex).toHaveAccessibleDescription(/meets WCAG AA/);
    expect(screen.getByRole("button", { name: "Blue" })).toHaveAttribute("aria-pressed", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("suggests a lighter colour when the text is dark", () => {
    render(<ColorField value="#1f2937" onValueChange={() => {}} defaultColor="#fef3c7" contrastWith="#111827" contrastLabel="dark text" />);
    expect(screen.getByText(/Choose a lighter colour/)).toBeInTheDocument();
  });
});
