import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { axe } from "vitest-axe";
import { Calendar, type DateRange, parseISODate, toISODate } from "@/registry/bitop/ui/calendar/calendar";
import { DatePicker } from "@/registry/bitop/ui/date-picker/date-picker";
import { Field } from "@/registry/bitop/ui/field/field";
import { EMPTY_QUESTION_VALUE, Question, type QuestionState, type QuestionValue } from "@/registry/bitop/ui/question/question";
import { Questionnaire, type QuestionnaireAnswers, type QuestionnaireQuestion } from "@/registry/bitop/ui/questionnaire/questionnaire";

const TODAY = new Date(2026, 8, 26); // Saturday, September 26, 2026

const day = (name: RegExp | string) => screen.getByRole("button", { name });

describe("Calendar", () => {
  it("renders a labelled grid with Intl weekday / month names and marks today", async () => {
    const { container } = render(<Calendar today={TODAY} locale="en-US" />);
    const grid = screen.getByRole("grid", { name: "September 2026" });
    expect(within(grid).getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(screen.getByText("September 2026")).toHaveAttribute("aria-live", "polite");
    const today = day("Saturday, September 26, 2026");
    expect(today).toHaveAttribute("aria-current", "date");
    // Only one day is tabbable (roving tabindex): today, when nothing is selected.
    const tabbable = container.querySelectorAll('[data-date][tabindex="0"]');
    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toBe(today);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("localises and honours weekStartsOn", () => {
    render(<Calendar today={TODAY} locale="de-DE" weekStartsOn={1} />);
    const grid = screen.getByRole("grid", { name: "September 2026" });
    expect(within(grid).getAllByRole("columnheader")[0]).toHaveAttribute("abbr", "Montag");
  });

  it("selects a single date (uncontrolled) and exposes aria-selected on the cell", async () => {
    const onValueChange = vi.fn();
    render(<Calendar today={TODAY} onValueChange={onValueChange} />);
    await userEvent.click(day("Thursday, September 10, 2026"));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 8, 10));
    const selected = day("Thursday, September 10, 2026, selected");
    expect(selected.closest("td")).toHaveAttribute("aria-selected", "true");
    expect(selected).toHaveAttribute("tabindex", "0");
    // Clicking again clears it unless `required`.
    await userEvent.click(selected);
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it("supports the APG date-grid keyboard model", async () => {
    render(<Calendar today={TODAY} />);
    const user = userEvent.setup();
    await user.tab();
    await user.tab(); // past the previous / next month buttons
    await user.tab();
    expect(day("Saturday, September 26, 2026")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(day("Friday, September 25, 2026")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(day("Friday, October 2, 2026")).toHaveFocus();
    // Crossing into October moved the grid.
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(day("Sunday, September 27, 2026")).toHaveFocus();
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument();
    await user.keyboard("{End}");
    expect(day("Saturday, October 3, 2026")).toHaveFocus();
    await user.keyboard("{PageUp}");
    expect(day("Thursday, September 3, 2026")).toHaveFocus();
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(day("Friday, September 3, 2027")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(day("Friday, August 27, 2027")).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(day("Friday, August 27, 2027, selected")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ }");
    expect(day("Saturday, August 28, 2027, selected")).toHaveFocus();
  });

  it("respects min / max and the disabled-date predicate", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        today={TODAY}
        min={new Date(2026, 8, 5)}
        max={new Date(2026, 8, 28)}
        isDateDisabled={(d) => d.getDay() === 0}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    const sunday = day("Sunday, September 13, 2026");
    expect(sunday).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(sunday);
    await userEvent.click(day("Thursday, September 3, 2026"));
    expect(onValueChange).not.toHaveBeenCalled();

    // Keyboard focus is clamped to the range.
    const user = userEvent.setup();
    act(() => day("Monday, September 28, 2026").focus());
    await user.keyboard("{ArrowRight}");
    expect(day("Monday, September 28, 2026")).toHaveFocus();
  });

  it("selects multiple dates, honouring maxSelected", async () => {
    function Multi() {
      const [value, setValue] = useState<Date[]>([]);
      return (
        <>
          <Calendar mode="multiple" today={TODAY} value={value} onValueChange={setValue} maxSelected={2} />
          <output>{value.map(toISODate).join(",")}</output>
        </>
      );
    }
    render(<Multi />);
    expect(screen.getByRole("grid")).toHaveAttribute("aria-multiselectable", "true");
    await userEvent.click(day("Tuesday, September 1, 2026"));
    await userEvent.click(day("Wednesday, September 2, 2026"));
    await userEvent.click(day("Thursday, September 3, 2026"));
    expect(screen.getByRole("status")).toHaveTextContent("2026-09-01,2026-09-02");
    await userEvent.click(day("Tuesday, September 1, 2026, selected"));
    expect(screen.getByRole("status")).toHaveTextContent(/^2026-09-02$/);
  });

  it("selects a range across two months", async () => {
    const onValueChange = vi.fn();
    function Range() {
      const [value, setValue] = useState<DateRange | null>(null);
      return (
        <Calendar
          mode="range"
          numberOfMonths={2}
          today={TODAY}
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange(v);
          }}
        />
      );
    }
    const { container } = render(<Range />);
    expect(screen.getAllByRole("grid")).toHaveLength(2);
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("grid", { name: "October 2026" })).getByRole("button", { name: "Monday, October 5, 2026" }));
    await userEvent.click(within(screen.getByRole("grid", { name: "September 2026" })).getByRole("button", { name: "Monday, September 28, 2026" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: new Date(2026, 8, 28), to: new Date(2026, 9, 5) });
    const middle = within(screen.getByRole("grid", { name: "October 2026" })).getByRole("button", { name: "Thursday, October 1, 2026, selected" });
    expect(middle).toHaveAttribute("data-range-middle");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("navigates months with buttons and the month / year dropdowns (controlled month)", async () => {
    const onMonthChange = vi.fn();
    function Controlled() {
      const [month, setMonth] = useState(new Date(2026, 8, 1));
      return (
        <Calendar
          today={TODAY}
          month={month}
          captionLayout="dropdown"
          yearRange={[2020, 2030]}
          onMonthChange={(m) => {
            setMonth(m);
            onMonthChange(m);
          }}
        />
      );
    }
    const { container } = render(<Controlled />);
    await userEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(onMonthChange).toHaveBeenLastCalledWith(new Date(2026, 9, 1));
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Year" }), "2028");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Month" }), "February");
    expect(screen.getByRole("grid", { name: "February 2028" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tuesday, February 29, 2028" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("can hide outside days", () => {
    const { container } = render(<Calendar today={TODAY} showOutsideDays={false} />);
    expect(container.querySelectorAll("[data-outside][data-date]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Monday, August 31, 2026" })).not.toBeInTheDocument();
  });

  it("parses and formats ISO dates in local time", () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("2026-02-28")).toEqual(new Date(2026, 1, 28));
  });
});

describe("DatePicker", () => {
  it("works inside a Field: labelled, described, value in the name, focus returns to the trigger", async () => {
    const onValueChange = vi.fn();
    const { container } = render(
      <form aria-label="Rollout">
        <Field label="Start date" description="The first day of the rollout.">
          <DatePicker name="start" today={TODAY} locale="en-US" onValueChange={onValueChange} />
        </Field>
      </form>,
    );
    const trigger = screen.getByRole("button", { name: "Start date Pick a date" });
    expect(trigger).toHaveAccessibleDescription("The first day of the rollout.");
    expect(screen.getByText("Start date")).toHaveAttribute("for", trigger.id);
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Choose date" });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Saturday, September 26, 2026" })).toHaveFocus());
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 8, 27));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName("Start date Sep 27, 2026");
    expect(new FormData(container.querySelector("form")!).get("start")).toBe("2026-09-27");
  });

  it("marks the trigger invalid with a Field error", () => {
    render(
      <Field label="Due date" error="Pick a due date">
        <DatePicker today={TODAY} />
      </Field>,
    );
    const trigger = screen.getByRole("button", { name: /Due date/ });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Pick a due date");
  });

  it("closes with Escape and returns focus to the trigger", async () => {
    render(<DatePicker aria-label="Launch day" today={TODAY} defaultValue={new Date(2026, 8, 3)} formatOptions={{ dateStyle: "long" }} locale="en-US" />);
    const trigger = screen.getByRole("button", { name: "Launch day September 3, 2026" });
    const user = userEvent.setup();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Thursday, September 3, 2026, selected" })).toHaveFocus());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("picks a range (controlled) and closes once both ends are chosen", async () => {
    const onValueChange = vi.fn();
    function RangePicker() {
      const [value, setValue] = useState<DateRange | null>(null);
      return (
        <DatePicker
          mode="range"
          aria-label="Report period"
          name="period"
          today={TODAY}
          locale="en-US"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            onValueChange(v);
          }}
        />
      );
    }
    const { container } = render(
      <form aria-label="Report">
        <RangePicker />
      </form>,
    );
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Report period Pick a date range" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "Choose dates" });
    await user.click(within(dialog).getByRole("button", { name: "Tuesday, September 8, 2026" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Friday, September 18, 2026" }));
    expect(onValueChange).toHaveBeenLastCalledWith({ from: new Date(2026, 8, 8), to: new Date(2026, 8, 18) });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAccessibleName("Report period Sep 8, 2026 – Sep 18, 2026");
    expect(new FormData(container.querySelector("form")!).get("period")).toBe("2026-09-08/2026-09-18");
  });
});

