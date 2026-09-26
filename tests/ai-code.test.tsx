/*
 * Behaviour tests for the code-oriented AI items: commit, environment
 * variables, file tree, package info, schema display, stack trace, terminal
 * and test results.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import {
  Commit,
  CommitActions,
  CommitContent,
  CommitCopyButton,
  CommitFile,
  CommitFiles,
  CommitHash,
  CommitHeader,
  CommitInfo,
  CommitMessage,
  CommitTimestamp,
  CommitTrigger,
  formatRelativeTime,
} from "@/registry/bitop/ui/commit/commit";
import {
  EnvironmentVariable,
  EnvironmentVariables,
  EnvironmentVariablesContent,
  EnvironmentVariablesHeader,
  EnvironmentVariablesTitle,
  EnvironmentVariablesToggle,
  formatEnvironmentVariable,
} from "@/registry/bitop/ui/environment-variables/environment-variables";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/registry/bitop/ui/file-tree/file-tree";
import { PackageInfo, PackageInfoDependencies, PackageInfoDependency } from "@/registry/bitop/ui/package-info/package-info";
import { SchemaDisplay, schemaToProperties } from "@/registry/bitop/ui/schema-display/schema-display";
import { StackTrace, parseStackTrace } from "@/registry/bitop/ui/stack-trace/stack-trace";
import { Terminal, parseAnsi, stripAnsi } from "@/registry/bitop/ui/terminal/terminal";
import { Test, TestError, TestErrorMessage, TestResults, TestResultsContent, TestResultsProgress, TestSuite, TestSuiteContent, TestSuiteName, formatDuration } from "@/registry/bitop/ui/test-results/test-results";

describe("FileTree", () => {
  function Tree(props: Partial<Parameters<typeof FileTree>[0]>) {
    return (
      <FileTree label="Project files" {...props}>
        <FileTreeFolder path="src" name="src">
          <FileTreeFolder path="src/lib" name="lib">
            <FileTreeFile path="src/lib/utils.ts" name="utils.ts" />
          </FileTreeFolder>
          <FileTreeFile path="src/index.ts" name="index.ts" />
        </FileTreeFolder>
        <FileTreeFolder path="docs" name="docs">
          <FileTreeFile path="docs/intro.md" name="intro.md" />
        </FileTreeFolder>
        <FileTreeFile path="package.json" name="package.json" meta="M" />
        <FileTreeFile path="README.md" name="README.md" />
      </FileTree>
    );
  }
  const item = (name: string) => screen.getByRole("treeitem", { name });

  it("wires tree semantics with one tab stop", async () => {
    const { container } = render(<Tree defaultExpanded={["src"]} />);
    const tree = screen.getByRole("tree", { name: "Project files" });
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(item("src")).toHaveAttribute("aria-level", "1");
    expect(item("lib")).toHaveAttribute("aria-level", "2");
    expect(item("lib")).toHaveAttribute("aria-expanded", "false");
    expect(item("package.json M")).not.toHaveAttribute("aria-expanded");
    expect(within(item("src")).getByRole("group")).toBeInTheDocument();
    expect(tree.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(item("src")).toHaveAttribute("tabindex", "0");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("supports the tree keyboard model", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onExpandedChange = vi.fn();
    render(<Tree onSelect={onSelect} onExpandedChange={onExpandedChange} />);
    await user.tab();
    expect(item("src")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
    expect(onExpandedChange).toHaveBeenLastCalledWith(["src"]);
    expect(item("src")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(item("lib")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("index.ts")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item("src")).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(item("src")).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{End}");
    expect(item("README.md")).toHaveFocus();
    expect(item("README.md")).toHaveAttribute("tabindex", "0");
    expect(item("src")).toHaveAttribute("tabindex", "-1");
    await user.keyboard("{Home}");
    expect(item("src")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("src")).toHaveFocus();

    // Type-ahead: "p" jumps to package.json, "r" to README.md, "d" to docs.
    await user.keyboard("p");
    expect(item("package.json M")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onSelect).toHaveBeenLastCalledWith("package.json", "file");
    expect(item("package.json M")).toHaveAttribute("aria-selected", "true");
    await user.keyboard("d");
    expect(item("docs")).toHaveFocus();
    await user.keyboard(" ");
    expect(onSelect).toHaveBeenLastCalledWith("docs", "folder");
    expect(item("docs")).toHaveAttribute("aria-expanded", "true");

    // * opens every sibling folder.
    await user.keyboard("{Home}*");
    expect(item("src")).toHaveAttribute("aria-expanded", "true");
  });

  it("selects and toggles on click; honours controlled state", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const onSelect = vi.fn();
    render(<Tree expanded={[]} onExpandedChange={onExpandedChange} selectedPath="README.md" onSelect={onSelect} />);
    expect(item("README.md")).toHaveAttribute("aria-selected", "true");
    expect(item("README.md")).toHaveAttribute("tabindex", "0");
    await user.click(screen.getByText("src"));
    expect(onExpandedChange).toHaveBeenCalledWith(["src"]);
    expect(onSelect).toHaveBeenCalledWith("src", "folder");
    // Controlled: nothing changes until the parent updates the props.
    expect(item("src")).toHaveAttribute("aria-expanded", "false");
    expect(item("README.md")).toHaveAttribute("aria-selected", "true");
    expect(item("src")).toHaveFocus();
  });

  it("moves the tab stop off an item hidden by a controlled collapse", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [expanded, setExpanded] = useState(["src"]);
      return (
        <>
          <button type="button" onClick={() => setExpanded([])}>
            Collapse all
          </button>
          <Tree expanded={expanded} onExpandedChange={setExpanded} />
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByText("index.ts"));
    expect(item("index.ts")).toHaveAttribute("tabindex", "0");
    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    await waitFor(() => expect(screen.queryByRole("treeitem", { name: "index.ts" })).not.toBeInTheDocument());
    expect(item("src")).toHaveAttribute("tabindex", "0");
  });
});

describe("Terminal", () => {
  it("parses ANSI SGR codes into styled spans", () => {
    expect(parseAnsi("\u001b[1;31mError\u001b[0m done")).toEqual([
      { bold: true, fg: "red", text: "Error" },
      { text: " done" },
    ]);
    expect(parseAnsi("\u001b[90mgray\u001b[39m \u001b[38;5;2mgreen\u001b[38;2;1;2;3mtrue")).toEqual([
      { fg: "gray", text: "gray" },
      { text: " " },
      { fg: "green", text: "greentrue" },
    ]);
    expect(stripAnsi("\u001b]0;title\u0007\u001b[2Kloading 10%\rloading 100%\u001b[?25h\r\nok")).toBe("loading 100%\nok");
  });

  it("renders colours as data attributes, copies plain text and clears", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { container } = render(<Terminal title="npm test" output={"\u001b[32m✓ passed\u001b[0m\nplain"} onClear={onClear} />);
    const region = screen.getByRole("region", { name: "npm test" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByText("✓ passed")).toHaveAttribute("data-fg", "green");
    await user.click(screen.getByRole("button", { name: "Copy output" }));
    expect(await navigator.clipboard.readText()).toBe("✓ passed\nplain");
    await user.click(screen.getByRole("button", { name: "Clear output" }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a running status and keeps the view pinned while streaming", () => {
    const { rerender } = render(<Terminal output="a" streaming />);
    const region = screen.getByRole("region", { name: "Terminal" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Running")).toBeInTheDocument();
    Object.defineProperty(region, "scrollHeight", { configurable: true, value: 500 });
    rerender(<Terminal output={"a\nb"} streaming />);
    expect(region.scrollTop).toBe(500);
    rerender(<Terminal output={"a\nb"} />);
    expect(region).not.toHaveAttribute("aria-busy");
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear output" })).not.toBeInTheDocument();
  });
});

describe("StackTrace", () => {
  const v8 = `TypeError: Cannot read properties of undefined (reading 'map')
    at renderRows (/app/src/table.tsx:42:18)
    at renderWithHooks (/app/node_modules/react-dom/index.js:10:5)
    at beginWork (/app/node_modules/react-dom/index.js:20:7)
    at /app/src/main.ts:3:1
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)`;

  it("parses V8 and Firefox stacks", () => {
    const parsed = parseStackTrace(v8);
    expect(parsed.errorType).toBe("TypeError");
    expect(parsed.errorMessage).toBe("Cannot read properties of undefined (reading 'map')");
    expect(parsed.frames).toHaveLength(5);
    expect(parsed.frames[0]).toMatchObject({ functionName: "renderRows", filePath: "/app/src/table.tsx", lineNumber: 42, columnNumber: 18, isInternal: false });
    expect(parsed.frames[1]!.isInternal).toBe(true);
    expect(parsed.frames[3]).toMatchObject({ functionName: null, filePath: "/app/src/main.ts", lineNumber: 3 });
    expect(parsed.frames[4]).toMatchObject({ filePath: "node:internal/process/task_queues", isInternal: true });

    const gecko = parseStackTrace("Error: boom\nfmt@https://x.test/a.js:12:31\n@https://x.test/node_modules/@scope/b.js:1:4");
    expect(gecko.errorType).toBe("Error");
    expect(gecko.frames[0]).toMatchObject({ functionName: "fmt", filePath: "https://x.test/a.js", lineNumber: 12, columnNumber: 31 });
    expect(gecko.frames[1]).toMatchObject({ functionName: null, filePath: "https://x.test/node_modules/@scope/b.js", isInternal: true });

    expect(parseStackTrace("Something odd happened").errorType).toBeNull();
  });

  it("toggles frames, folds internal runs, reports clicks and copies the raw trace", async () => {
    const user = userEvent.setup();
    const onFrameClick = vi.fn();
    const { container } = render(<StackTrace trace={v8} onFrameClick={onFrameClick} />);
    const trigger = screen.getByRole("button", { name: /TypeError: Cannot read properties/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const frames = screen.getByRole("region", { name: /TypeError/ });
    const internal = within(frames).getByRole("button", { name: "2 internal frames" });
    expect(internal).toHaveAttribute("aria-expanded", "false");
    expect(within(frames).queryByText(/renderWithHooks/)).not.toBeInTheDocument();
    await user.click(internal);
    expect(within(frames).getByText(/renderWithHooks/)).toBeInTheDocument();
    // The last frame is a separate single-frame run.
    expect(within(frames).getByRole("button", { name: "1 internal frame" })).toBeInTheDocument();

    await user.click(within(frames).getByRole("button", { name: "/app/src/table.tsx:42:18" }));
    expect(onFrameClick).toHaveBeenCalledWith(expect.objectContaining({ functionName: "renderRows", lineNumber: 42 }));

    await user.click(screen.getByRole("button", { name: "Copy stack trace" }));
    expect(await navigator.clipboard.readText()).toBe(v8);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("can hide internal frames and shows locations as text without a click handler", () => {
    render(<StackTrace trace={v8} defaultOpen />);
    expect(screen.queryByRole("button", { name: "/app/src/table.tsx:42:18" })).not.toBeInTheDocument();
    expect(screen.getByText("/app/src/table.tsx:42:18")).toBeInTheDocument();
  });
});

describe("Commit", () => {
  it("formats relative times", () => {
    const now = new Date("2026-09-26T12:00:00Z");
    expect(formatRelativeTime(new Date("2026-09-26T09:00:00Z"), now, "en")).toBe("3 hours ago");
    expect(formatRelativeTime(new Date("2026-09-25T12:00:00Z"), now, "en")).toBe("yesterday");
    expect(formatRelativeTime(new Date("2026-09-26T11:59:58Z"), now, "en")).toBe("2 seconds ago");
  });

  it("toggles the file list, speaks statuses and copies the hash", async () => {
    const user = userEvent.setup();
    const hash = "8f3c2a91d7e04b6c5a1f9e2d3b4c5a6f7e8d9c0b";
    const onOpenChange = vi.fn();
    const { container } = render(
      <Commit onOpenChange={onOpenChange}>
        <CommitHeader>
          <CommitInfo>
            <CommitMessage>fix: refresh race</CommitMessage>
            <CommitTimestamp date={new Date("2026-09-24T12:00:00Z")} now={new Date("2026-09-26T12:00:00Z")} locale="en" />
          </CommitInfo>
          <CommitActions>
            <CommitHash hash={hash} />
            <CommitCopyButton hash={hash} />
          </CommitActions>
        </CommitHeader>
        <CommitTrigger fileCount={2} additions={14} deletions={3} />
        <CommitContent>
          <CommitFiles>
            <CommitFile path="src/auth.ts" status="modified" additions={12} deletions={3} />
            <CommitFile path="src/auth.test.ts" status="added" additions={2} />
          </CommitFiles>
        </CommitContent>
      </Commit>,
    );
    expect(screen.getByText("2 days ago").closest("time")).toHaveAttribute("datetime", "2026-09-24T12:00:00.000Z");
    expect(screen.getByText("8f3c2a9")).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "2 files changed, 14 lines added, 3 lines removed" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(onOpenChange).toHaveBeenCalledWith(true);
    const items = within(screen.getByRole("list", { name: "Changed files" })).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Modified:");
    expect(items[1]).toHaveTextContent("Added:");
    await user.click(screen.getByRole("button", { name: "Copy commit hash" }));
    expect(await navigator.clipboard.readText()).toBe(hash);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("EnvironmentVariables", () => {
  function Env(props: Parameters<typeof EnvironmentVariables>[0]) {
    return (
      <EnvironmentVariables {...props}>
        <EnvironmentVariablesHeader>
          <EnvironmentVariablesTitle>Production</EnvironmentVariablesTitle>
          <EnvironmentVariablesToggle />
        </EnvironmentVariablesHeader>
        <EnvironmentVariablesContent>
          <EnvironmentVariable name="API_KEY" value="sk_live_123" required />
          <EnvironmentVariable name="LOG_LEVEL" value="info" />
        </EnvironmentVariablesContent>
      </EnvironmentVariables>
    );
  }

  it("masks values, reveals one or all, and copies the real value", async () => {
    const user = userEvent.setup();
    const onShowValuesChange = vi.fn();
    const { container } = render(<Env onShowValuesChange={onShowValuesChange} />);
    expect(screen.getByRole("group", { name: "Production" })).toBeInTheDocument();
    expect(screen.queryByText("sk_live_123")).not.toBeInTheDocument();
    expect(screen.getAllByText("hidden")).toHaveLength(2);
    expect(screen.getByText("Required")).toBeInTheDocument();

    const showKey = screen.getByRole("button", { name: "Show API_KEY" });
    expect(showKey).toHaveAttribute("aria-pressed", "false");
    await user.click(showKey);
    expect(showKey).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("sk_live_123")).toBeInTheDocument();
    expect(screen.queryByText("info")).not.toBeInTheDocument();

    const all = screen.getByRole("switch", { name: "Show values" });
    await user.click(all);
    expect(onShowValuesChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByText("info")).toBeInTheDocument();
    await user.click(all);
    // Hiding all resets the per-row choice.
    expect(screen.queryByText("sk_live_123")).not.toBeInTheDocument();
    expect(showKey).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "Copy API_KEY" }));
    expect(await navigator.clipboard.readText()).toBe("sk_live_123");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("honours controlled visibility and formats copies", async () => {
    const user = userEvent.setup();
    const onShowValuesChange = vi.fn();
    render(<Env showValues onShowValuesChange={onShowValuesChange} />);
    expect(screen.getByText("info")).toBeInTheDocument();
    await user.click(screen.getByRole("switch", { name: "Show values" }));
    expect(onShowValuesChange).toHaveBeenCalledWith(false);
    expect(screen.getByText("info")).toBeInTheDocument();
    expect(formatEnvironmentVariable("A", 'x "y"', "export")).toBe('export A="x \\"y\\""');
    expect(formatEnvironmentVariable("A", "has space", "dotenv")).toBe('A="has space"');
    expect(formatEnvironmentVariable("A", "v", "name")).toBe("A");
  });
});

describe("PackageInfo", () => {
  it("names the card, spells out the change and reads the version range", async () => {
    const { container } = render(
      <PackageInfo name="react" currentVersion="18.3.1" newVersion="19.0.0" changeType="major">
        <PackageInfoDependencies>
          <PackageInfoDependency name="scheduler" version="^0.25.0" />
        </PackageInfoDependencies>
      </PackageInfo>,
    );
    const card = screen.getByRole("article", { name: "react" });
    expect(within(card).getByText("Major")).toBeInTheDocument();
    expect(within(card).getByText(/from/).closest("p")).toHaveTextContent("from 18.3.1 to 19.0.0");
    expect(within(screen.getByRole("list", { name: "Dependencies" })).getByRole("listitem")).toHaveTextContent("scheduler^0.25.0");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("SchemaDisplay", () => {
  it("renders an endpoint with collapsible sections and nested properties", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SchemaDisplay
        method="POST"
        path="/users/{id}/keys"
        parameters={[{ name: "id", type: "string", location: "path", required: true }]}
        responseBody={[{ name: "owner", type: "object", properties: [{ name: "email", type: "string", format: "email" }] }]}
      />,
    );
    expect(screen.getByText("POST")).toBeInTheDocument();
    expect(screen.getByText("{id}")).toBeInTheDocument();
    const params = screen.getByRole("button", { name: "Parameters 1" });
    expect(params).toHaveAttribute("aria-expanded", "true");
    const owner = screen.getByRole("button", { name: "owner object" });
    expect(owner).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("email")).toBeInTheDocument();
    await user.click(owner);
    expect(owner).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(screen.queryByText("email")).not.toBeInTheDocument());
    await user.click(params);
    expect(params).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("converts JSON Schema", () => {
    const rows = schemaToProperties({
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        lines: { type: "array", items: { type: "object", properties: { sku: { type: "string" } } } },
        paidAt: { type: ["string", "null"], format: "date-time" },
      },
    });
    expect(rows.map((r) => [r.name, r.type, r.required])).toEqual([
      ["id", "string", true],
      ["tags", "string[]", false],
      ["lines", "object[]", false],
      ["paidAt", "string | null", false],
    ]);
    expect(rows[2]!.properties?.[0]?.name).toBe("sku");
  });
});

describe("TestResults", () => {
  it("summarises the run and folds suites and error details", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TestResults summary={{ passed: 3, failed: 1, skipped: 0, total: 4, duration: 4210 }}>
        <TestResultsProgress />
        <TestResultsContent>
          <TestSuite name="auth.test.ts" status="failed">
            <TestSuiteName />
            <TestSuiteContent>
              <Test name="refreshes" status="passed" duration={12} />
              <Test name="rejects expired" status="failed" duration={40}>
                <TestError>
                  <TestErrorMessage>Expected 401, got 200</TestErrorMessage>
                </TestError>
              </Test>
            </TestSuiteContent>
          </TestSuite>
        </TestResultsContent>
      </TestResults>,
    );
    const meter = screen.getByRole("meter", { name: "3/4 tests passed" });
    expect(meter).toHaveAttribute("aria-valuenow", "3");
    expect(meter).toHaveAttribute("aria-valuetext", "3 of 4 (75%)");

    const suite = screen.getByRole("button", { name: "Failed: auth.test.ts" });
    expect(suite).toHaveAttribute("aria-expanded", "false");
    await user.click(suite);
    const list = screen.getByRole("list", { name: "auth.test.ts" });
    expect(within(list).getAllByRole("listitem")[0]).toHaveTextContent("Passed: refreshes 12ms");
    // Failed tests start with their details open.
    const failed = within(list).getByRole("button", { name: "Failed: rejects expired 40ms" });
    expect(failed).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Expected 401, got 200")).toBeInTheDocument();
    await user.click(failed);
    expect(failed).toHaveAttribute("aria-expanded", "false");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the default header from the summary and formats durations", () => {
    render(<TestResults summary={{ passed: 5, failed: 0, skipped: 2, total: 7, duration: 65_000 }} />);
    expect(screen.getByText("5 passed")).toBeInTheDocument();
    expect(screen.getByText("2 skipped")).toBeInTheDocument();
    expect(screen.queryByText(/failed/)).not.toBeInTheDocument();
    expect(screen.getByText("1m 5s")).toBeInTheDocument();
    expect(formatDuration(12)).toBe("12ms");
    expect(formatDuration(4210)).toBe("4.21s");
    expect(formatDuration(2000)).toBe("2s");
  });
});
