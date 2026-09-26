import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import {
  formatBytes,
  formatDate,
  formatNumber,
  formatRelativeTime,
  plural,
  relativeTimeUnit,
  toDate,
} from "@/registry/bitop/lib/bitop-format";
import { ErrorAlert, describeError, errorMessage, errorStatus } from "@/registry/bitop/ui/alert/alert";
import { QueryState } from "@/registry/bitop/ui/query-state/query-state";
import { Time, relativeRefreshInterval } from "@/registry/bitop/ui/time/time";

const httpError = (status: number, message = "") => Object.assign(new Error(message), { status });

/* ---------------- describeError / ErrorAlert ---------------- */

describe("describeError", () => {
  it.each([
    [401, "You're signed out", "danger"],
    [403, "You don't have access", "danger"],
    [404, "Not found", "danger"],
    [408, "The request timed out", "danger"],
    [504, "The request timed out", "danger"],
    [429, "Too many requests", "warning"],
    [500, "Something went wrong on our side", "danger"],
    [503, "Something went wrong on our side", "danger"],
  ])("maps status %i", (status, title, tone) => {
    const d = describeError(httpError(status, "Server said no"));
    expect(d).toEqual({ title, tone, status, message: "Server said no" });
  });

  it("reads response.status and falls back to a default message", () => {
    const d = describeError({ response: { status: 403 } });
    expect(d.status).toBe(403);
    expect(d.title).toBe("You don't have access");
    expect(d.message).toMatch(/administrator/);
  });

  it("keeps the existing behaviour without a status", () => {
    expect(describeError(new Error("Name taken"))).toEqual({ message: "Name taken", tone: "danger" });
    expect(describeError("Plain string")).toEqual({ message: "Plain string", tone: "danger" });
    expect(describeError(httpError(409, "Conflict")).title).toBeUndefined();
    expect(describeError({}).message).toBe("Something went wrong.");
  });

  it("errorMessage reads message from plain objects; errorStatus ignores non-numbers", () => {
    expect(errorMessage({ message: "From the API" })).toBe("From the API");
    expect(errorMessage({})).toBe("");
    expect(errorMessage(null)).toBe("");
    expect(errorStatus({ status: "500" })).toBeUndefined();
    expect(errorStatus({ response: null })).toBeUndefined();
  });
});

