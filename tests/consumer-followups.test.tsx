/*
 * Follow-ups from a consumer's release: a tooltip on plain text, labelled
 * ticks on a line chart's scale, a Columns menu only where it helps, a
 * visible search label, no chip for a single-choice toggle filter, menus
 * inside the page's landmarks (axe `region`), and a citation card's "go to
 * source" action.
 */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
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