describe("Question", () => {
  const options = [
    { value: "staging", label: "Staging" },
    { value: "prod", label: "Production", description: "Requires approval" },
  ];

  it("asks a single-choice question and submits the answer", async () => {
    const onSubmit = vi.fn();
    const { container } = render(<Question prompt="Which environment should I deploy to?" options={options} onSubmit={onSubmit} />);
    expect(screen.getByRole("form", { name: "Which environment should I deploy to?" })).toBeInTheDocument();
    const group = screen.getByRole("radiogroup", { name: "Which environment should I deploy to?" });
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    await user.click(within(group).getByRole("radio", { name: "Production" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ selected: ["prod"], text: undefined });
  });

  it("shows an error and focuses the choices when submitted empty", async () => {
    const onSubmit = vi.fn();
    render(<Question prompt="Pick a region" options={options} onSubmit={onSubmit} labels={{ required: "Pick one to continue." }} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Pick one to continue.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Staging" })).toHaveFocus();
    await user.keyboard("{ }");
    expect(screen.queryByText("Pick one to continue.")).not.toBeInTheDocument();
  });

  it("supports multiple choice with an 'other' free-text answer (controlled)", async () => {
    const onSubmit = vi.fn();
    function Controlled() {
      const [value, setValue] = useState<QuestionValue>(EMPTY_QUESTION_VALUE);
      return <Question type="multiple" prompt="Which checks should run?" options={options} allowOther value={value} onValueChange={setValue} onSubmit={onSubmit} />;
    }
    const { container } = render(<Controlled />);
    const user = userEvent.setup();
    const group = screen.getByRole("group", { name: "Which checks should run?" });
    await user.click(within(group).getByRole("checkbox", { name: "Staging" }));
    expect(screen.queryByRole("textbox", { name: "Your answer" })).not.toBeInTheDocument();
    await user.click(within(group).getByRole("checkbox", { name: "Other" }));
    await user.type(screen.getByRole("textbox", { name: "Your answer" }), "  Load test  ");
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ selected: ["staging"], text: "Load test" });
  });

  it("takes a freeform answer and can be skipped", async () => {
    const onSubmit = vi.fn();
    const onSkip = vi.fn();
    render(<Question type="freeform" prompt="What should the release notes say?" description="One or two sentences." onSubmit={onSubmit} onSkip={onSkip} />);
    const box = screen.getByRole("textbox", { name: "What should the release notes say?" });
    expect(box).toHaveAccessibleDescription("One or two sentences.");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    await user.type(box, "Faster builds.");
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ selected: [], text: "Faster builds." });
  });

  it("locks and announces once answered, keeping focus in the card", async () => {
    function Flow() {
      const [state, setState] = useState<QuestionState>("pending");
      return <Question prompt="Deploy now?" options={options} defaultValue={{ selected: ["staging"], other: false, text: "" }} state={state} onSubmit={() => setState("answered")} />;
    }
    render(<Flow />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(screen.getByRole("status")).toHaveTextContent("Answered");
    expect(screen.queryByRole("button", { name: "Submit" })).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Deploy now?" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Staging" })).toHaveAttribute("aria-disabled", "true");
  });
});