describe("ErrorAlert", () => {
  it("renders nothing for a falsy error", () => {
    const { container } = render(<ErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a status title and a retry button", async () => {
    const onRetry = vi.fn();
    const { container } = render(<ErrorAlert error={httpError(403, "Owners only.")} onRetry={onRetry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("You don't have access");
    expect(alert).toHaveTextContent("Owners only.");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses a polite warning for 429", () => {
    render(<ErrorAlert error={httpError(429)} />);
    expect(screen.getByRole("status")).toHaveTextContent("Too many requests");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("merges describe() over describeError(), and explicit props win", () => {
    const limit = Object.assign(new Error("Limit of 100 sources."), { code: "limit_reached", status: 409 });
    const describe = (e: unknown) => ((e as { code?: string }).code === "limit_reached" ? { title: "Team limit reached", tone: "warning" as const } : undefined);
    const { rerender } = render(<ErrorAlert error={limit} describe={describe} retryLabel="Reload" onRetry={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent("Team limit reached");
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument();
    rerender(<ErrorAlert error={limit} describe={describe} title="Custom" tone="danger" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Custom");
  });
});

/* ---------------- QueryState ---------------- */

describe("QueryState", () => {
  it("shows an announced loading state", async () => {
    const { container } = render(
      <QueryState loading loadingLabel="Loading documents…">
        <p>content</p>
      </QueryState>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Loading documents…");
    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("announces the label with a custom loading fallback", () => {
    render(
      <QueryState loading loadingFallback={<div data-testid="skeleton" />}>
        content
      </QueryState>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("shows the error with a working retry button", async () => {
    const onRetry = vi.fn();
    const { container } = render(
      <QueryState error={httpError(404)} onRetry={onRetry}>
        content
      </QueryState>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Not found");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("content")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the default or a custom empty state", async () => {
    const { container, rerender } = render(
      <QueryState empty emptyTitle="No documents yet" emptyDescription="Upload a file to start.">
        content
      </QueryState>,
    );
    expect(screen.getByText("No documents yet")).toBeInTheDocument();
    expect(screen.getByText("Upload a file to start.")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    rerender(
      <QueryState empty emptyState={<p>Custom empty</p>}>
        content
      </QueryState>,
    );
    expect(screen.getByText("Custom empty")).toBeInTheDocument();
  });

  it("renders children (node or function) otherwise", () => {
    const { rerender } = render(<QueryState>plain content</QueryState>);
    expect(screen.getByText("plain content")).toBeInTheDocument();
    const fn = vi.fn(() => <p>lazy content</p>);
    rerender(<QueryState loading>{fn}</QueryState>);
    expect(fn).not.toHaveBeenCalled();
    rerender(<QueryState>{fn}</QueryState>);
    expect(screen.getByText("lazy content")).toBeInTheDocument();
  });

  describe("query adapter", () => {
    type Result = { isPending: boolean; isFetching: boolean; error: Error | null; data: string[] | undefined; refetch: () => Promise<unknown> };
    const result = (over: Partial<Result>): Result => ({ isPending: false, isFetching: false, error: null, data: undefined, refetch: async () => undefined, ...over });
    const view = (query: Result) => <QueryState query={query}>{(rows) => <ul>{rows.map((r) => <li key={r}>{r}</li>)}</ul>}</QueryState>;

    it("derives loading, data and empty from the query", () => {
      const { rerender } = render(view(result({ isPending: true, isFetching: true })));
      expect(screen.getByRole("status")).toHaveTextContent("Loading…");
      rerender(view(result({ data: ["alpha", "beta"] })));
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      rerender(view(result({ data: [] })));
      expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
    });

    it("uses isLoading when isPending is absent, and a custom isEmpty", () => {
      const { rerender } = render(<QueryState query={{ isLoading: true }}>content</QueryState>);
      expect(screen.getByRole("status")).toBeInTheDocument();
      rerender(
        <QueryState query={{ data: { total: 0 } }} isEmpty={(d) => d.total === 0} emptyTitle="No usage">
          content
        </QueryState>,
      );
      expect(screen.getByText("No usage")).toBeInTheDocument();
    });

    it("retries through refetch and shows the retry spinner while fetching", async () => {
      const refetch = vi.fn(async () => undefined);
      const { rerender } = render(view(result({ error: httpError(500, "boom"), refetch })));
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(refetch).toHaveBeenCalledTimes(1);
      rerender(view(result({ error: httpError(500, "boom"), refetch, isFetching: true })));
      expect(screen.getByRole("button", { name: /Try again/ })).toHaveAttribute("aria-busy", "true");
    });

    it("keeps the content visible during a background refetch", () => {
      const { rerender } = render(view(result({ data: ["alpha"] })));
      rerender(view(result({ data: ["alpha"], isFetching: true })));
      // Even if a library reports pending while previous data is kept, don't flash a spinner.
      rerender(view(result({ data: ["alpha"], isPending: true, isFetching: true })));
      expect(screen.getByText("alpha")).toBeInTheDocument();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("explicit props win over the query", () => {
      render(
        <QueryState query={{ data: ["x"] }} empty emptyTitle="Forced empty">
          content
        </QueryState>,
      );
      expect(screen.getByText("Forced empty")).toBeInTheDocument();
    });

    it("never calls a render function without data", () => {
      const fn = vi.fn(() => "x");
      const { container } = render(<QueryState query={{ isPending: false }}>{fn}</QueryState>);
      expect(fn).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
    });
  });
});

/* ---------------- format ---------------- */

describe("format", () => {
  const d = "2026-09-26T14:30:00Z";

  it("formatDate styles, time zones and invalid input", () => {
    expect(formatDate(d, { style: "date", locale: "en-US", timeZone: "UTC" })).toBe("Sep 26, 2026");
    expect(formatDate(d, { locale: "en-US", timeZone: "UTC" })).toMatch(/^Sep 26, 2026, 2:30\sPM$/);
    expect(formatDate(d, { style: "time", locale: "en-US", timeZone: "UTC" })).toMatch(/^2:30\sPM$/);
    expect(formatDate(d, { style: "long", locale: "en-US", timeZone: "UTC" })).toMatch(/^Saturday, September 26, 2026 at 2:30:00\sPM UTC$/);
    expect(formatDate(new Date(d), { style: "date", locale: "de-DE", timeZone: "UTC" })).toBe("26.09.2026");
    expect(formatDate(Date.parse(d), { style: "time", locale: "en-GB", timeZone: "Asia/Tokyo" })).toBe("23:30");
    expect(formatDate("not a date")).toBe("");
    expect(formatDate(null, { fallback: "—" })).toBe("—");
    expect(formatDate(d, { timeZone: "Not/AZone" })).toBe("");
    expect(toDate("")).toBeUndefined();
  });

  it("formatNumber", () => {
    expect(formatNumber(1234567.891, { locale: "en-US" })).toBe("1,234,567.891");
    expect(formatNumber(1234567, { locale: "en-US", compact: true })).toBe("1.2M");
    expect(formatNumber(1234.5678, { locale: "de-DE", maximumFractionDigits: 1 })).toBe("1.234,6");
    expect(formatNumber(Number.NaN)).toBe("");
  });

  it("formatBytes in decimal and binary units", () => {
    expect(formatBytes(0, { locale: "en-US" })).toBe("0 B");
    expect(formatBytes(999, { locale: "en-US" })).toBe("999 B");
    expect(formatBytes(1500, { locale: "en-US" })).toBe("1.5 kB");
    expect(formatBytes(42_000_000, { locale: "en-US" })).toBe("42 MB");
    expect(formatBytes(999_960, { locale: "en-US" })).toBe("1 MB");
    expect(formatBytes(1536, { locale: "en-US", binary: true })).toBe("1.5 KiB");
    expect(formatBytes(5 * 1024 ** 3, { locale: "en-US", binary: true })).toBe("5 GiB");
    expect(formatBytes(1_234_567, { locale: "en-US", maximumFractionDigits: 2 })).toBe("1.23 MB");
    expect(formatBytes(1500, { locale: "de-DE" })).toBe("1,5 kB");
    expect(formatBytes(-2048, { locale: "en-US", binary: true })).toBe("-2 KiB");
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe("");
  });

  it("formatRelativeTime picks sensible units", () => {
    const now = new Date("2026-09-26T12:00:00Z");
    const at = (iso: string, numeric?: "auto" | "always") => formatRelativeTime(iso, { now, locale: "en-US", numeric });
    expect(at("2026-09-26T12:00:00Z")).toBe("now");
    expect(at("2026-09-26T11:59:58Z")).toBe("2 seconds ago");
    expect(at("2026-09-26T11:55:00Z")).toBe("5 minutes ago");
    expect(at("2026-09-26T11:00:20Z")).toBe("1 hour ago");
    expect(at("2026-09-26T09:00:00Z")).toBe("3 hours ago");
    expect(at("2026-09-25T12:00:00Z")).toBe("yesterday");
    expect(at("2026-09-25T12:00:00Z", "always")).toBe("1 day ago");
    expect(at("2026-10-06T12:00:00Z")).toBe("next week");
    expect(at("2026-10-10T12:00:00Z")).toBe("in 2 weeks");
    expect(at("2026-07-26T12:00:00Z")).toBe("2 months ago");
    expect(at("2025-10-01T12:00:00Z")).toBe("last year");
    expect(at("2021-09-26T12:00:00Z")).toBe("5 years ago");
    expect(formatRelativeTime("nope", { now })).toBe("");
    expect(relativeTimeUnit(59.6)).toEqual([1, "minute"]);
    expect(relativeTimeUnit(-3599)).toEqual([-1, "hour"]);
  });

  it("plural", () => {
    const files = { one: "file", other: "files" };
    expect(plural(1, files, "en-US")).toBe("1 file");
    expect(plural(3, files, "en-US")).toBe("3 files");
    expect(plural(0, files, "en-US")).toBe("0 files");
    expect(plural(1200, files, "en-US")).toBe("1,200 files");
    expect(plural(0, { ...files, zero: "No files" }, "en-US")).toBe("No files");
    expect(plural(2, { one: "{count} file left", other: "{count} files left" }, "en-US")).toBe("2 files left");
    // Polish uses "few" for 2–4 and "many" for 5+.
    const pl = { one: "plik", few: "pliki", many: "plików", other: "pliku" };
    expect(plural(3, pl, "pl")).toBe("3 pliki");
    expect(plural(5, pl, "pl")).toBe("5 plików");
  });
});

/* ---------------- Time ---------------- */

describe("Time", () => {
  afterEach(() => vi.useRealTimers());

  it("renders a <time> with an ISO dateTime and formatted text", async () => {
    const { container } = render(<Time value="2026-09-26T14:30:00Z" format="date" locale="en-US" timeZone="UTC" />);
    const el = container.querySelector("time");
    expect(el).toHaveAttribute("dateTime", "2026-09-26T14:30:00.000Z");
    expect(el).toHaveTextContent("Sep 26, 2026");
    expect(el).not.toHaveAttribute("title");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the fallback for missing or invalid values", () => {
    const { container, rerender } = render(<Time value={null} fallback="—" />);
    expect(container).toHaveTextContent("—");
    expect(container.querySelector("time")).toBeNull();
    rerender(<Time value="garbage" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("relative mode has a full-date title and uses a fixed now without a timer", () => {
    vi.useFakeTimers();
    const { container } = render(
      <Time value="2026-09-24T12:00:00Z" format="relative" now="2026-09-26T12:00:00Z" locale="en-US" timeZone="UTC" />,
    );
    const el = container.querySelector("time");
    expect(el).toHaveTextContent("2 days ago");
    expect(el?.getAttribute("title")).toMatch(/^Thursday, September 24, 2026 at 12:00:00\sPM UTC$/);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("relative mode refreshes while mounted and clears its timer on unmount", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-26T12:00:00Z"));
    const { container, unmount } = render(<Time value="2026-09-26T11:59:50Z" format="relative" locale="en-US" />);
    expect(container).toHaveTextContent("10 seconds ago");
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(container).toHaveTextContent("11 seconds ago");
    act(() => vi.advanceTimersByTime(60_000));
    expect(container).toHaveTextContent("1 minute ago");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("absolute formats never start a timer", () => {
    vi.useFakeTimers();
    render(<Time value="2026-09-26T11:59:50Z" format="time" />);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refreshes less often as values age", () => {
    expect(relativeRefreshInterval(5_000)).toBe(1_000);
    expect(relativeRefreshInterval(-10 * 60_000)).toBe(15_000);
    expect(relativeRefreshInterval(5 * 3_600_000)).toBe(300_000);
    expect(relativeRefreshInterval(10 * 86_400_000)).toBe(3_600_000);
  });
});
