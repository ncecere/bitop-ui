import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Button } from "@/registry/bitop/ui/button/button";
import { Field } from "@/registry/bitop/ui/field/field";
import { NumberInput, formatNumberText, parseNumberText } from "@/registry/bitop/ui/number-input/number-input";
import { SaveBar } from "@/registry/bitop/ui/save-bar/save-bar";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";

describe("NumberInput", () => {
  it("formats and parses plain values", () => {
    expect(formatNumberText("2000000", "en-US")).toBe("2,000,000");
    expect(formatNumberText("1.5", "en-US")).toBe("1.5");
    expect(formatNumberText("", "en-US")).toBe("");
    expect(formatNumberText("12abc", "en-US")).toBe("12abc");
    expect(formatNumberText("1.5", "en-US", 0)).toBe("1.5");
    expect(formatNumberText("1.25", "en-US", 2)).toBe("1.25");
    expect(formatNumberText("1234567.5", "de-DE", 2)).toBe("1.234.567,5");
    // Past 2^53 the shown amount must still be the stored one.
    expect(formatNumberText("9007199254740993", "en-US")).toBe("9,007,199,254,740,993");
    expect(formatNumberText("12345678901234567890", "en-US")).toBe("12,345,678,901,234,567,890");
    expect(parseNumberText("2,000,000", "en-US")).toBe("2000000");
    expect(parseNumberText(" 1 234,5 ", "de-DE")).toBe("1234.5");
    expect(parseNumberText("1.234,5", "de-DE")).toBe("1234.5");
  });

  function Harness({ initial = "50000", onChange }: { initial?: string; onChange?: (v: string) => void }) {
    const [value, setValue] = useState(initial);
    return (
      <Field label="Pages per day">
        <NumberInput
          locale="en-US"
          maximumFractionDigits={0}
          unit="per day"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onChange?.(v);
          }}
        />
      </Field>
    );
  }

  it("shows separators except while editing, and reports the plain value", async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    const { container } = render(<Harness onChange={(v) => seen.push(v)} />);
    const input = screen.getByLabelText("Pages per day");
    expect(input).toHaveValue("50,000");
    expect(input).toHaveAttribute("inputmode", "numeric");
    expect(input).toHaveAttribute("type", "text");
    await user.click(input);
    expect(input).toHaveValue("50000");
    await user.clear(input);
    await user.type(input, "1,250,000");
    expect(seen.at(-1)).toBe("1250000");
    await user.tab();
    expect(input).toHaveValue("1,250,000");
    expect(screen.getByText("per day")).toHaveAttribute("aria-hidden");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps blank and invalid text for the form to validate", async () => {
    const user = userEvent.setup();
    render(<Harness initial="" />);
    const input = screen.getByLabelText("Pages per day");
    expect(input).toHaveValue("");
    await user.type(input, "12x");
    await user.tab();
    expect(input).toHaveValue("12x");
  });
});

describe("SaveBar", () => {
  function Form() {
    const [name, setName] = useState("Registrar");
    const dirty = name !== "Registrar";
    return (
      <form>
        <label>
          Name <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <SaveBar open={dirty}>
          <Button variant="ghost" onClick={() => setName("Registrar")}>
            Discard
          </Button>
          <Button type="submit">Save</Button>
        </SaveBar>
      </form>
    );
  }

  it("shows its actions and announces unsaved changes only while open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Form />);
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Name"), "!");
    expect(status).toHaveTextContent("Unsaved changes");
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(status).toBeEmptyDOMElement();
    expect(screen.queryByRole("button", { name: "Discard" })).not.toBeInTheDocument();
  });
});

describe("StatCard links", () => {
  it("makes the label a single link and keeps <dl> semantics", async () => {
    const { container } = render(
      <StatCard label="Data sources" value="3" href="/sources" details={<ul><li>2 ready</li></ul>} />,
    );
    const link = screen.getByRole("link", { name: "Data sources" });
    expect(link).toHaveAttribute("href", "/sources");
    expect(link.closest("dt")).not.toBeNull();
    expect(container.querySelector("dl a dl")).toBeNull();
    expect(screen.getByText("2 ready").closest("dd")).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders a custom link element and no link without href or render", () => {
    render(
      <>
        <StatCard label="Linked" value="1" render={<a href="/custom" data-router="yes" />} />
        <StatCard label="Plain" value="2" />
      </>,
    );
    expect(screen.getByRole("link", { name: "Linked" })).toHaveAttribute("data-router", "yes");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
