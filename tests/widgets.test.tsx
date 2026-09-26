import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Alert } from "@/registry/bitop/ui/alert/alert";
import { CopyField } from "@/registry/bitop/ui/copy-field/copy-field";
import { DropZone } from "@/registry/bitop/ui/drop-zone/drop-zone";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";

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
