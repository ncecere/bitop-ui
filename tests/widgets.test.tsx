import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Alert } from "@/registry/bitop/ui/alert/alert";
import { CopyField } from "@/registry/bitop/ui/copy-field/copy-field";
import { DropZone } from "@/registry/bitop/ui/drop-zone/drop-zone";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { matchesAccept } from "@/registry/bitop/lib/bitop-utils";

describe("DropZone", () => {
  it("is named and described, and the picker path calls onFiles", async () => {
    const onFiles = vi.fn();
    const { container } = render(
      <DropZone
        onFiles={onFiles}
        label="Drag and drop files here, or"
        buttonLabel="Choose files to upload"
        description="PDF, Word and Markdown."
        accept=".pdf,.docx,.md"
      />,
    );
    expect(screen.getByRole("group", { name: "Drag and drop files here, or" })).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Choose files to upload" });
    expect(button).toHaveAccessibleDescription("PDF, Word and Markdown.");

    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    expect(input.accept).toBe(".pdf,.docx,.md");
    const clicked = vi.spyOn(input, "click");
    await userEvent.click(button);
    expect(clicked).toHaveBeenCalled();

    const files = [new File(["%PDF"], "a.pdf", { type: "application/pdf" }), new File(["# hi"], "b.md", { type: "text/markdown" })];
    await userEvent.upload(input, files);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0]![0].map((f: File) => f.name)).toEqual(["a.pdf", "b.md"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not deliver files while busy", async () => {
    const onFiles = vi.fn();
    const { container } = render(<DropZone onFiles={onFiles} busy buttonLabel="Choose files" />);
    expect(screen.getByRole("button", { name: "Choose files" })).toHaveAttribute("aria-busy", "true");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.upload(input, [new File(["x"], "x.txt")]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("filters dropped and picked files by accept and maxSize, reports and announces rejections", async () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    const { container } = render(<DropZone onFiles={onFiles} onReject={onReject} accept=".pdf,image/*" maxSize={1000} />);
    const zone = screen.getByRole("group");
    const ok = new File(["%PDF"], "a.pdf", { type: "application/pdf" });
    const exe = new File(["x"], "b.exe", { type: "application/x-msdownload" });
    const big = new File([new Uint8Array(2000)], "big.png", { type: "image/png" });
    const small = new File(["x"], "c.png", { type: "image/png" });
    fireEvent.drop(zone, { dataTransfer: { files: [ok, exe, big, small] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0]![0]).toEqual([ok, small]);
    expect(onReject).toHaveBeenCalledWith([
      { file: exe, reason: "type" },
      { file: big, reason: "size" },
    ]);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("b.exe");
    expect(status).toHaveTextContent("big.png");

    // The picker path is filtered too (the browser's accept is only a hint); all rejected → no onFiles.
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    await userEvent.setup({ applyAccept: false }).upload(input, [exe]);
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onReject).toHaveBeenLastCalledWith([{ file: exe, reason: "type" }]);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("matchesAccept", () => {
  const file = (name: string, type: string) => new File(["x"], name, { type });
  it.each([
    ["a.PDF", "", ".pdf", true],
    ["a.pdf", "application/pdf", "image/*", false],
    ["p.jpg", "image/jpeg", "image/*, .pdf", true],
    ["d.json", "application/json", "application/json", true],
    ["d.json", "application/json", "", true],
    ["x.bin", "application/octet-stream", "*/*", true],
    ["x.bin", "application/octet-stream", ".pdf,text/plain", false],
  ])("%s (%s) against %j → %s", (name, type, accept, expected) => {
    expect(matchesAccept(file(name, type), accept)).toBe(expected);
  });
});

describe("CopyField", () => {
  it("copies the value to the clipboard and announces it", async () => {
    const user = userEvent.setup(); // installs a clipboard stub
    const secret = "sk_live_abc123_topsecret";
    const { container } = render(<CopyField label="API key" value={secret} description="It won't be shown again." />);
    expect(screen.getByRole("group", { name: "API key" })).toHaveAccessibleDescription("It won't be shown again.");
    expect(screen.getByText(secret)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy API key" }));
    expect(await navigator.clipboard.readText()).toBe(secret);
    expect(await screen.findByRole("status")).toHaveTextContent("API key copied to clipboard");
    expect(screen.getByRole("button", { name: "Copied API key" })).toHaveTextContent("Copied");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("announces a failure when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
    render(<CopyField label="Token" value="abc" />);
    await user.click(screen.getByRole("button", { name: "Copy Token" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Couldn't copy");
  });
});

describe("Table and Alert", () => {
  it("renders captions, column headers and sr-only Actions for empty headers", () => {
    render(
      <Table caption="Documents" columns={["Name", { label: "Size", numeric: true }, ""]}>
        <Tr>
          <Td>a.pdf</Td>
          <Td numeric>1 KB</Td>
          <Td>
            <button type="button">Delete a.pdf</button>
          </Td>
        </Tr>
      </Table>,
    );
    const table = screen.getByRole("table", { name: "Documents" });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(["Name", "Size", "Actions"]);
    expect(headers[1]).toHaveAttribute("data-numeric");
  });

  it("becomes a focusable region named by the caption only when it overflows", () => {
    const observers: (() => void)[] = [];
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(cb: () => void) {
        observers.push(cb);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    try {
      const { container } = render(
        <Table caption="Wide table" columns={["A", "B"]}>
          <Tr>
            <Td>1</Td>
            <Td>2</Td>
          </Tr>
        </Table>,
      );
      const wrap = container.firstElementChild as HTMLElement;
      expect(wrap).not.toHaveAttribute("tabindex");
      expect(screen.queryByRole("region")).toBeNull();
      // Simulate a table wider than its wrapper (e.g. on a phone).
      Object.defineProperty(wrap, "scrollWidth", { configurable: true, value: 800 });
      Object.defineProperty(wrap, "clientWidth", { configurable: true, value: 320 });
      act(() => observers.forEach((cb) => cb()));
      const region = screen.getByRole("region", { name: "Wide table" });
      expect(region).toBe(wrap);
      expect(region).toHaveAttribute("tabindex", "0");
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it("uses role=alert for danger and role=status otherwise", () => {
    render(
      <>
        <Alert tone="danger">Broken</Alert>
        <Alert tone="success">Saved</Alert>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Broken");
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});
