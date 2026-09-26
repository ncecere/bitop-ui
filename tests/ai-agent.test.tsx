/*
 * Behaviour tests for the agent UI items and the smaller AI helpers.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Attachment, Attachments, formatBytes } from "@/registry/bitop/ui/attachments/attachments";
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtStep } from "@/registry/bitop/ui/chain-of-thought/chain-of-thought";
import { Checkpoint } from "@/registry/bitop/ui/checkpoint/checkpoint";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
  type ConfirmationState,
} from "@/registry/bitop/ui/confirmation/confirmation";
import { Context } from "@/registry/bitop/ui/context/context";
import { Loader } from "@/registry/bitop/ui/loader/loader";
import { ModelSelector, type ModelOption } from "@/registry/bitop/ui/model-selector/model-selector";
import { Plan, PlanContent, PlanHeader, PlanStep } from "@/registry/bitop/ui/plan/plan";
import { PromptInput, PromptInputAttachButton, PromptInputAttachments, PromptInputSubmit, PromptInputTextarea } from "@/registry/bitop/ui/prompt-input/prompt-input";
import { Queue, QueueContent, QueueHeader, QueueItem } from "@/registry/bitop/ui/queue/queue";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/registry/bitop/ui/sources/sources";
import { Suggestion, Suggestions } from "@/registry/bitop/ui/suggestion/suggestion";

describe("Sources and Suggestions", () => {
  it("toggles the list and names sources with their number", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Sources>
        <SourcesTrigger count={2} />
        <SourcesContent>
          <Source index={1} title="Leave policy" href="https://handbook.example.com/leave" />
          <Source index={2} title="notes.pdf" meta="Uploaded" />
        </SourcesContent>
      </Sources>,
    );
    const trigger = screen.getByRole("button", { name: "Used 2 sources" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const list = screen.getByRole("list", { name: "Sources" });
    const link = within(list).getByRole("link");
    expect(link.textContent).toMatch(/Source\s*1:\s*Leave policy/);
    expect(link).toHaveAttribute("target", "_blank");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes the suggestion to onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Suggestions>
        <Suggestion suggestion="Summarise this" onSelect={onSelect} />
      </Suggestions>,
    );
    expect(screen.getByRole("group", { name: "Suggestions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Summarise this" }));
    expect(onSelect).toHaveBeenCalledWith("Summarise this");
  });
});

describe("ChainOfThought and Plan", () => {
  it("speaks each step's status and marks the active step", async () => {
    const { container } = render(
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          <ChainOfThoughtStep label="Searched" />
          <ChainOfThoughtStep label="Reading" status="active" />
          <ChainOfThoughtStep label="Answer" status="pending" />
        </ChainOfThoughtContent>
      </ChainOfThought>,
    );
    const items = within(screen.getByRole("list", { name: "Steps" })).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["Searched (complete)", "Reading (in progress)", "Answer (not started)"]);
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names the plan by its title and marks it busy while streaming", async () => {
    const { container } = render(
      <Plan streaming>
        <PlanHeader title="Migrate billing" />
        <PlanContent>
          <PlanStep status="complete">Snapshot</PlanStep>
        </PlanContent>
      </Plan>,
    );
    const region = screen.getByRole("region", { name: "Migrate billing" });
    expect(region).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Show steps" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listitem")).toHaveTextContent("Snapshot (done)");
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Confirmation", () => {
  it("announces the outcome and keeps focus in the card", async () => {
    const user = userEvent.setup();
    function Approve() {
      const [state, setState] = useState<ConfirmationState>("requested");
      return (
        <Confirmation state={state}>
          <ConfirmationTitle>Send the email?</ConfirmationTitle>
          <ConfirmationRequest>It goes to 42 people.</ConfirmationRequest>
          <ConfirmationAccepted>Approved.</ConfirmationAccepted>
          <ConfirmationRejected>Rejected.</ConfirmationRejected>
          <ConfirmationActions>
            <ConfirmationAction variant="secondary" onClick={() => setState("rejected")}>
              Reject
            </ConfirmationAction>
            <ConfirmationAction onClick={() => setState("accepted")}>Approve</ConfirmationAction>
          </ConfirmationActions>
        </Confirmation>
      );
    }
    const { container } = render(<Approve />);
    const group = screen.getByRole("group", { name: "Send the email?" });
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Approve" }));
    expect(screen.getByRole("status")).toHaveTextContent("Approved.");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    await waitFor(() => expect(group).toHaveFocus());
  });
});

describe("Context", () => {
  it("puts the numbers in the trigger's name and shows a meter", async () => {
    const user = userEvent.setup();
    render(<Context usedTokens={42_000} maxTokens={200_000} usage={{ input: 30_000, output: 12_000 }} cost={{ total: 0.25 }} />);
    const trigger = screen.getByRole("button", { name: "Context window: 21% used, 42,000 of 200,000 tokens" });
    await user.click(trigger);
    const card = await screen.findByRole("dialog", { name: "Context window" });
    expect(within(card).getByRole("meter")).toHaveAttribute("aria-valuenow", "42000");
    expect(within(card).getByText("Input")).toBeInTheDocument();
    expect(within(card).getByText("$0.25")).toBeInTheDocument();
    expect(await axe(card)).toHaveNoViolations();
  });
});

describe("ModelSelector", () => {
  const models: ModelOption[] = [
    { id: "a", name: "Alpha", provider: "Acme", capabilities: ["vision"] },
    { id: "b", name: "Beta", provider: "Acme" },
    { id: "g", name: "Gamma", provider: "Other", capabilities: ["tools"] },
  ];

  it("filters by typing and selects with the keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ModelSelector label="Model" models={models} defaultValue="a" onValueChange={onValueChange} />);
    const trigger = screen.getByRole("combobox", { name: "Model: Alpha" });
    await user.click(trigger);
    const search = await screen.findByRole("combobox", { name: "Search models" });
    await waitFor(() => expect(search).toHaveFocus());
    expect(screen.getByText("Acme")).toBeInTheDocument();
    await user.type(search, "tools");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("g", models[2]);
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Model: Gamma" })).toBeInTheDocument());
  });
});

describe("Attachments", () => {
  it("formats sizes and names remove buttons", async () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(48_000_000)).toBe("46 MB");
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(
      <Attachments>
        <Attachment file={{ id: "1", name: "report.pdf", size: 2048, type: "application/pdf" }} onRemove={onRemove} />
        <Attachment file={{ id: "2", name: "big.zip", status: "error" }} />
      </Attachments>,
    );
    expect(screen.getByRole("list", { name: "Attachments" })).toBeInTheDocument();
    expect(screen.getByText("PDF · 2 KB")).toBeInTheDocument();
    expect(screen.getByText("Upload failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove report.pdf" }));
    expect(onRemove).toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PromptInput collects files from the picker, validates them and sends them", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onSubmit = vi.fn();
    const onFileError = vi.fn();
    const { container } = render(
      <PromptInput attachments accept=".pdf,image/*" maxFiles={2} onFileError={onFileError} onSubmit={onSubmit}>
        <PromptInputAttachments />
        <PromptInputTextarea />
        <PromptInputAttachButton />
        <PromptInputSubmit />
      </PromptInput>,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(input, "click");
    await user.click(screen.getByRole("button", { name: "Attach files" }));
    expect(click).toHaveBeenCalled();
    await user.upload(input, [new File(["%PDF"], "a.pdf", { type: "application/pdf" }), new File(["x"], "b.exe", { type: "application/x-msdownload" })]);
    expect(onFileError).toHaveBeenCalledWith(expect.objectContaining({ code: "accept" }));
    expect(screen.getByRole("list", { name: "Attachments" })).toHaveTextContent("a.pdf");
    // A file alone can be sent.
    await user.click(screen.getByRole("button", { name: "Send message" }));
    expect(onSubmit.mock.calls[0]![0].files.map((f: File) => f.name)).toEqual(["a.pdf"]);
    await waitFor(() => expect(screen.queryByRole("list", { name: "Attachments" })).not.toBeInTheDocument());
  });

  it("PromptInput clears only what was sent when an async send resolves", async () => {
    const user = userEvent.setup();
    let resolve!: () => void;
    const onSubmit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const { container } = render(
      <PromptInput attachments onSubmit={onSubmit}>
        <PromptInputAttachments />
        <PromptInputTextarea />
        <PromptInputSubmit />
      </PromptInput>,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const box = screen.getByRole("textbox", { name: "Message" });

    await user.upload(input, new File(["%PDF"], "sent.pdf", { type: "application/pdf" }));
    await user.type(box, "first{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // While the send is pending, the user starts the next message.
    await user.upload(input, new File(["%PDF"], "next.pdf", { type: "application/pdf" }));
    await user.type(box, " and more");
    await act(async () => resolve());

    const list = screen.getByRole("list", { name: "Attachments" });
    expect(list).toHaveTextContent("next.pdf");
    expect(list).not.toHaveTextContent("sent.pdf");
    expect(box).toHaveValue("first and more");
  });
});

describe("Queue, Checkpoint, Loader", () => {
  it("says which items are done", async () => {
    const { container } = render(
      <Queue defaultOpen>
        <QueueHeader title="To-dos" count={2} />
        <QueueContent label="To-dos">
          <QueueItem completed>Read</QueueItem>
          <QueueItem>Write</QueueItem>
        </QueueContent>
      </Queue>,
    );
    expect(screen.getByRole("button", { name: "To-dos 2 items" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("listitem").map((i) => i.textContent)).toEqual(["Read (done)", "Write"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("names the checkpoint and its restore button", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    render(<Checkpoint time="10:42" onRestore={onRestore} />);
    expect(screen.getByRole("group", { name: "Checkpoint 10:42" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore checkpoint 10:42" }));
    expect(onRestore).toHaveBeenCalled();
  });

  it("is decorative unless labelled", () => {
    const { container, rerender } = render(<Loader />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    rerender(<Loader label="Waiting" />);
    expect(screen.getByRole("status")).toHaveTextContent("Waiting");
  });
});
