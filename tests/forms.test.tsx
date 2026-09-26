import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import { Checkbox, CheckboxGroup } from "@/registry/bitop/ui/checkbox/checkbox";
import { Disclosure } from "@/registry/bitop/ui/disclosure/disclosure";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input, NativeSelect, Textarea } from "@/registry/bitop/ui/input/input";
import { RadioGroup } from "@/registry/bitop/ui/radio-group/radio-group";
import { Switch } from "@/registry/bitop/ui/switch/switch";

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
