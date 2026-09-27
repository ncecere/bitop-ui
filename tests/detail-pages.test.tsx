/*
 * Detail-page pieces: DescriptionList / FactsLine (and PageHeader's facts
 * slot), Meter and Checklist.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Checklist } from "@/registry/bitop/ui/checklist/checklist";
import { DescriptionItem, DescriptionList, FactsLine } from "@/registry/bitop/ui/description-list/description-list";
import { Meter, meterLevel } from "@/registry/bitop/ui/meter/meter";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";

describe("DescriptionList and FactsLine", () => {
  it("renders dt/dd pairs, marks empty values and has no axe violations", async () => {
    const { container } = render(
      <DescriptionList items={[{ label: "Start URL", value: <a href="https://example.com">example.com</a> }, { label: "Description", value: null }]}>
        <DescriptionItem label="Status">Ready</DescriptionItem>
      </DescriptionList>,
    );
    const terms = [...container.querySelectorAll("dt")].map((dt) => dt.textContent);
    expect(terms).toEqual(["Start URL", "Description", "Status"]);
    const empty = container.querySelectorAll("dd")[1]!;
    expect(empty).toHaveTextContent("Not set");
    expect(within(empty).getByText("—")).toHaveAttribute("aria-hidden");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("FactsLine is a list; labels are read before values, icons are hidden", async () => {
    const { container } = render(
      <FactsLine aria-label="Source facts" items={[{ label: "Type", value: "Website", icon: <svg data-testid="icon" /> }, { value: "58 documents" }]} />,
    );
    const list = screen.getByRole("list", { name: "Source facts" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["Type: Website", "58 documents"]);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PageHeader shows the facts slot under the title", () => {
    render(<PageHeader title="Registrar website" facts={<FactsLine items={[{ value: "Website" }]} />} />);
    const heading = screen.getByRole("heading", { level: 1, name: "Registrar website" });
    expect(heading.compareDocumentPosition(screen.getByRole("list")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("Meter", () => {
  it("is a named meter with X of Y text and no status below the warning threshold", async () => {
    const { container } = render(<Meter label="Documents" value={120} max={5000} />);
    const meter = screen.getByRole("meter", { name: "Documents" });
    expect(meter).toHaveAttribute("aria-valuenow", "120");
    expect(meter).toHaveAttribute("aria-valuemax", "5000");
    expect(meter).toHaveAttribute("aria-valuetext", "120 of 5,000");
    expect(meter).toHaveAttribute("data-level", "normal");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("spells out warning, critical and over-limit levels, and clamps the bar", () => {
    const { rerender } = render(<Meter label="Storage" value={8.5} max={10} formatValue={(v) => `${v} GB`} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "8.5 GB of 10 GB, near limit");
    expect(screen.getByText("Near limit")).toBeInTheDocument();
    rerender(<Meter label="Storage" value={10} max={10} />);
    expect(screen.getByRole("meter")).toHaveAttribute("aria-valuetext", "10 of 10, at limit");
    rerender(<Meter label="Storage" value={12} max={10} />);
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "10");
    expect(meter).toHaveAttribute("aria-valuetext", "12 of 10, over limit");
    expect(meterLevel(50, 100, 0.5)).toBe("warning");
    expect(meterLevel(5, null)).toBe("normal");
  });

  it("describes the limit marker, and shows No limit without a meter", () => {
    const { rerender } = render(<Meter label="Pages" value={10} max={100} marker={{ value: 50, label: "Team limit" }} />);
    expect(screen.getByRole("meter")).toHaveAccessibleDescription("Team limit: 50");
    rerender(<Meter label="Agents" value={12} max={null} />);
    expect(screen.queryByRole("meter")).not.toBeInTheDocument();
    expect(screen.getByText(/12 · No limit/)).toBeInTheDocument();
  });
});

describe("Checklist", () => {
  const steps = [
    { id: "a", title: "Add a data source", done: true },
    { id: "b", title: "Create a knowledge base", done: false, action: { label: "Create", onClick: vi.fn() } },
    { id: "c", title: "Share", done: false, action: { label: "Open Share", href: "#share" } },
  ];

  it("is a named section with a summary, states and actions; dismissible", async () => {
    const onDismiss = vi.fn();
    const { container } = render(<Checklist title="Get started" steps={steps} onDismiss={onDismiss} />);
    const section = screen.getByRole("region", { name: "Get started" });
    expect(within(section).getByRole("progressbar", { name: "1 of 3 done" })).toBeInTheDocument();
    const items = within(section).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Done: Add a data source");
    expect(items[1]).toHaveTextContent("To do: Create a knowledge base");
    // The current step's action is primary; later ones secondary; done steps have none.
    expect(within(items[1]!).getByRole("button", { name: "Create" })).toHaveAttribute("data-variant", "primary");
    expect(within(items[2]!).getByRole("link", { name: "Open Share" })).toHaveAttribute("data-variant", "secondary");
    expect(within(items[0]!).queryByRole("button")).not.toBeInTheDocument();
    await userEvent.click(within(items[1]!).getByRole("button", { name: "Create" }));
    expect((steps[1]!.action as { onClick: () => void }).onClick).toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Dismiss Get started" }));
    expect(onDismiss).toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the completion message when every step is done", () => {
    render(<Checklist title="Setup" steps={steps.map((s) => ({ ...s, done: true }))} complete="All set." />);
    expect(screen.getByText("All set.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });
});