describe("Questionnaire", () => {
  const questions: QuestionnaireQuestion[] = [
    { id: "region", prompt: "Where should the project run?", options: [{ value: "us", label: "United States" }, { value: "eu", label: "Europe" }] },
    { id: "features", prompt: "Which features do you need?", type: "multiple", options: [{ value: "search", label: "Search" }, { value: "chat", label: "Chat" }], allowOther: true },
    { id: "notes", prompt: "Anything else we should know?", type: "freeform", optional: true },
  ];

  it("walks through steps with progress, validation, focus on each heading, review and submit", async () => {
    const onSubmit = vi.fn();
    const onStepChange = vi.fn();
    const { container } = render(<Questionnaire label="Project setup" questions={questions} onSubmit={onSubmit} onStepChange={onStepChange} />);
    expect(screen.getByRole("form", { name: "Project setup" })).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Question 1 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Where should the project run?" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    const user = userEvent.setup();
    // Required: Next without an answer shows the error and focuses the choices.
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Answer this question to continue.")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "United States" })).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(screen.getByRole("progressbar", { name: "Question 2 of 3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Which features do you need?" })).toHaveFocus();
    await user.click(screen.getByRole("checkbox", { name: "Chat" }));
    await user.click(screen.getByRole("checkbox", { name: "Other" }));
    await user.type(screen.getByRole("textbox", { name: "Your answer" }), "Audit log{Enter}");

    // Enter in the text box moved on. The optional step can be skipped.
    expect(screen.getByRole("heading", { name: "Anything else we should know?" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Skip" }));

    expect(screen.getByRole("heading", { name: "Review your answers" })).toHaveFocus();
    expect(screen.getByRole("progressbar", { name: "Review your answers" })).toBeInTheDocument();
    expect(container.querySelector("dl")).toHaveTextContent("Where should the project run?Europe");
    expect(container.querySelector("dl")).toHaveTextContent("Chat, Audit log");
    expect(container.querySelector("dl")).toHaveTextContent("Skipped");
    expect(await axe(container)).toHaveNoViolations();

    // Edit jumps back to that step; Back returns.
    await user.click(screen.getByRole("button", { name: "Edit Where should the project run?" }));
    expect(screen.getByRole("heading", { name: "Where should the project run?" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Europe" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Where should the project run?" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmit).toHaveBeenCalledWith({
      region: { selected: ["eu"], text: undefined },
      features: { selected: ["chat"], text: "Audit log" },
      notes: null,
    });
  });

  it("supports a controlled step and answers without a review step", async () => {
    const onSubmit = vi.fn();
    function Controlled() {
      const [step, setStep] = useState(1);
      const [answers, setAnswers] = useState<QuestionnaireAnswers>({ region: { selected: ["us"], other: false, text: "" } });
      return (
        <Questionnaire
          label="Setup"
          questions={questions.slice(0, 2)}
          review={false}
          step={step}
          onStepChange={setStep}
          value={answers}
          onValueChange={setAnswers}
          headingLevel={3}
          onSubmit={onSubmit}
        />
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("heading", { level: 3, name: "Which features do you need?" })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("checkbox", { name: "Search" }));
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).toHaveBeenCalledWith({ region: { selected: ["us"], text: undefined }, features: { selected: ["search"], text: undefined } });
  });
});
