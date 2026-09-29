/*
 * Charts: the shared chart pieces, LineChart, Sparkline (and StatCard's chart
 * slot) and BarChart's data table.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { BarChart } from "@/registry/bitop/ui/bar-chart/bar-chart";
import { ChartData, ChartLegend, seriesPattern, seriesTone } from "@/registry/bitop/ui/chart/chart";
import { LineChart } from "@/registry/bitop/ui/line-chart/line-chart";
import { Sparkline } from "@/registry/bitop/ui/sparkline/sparkline";
import { StatCard } from "@/registry/bitop/ui/stat-card/stat-card";

describe("charts", () => {
  const series = [
    { key: "answers" as const, label: "Answers" },
    { key: "chats" as const, label: "Conversations", tone: "info" as const },
  ];
  const data = [
    { label: "Sep 1", values: { answers: 10, chats: 4 } },
    { label: "Sep 2", values: { answers: 40, chats: 10 } },
  ];

  it("LineChart is one image with a legend, peak label and an optional data table", async () => {
    const { container } = render(<LineChart data={data} series={series} summary="Answers per day: 50 in total." dataTable={{ caption: "Answers per day" }} />);
    const img = screen.getByRole("img", { name: "Answers per day: 50 in total." });
    expect(within(img).getByText("40")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden");
    expect(container.querySelector("svg")!.querySelectorAll("path")).toHaveLength(2);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Answers", "Conversations"]);
    const toggle = screen.getByRole("button", { name: "Show data" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    const table = screen.getByRole("table", { name: "Answers per day" });
    expect(within(table).getAllByRole("rowheader").map((c) => c.textContent)).toEqual(["Sep 1", "Sep 2"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("LineChart area adds fills; a single point shows a dot", () => {
    const { container, rerender } = render(<LineChart variant="area" data={data} series={series} summary="s" />);
    expect(container.querySelectorAll("path")).toHaveLength(4);
    rerender(<LineChart data={data.slice(0, 1)} series={series.slice(0, 1)} summary="one point" />);
    expect(container.querySelectorAll("path")).toHaveLength(0);
    expect(container.querySelectorAll("[style]").length).toBeGreaterThan(0);
  });

  it("LineChart domain fixes the scale: the top shows max, values outside draw at the edge, a non-zero min is labelled", () => {
    const pct = [
      { label: "Run 1", values: { answers: 50 } },
      { label: "Run 2", values: { answers: 120 } },
    ];
    const one = [{ key: "answers" as const, label: "Recall" }];
    const { container, rerender } = render(<LineChart data={pct} series={one} summary="s" domain={{ min: 0, max: 100 }} formatValue={(v) => `${v}%`} points />);
    expect(within(screen.getByRole("img")).getByText("100%")).toBeInTheDocument();
    // 50 of 0–100 is half way up; 120 is clamped to the top.
    expect(container.querySelector("path")!.getAttribute("d")).toBe("M0.00,50.00 L1000.00,0.00");
    expect(within(screen.getByRole("img")).queryByText("0%")).toBeNull();
    rerender(<LineChart data={pct} series={one} summary="s" domain={{ min: 40, max: 140 }} formatValue={(v) => `${v}%`} />);
    expect(container.querySelector("path")!.getAttribute("d")).toBe("M0.00,90.00 L1000.00,20.00");
    expect(within(screen.getByRole("img")).getByText("40%")).toBeInTheDocument();
  });

  it("BarChart domain fixes the top of the scale", () => {
    const one = [{ key: "answers" as const, label: "Recall" }];
    const { container } = render(
      <BarChart data={[{ label: "a", values: { answers: 25 } }, { label: "b", values: { answers: 150 } }]} series={one} summary="s" domain={{ max: 100 }} formatValue={(v) => `${v}%`} />,
    );
    const bars = [...container.querySelectorAll<HTMLElement>("[data-tone]")].filter((e) => e.style.getPropertyValue("--bar-size"));
    expect(bars.map((b) => b.style.getPropertyValue("--bar-size"))).toEqual(["25%", "100%"]);
    expect(within(screen.getByRole("img")).getByText("100%")).toBeInTheDocument();
  });

  it("series tones and patterns follow position unless set", () => {
    expect(seriesTone({}, 1)).toBe("info");
    expect(seriesTone({ tone: "danger" }, 0)).toBe("danger");
    expect([0, 1, 2, 3].map((i) => seriesPattern({}, i))).toEqual(["solid", "dashed", "dotted", "solid"]);
    const { container } = render(<ChartLegend swatch="line" series={series} />);
    expect([...container.querySelectorAll("[data-pattern]")].map((e) => e.getAttribute("data-pattern"))).toEqual(["solid", "dashed"]);
  });

  it("ChartData and BarChart dataTable render the numbers", async () => {
    render(<ChartData caption="Numbers" series={series} data={data} defaultOpen formatValue={(v) => `${v}!`} />);
    expect(screen.getByRole("cell", { name: "40!" })).toBeInTheDocument();
    const { container } = render(<BarChart data={data} series={series} summary="Bars" dataTable={{ caption: "Bars per day", defaultOpen: true }} />);
    expect(screen.getByRole("table", { name: "Bars per day" })).toBeInTheDocument();
    expect(container.querySelector("[data-tone='info']")).toBeInTheDocument();
  });

  it("Sparkline is a named image (or hidden when decorative) and sits in the StatCard chart slot", async () => {
    const { container } = render(
      <StatCard label="Answers" value="96" chart={<Sparkline values={[1, 5, 3, 8]} label="Answers per day: rising from 1 to 8" />} />,
    );
    const img = screen.getByRole("img", { name: "Answers per day: rising from 1 to 8" });
    expect(img.closest("dd")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    render(<Sparkline values={[1, 2]} decorative data-testid="deco" />);
    expect(screen.getByTestId("deco")).toHaveAttribute("aria-hidden", "true");
  });
});
