/*
 * DiffViewer and its pure helpers (line diff, structural JSON diff).
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { diffJson, diffText, parseJsonValue } from "@/registry/bitop/ui/diff-viewer/diff";
import { DiffViewer } from "@/registry/bitop/ui/diff-viewer/diff-viewer";

describe("diff helpers", () => {
  it("diffText aligns lines with numbers", () => {
    const d = diffText("a\nb\nc\nd\n", "a\nB\nc\nd\ne");
    expect(d.lines.map((l) => `${l.kind[0]}${l.oldNumber ?? "-"}${l.newNumber ?? "-"} ${l.text}`)).toEqual([
      "e11 a",
      "r2- b",
      "a-2 B",
      "e33 c",
      "e44 d",
      "a-5 e",
    ]);
    expect([d.added, d.removed, d.approximate]).toEqual([2, 1, false]);
    expect(diffText("same", "same").lines.every((l) => l.kind === "equal")).toBe(true);
    expect(diffText("", "x").added).toBe(1);
  });

  it("diffText falls back to remove-all/add-all past the edit budget", () => {
    const a = Array.from({ length: 50 }, (_, i) => `a${i}`).join("\n");
    const b = Array.from({ length: 50 }, (_, i) => `b${i}`).join("\n");
    const d = diffText(a, b, 10);
    expect(d.approximate).toBe(true);
    expect([d.added, d.removed]).toEqual([50, 50]);
  });

  it("diffJson reports added, removed and changed keys with paths", () => {
    const changes = diffJson(
      { model: "a", retrieval: { passages: 8, fusion: { k: 1 } }, tags: ["x", "y"], "odd key": 1, gone: true },
      { model: "b", retrieval: { passages: 8, fusion: { k: 2 } }, tags: ["x", "y", "z"], "odd key": 1, added: { on: true } },
    );
    expect(changes).toEqual([
      { kind: "changed", path: "model", before: "a", after: "b" },
      { kind: "changed", path: "retrieval.fusion.k", before: 1, after: 2 },
      { kind: "added", path: "tags[2]", after: "z" },
      { kind: "removed", path: "gone", before: true },
      { kind: "added", path: "added", after: { on: true } },
    ]);
    expect(diffJson({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toEqual([]);
    expect(diffJson({ "a b": 1 }, {})).toEqual([{ kind: "removed", path: '["a b"]', before: 1 }]);
    expect(parseJsonValue('{"a":1}')).toEqual({ a: 1 });
    expect(parseJsonValue("not json")).toBe("not json");
  });
});

describe("DiffViewer", () => {
  it("text: a captioned table with signs and hidden words, switchable to split", async () => {
    const { container } = render(<DiffViewer label="System prompt" before={"one\ntwo\nthree"} after={"one\n2\nthree"} />);
    expect(screen.getByText("1 line added, 1 removed")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "System prompt" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows.map((r) => r.getAttribute("data-kind"))).toEqual(["equal", "remove", "add", "equal"]);
    expect(rows[1]).toHaveTextContent("Removed: two");
    expect(rows[2]).toHaveTextContent("Added: 2");
    expect(await axe(container)).toHaveNoViolations();

    await userEvent.click(screen.getByRole("button", { name: "Split" }));
    expect(screen.getByRole("button", { name: "Split" })).toHaveAttribute("aria-pressed", "true");
    const split = screen.getByRole("table", { name: "System prompt" });
    expect(within(split).getByRole("columnheader", { name: "Before" })).toBeInTheDocument();
    expect(within(split).getAllByRole("row")).toHaveLength(1 + 3);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("folds long unchanged runs behind a button", async () => {
    const before = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
    const after = before.replace("line 15", "line fifteen");
    render(<DiffViewer label="Doc" before={before} after={after} contextLines={2} />);
    const folds = screen.getAllByRole("button", { name: /Show \d+ unchanged lines/ });
    expect(folds.map((b) => b.textContent)).toEqual(["Show 12 unchanged lines", "Show 13 unchanged lines"]);
    await userEvent.click(folds[0]!);
    expect(screen.getByText("line 1")).toBeInTheDocument();
    expect(screen.queryByText("line 30")).not.toBeInTheDocument();
  });

  it("json: one row per change with its path; split shows Before and After; identical values say No changes", async () => {
    const { container, rerender } = render(
      <DiffViewer label="Agent changes" format="json" before={'{"model":"a","passages":8}'} after={{ model: "b", passages: 8, moderation: "flag" }} />,
    );
    expect(screen.getByText("2 changes: 1 added, 0 removed, 1 changed")).toBeInTheDocument();
    const rows = within(screen.getByRole("table", { name: "Agent changes" })).getAllByRole("row").slice(1);
    expect(rows.map((r) => r.textContent)).toEqual(['−Changed, before: model"a"', '+Changed, after: model"b"', '+Added: moderation"flag"']);
    expect(await axe(container)).toHaveNoViolations();
    rerender(<DiffViewer label="Agent changes" format="json" mode="split" before={{ a: 1 }} after={{ b: 2 }} />);
    const split = within(screen.getByRole("table", { name: "Agent changes" })).getAllByRole("row").slice(1);
    expect(split[0]).toHaveTextContent("Removed: a1—Not set");
    expect(within(split[0]!).getByRole("rowheader")).toHaveTextContent("a");
    rerender(<DiffViewer label="Agent changes" format="json" before={{ a: 1 }} after={{ a: 1 }} />);
    expect(screen.getByText("No changes")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
