/*
 * Follow-ups from a consumer's release: a tooltip on plain text, labelled
 * ticks on a line chart's scale, a Columns menu only where it helps, a
 * visible search label, no chip for a single-choice toggle filter, menus
 * inside the page's landmarks (axe `region`), and a citation card's "go to
 * source" action.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
import { TooltipText } from "@/registry/bitop/ui/tooltip/tooltip";

describe("TooltipText", () => {
  it("is focusable text described by the tooltip, which opens on focus and hover and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <main>
        <p>
          Score:{" "}
          <TooltipText content="Recall@5: the share of questions whose document was in the top 5." delay={0} className="scoped">
            82%
          </TooltipText>
        </p>
      </main>,
    );
    const text = screen.getByText("82%");
    expect(text.tagName).toBe("SPAN");
    expect(text).toHaveClass("scoped");
    expect(screen.queryByRole("button")).toBeNull();
    // Screen readers get the tooltip's text as the description, open or not.
    expect(text).toHaveAccessibleDescription("Recall@5: the share of questions whose document was in the top 5.");

    // The popup (visual only, no role) and the hidden description hold the same text.
    const shown = () => screen.getAllByText(/^Recall@5/).length === 2;
    expect(shown()).toBe(false);
    await user.tab();
    expect(text).toHaveFocus();
    await waitFor(() => expect(shown()).toBe(true));
    expect(await axe(document.body, { rules: { region: { enabled: false } } })).toHaveNoViolations();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(shown()).toBe(false));
    expect(text).toHaveFocus();

    act(() => text.blur());
    await user.hover(text);
    await waitFor(() => expect(shown()).toBe(true));
  });
});

describe("LineChart ticks", () => {
  const runs = [
    { label: "Run 1", values: { score: 62 } },
    { label: "Run 2", values: { score: 81 } },
  ];
  const series = [{ key: "score" as const, label: "Recall@5" }];
  const pct = (v: number) => `${v}%`;

  it("labels the ticks on the scale, each at its height; the top keeps its own label", async () => {
    const { container } = render(
      <LineChart data={runs} series={series} summary="Recall@5 over 2 runs, from 62% to 81%." domain={{ min: 0, max: 100 }} ticks={[0, 50, 100, 150]} formatValue={pct} />,
    );
    const img = screen.getByRole("img", { name: "Recall@5 over 2 runs, from 62% to 81%." });
    // 100% once (the peak line), 50% half way, 0% at the bottom; 150 is off the scale.
    expect(within(img).getAllByText("100%")).toHaveLength(1);
    const half = within(img).getByText("50%");
    expect(half.style.getPropertyValue("--y")).toBe("50.00%");
    expect(half).not.toHaveAttribute("data-floor");
    const zero = within(img).getByText("0%");
    expect(zero.style.getPropertyValue("--y")).toBe("100.00%");
    expect(zero).toHaveAttribute("data-floor");
    expect(within(img).queryByText("150%")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a tick at a non-zero minimum replaces the minimum's own label; without axis nothing is labelled", () => {
    const { rerender } = render(<LineChart data={runs} series={series} summary="s" domain={{ min: 40, max: 100 }} ticks={[40, 70]} formatValue={pct} />);
    expect(within(screen.getByRole("img")).getAllByText("40%")).toHaveLength(1);
    expect(within(screen.getByRole("img")).getByText("70%").style.getPropertyValue("--y")).toBe("50.00%");
    rerender(<LineChart data={runs} series={series} summary="s" domain={{ min: 40, max: 100 }} ticks={[40, 70]} formatValue={pct} axis={false} />);
    expect(within(screen.getByRole("img")).queryByText("70%")).toBeNull();
  });
});
