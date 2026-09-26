import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Question, type QuestionResponse, type QuestionState } from "@/registry/bitop/ui/question/question";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./question.tsx?raw";

export function SingleChoice() {
  const [state, setState] = useState<QuestionState>("pending");
  const [answer, setAnswer] = useState<QuestionResponse | null>(null);
  return (
    <div className={styles.stack}>
      <Question
        prompt="Which environment should I deploy the fix to?"
        description="Production deploys need a second reviewer."
        options={[
          { value: "staging", label: "Staging", description: "Safe to try; resets nightly." },
          { value: "production", label: "Production" },
        ]}
        allowOther
        state={state}
        onSubmit={(response) => {
          setAnswer(response);
          setState("answered");
        }}
        onSkip={() => setState("skipped")}
      />
      {state !== "pending" && (
        <p className={styles.muted}>
          {answer ? `Sent: ${JSON.stringify(answer)} ` : "Skipped. "}
          <Button
            variant="link"
            onClick={() => {
              setAnswer(null);
              setState("pending");
            }}
          >
            Ask again
          </Button>
        </p>
      )}
    </div>
  );
}

export function MultipleChoice() {
  const [sent, setSent] = useState("");
  return (
    <div className={styles.stack}>
      <Question
        type="multiple"
        prompt="Which checks should run before the release?"
        options={[
          { value: "unit", label: "Unit tests" },
          { value: "e2e", label: "End-to-end tests", description: "About 12 minutes." },
          { value: "a11y", label: "Accessibility audit" },
        ]}
        allowOther
        placeholder="e.g. load test"
        labels={{ submit: "Run checks" }}
        onSubmit={(response) => setSent(JSON.stringify(response))}
      />
      {sent && <p className={styles.muted}>Sent: {sent}</p>}
    </div>
  );
}

export function Freeform() {
  const [sent, setSent] = useState("");
  return (
    <div className={styles.stack}>
      <Question
        type="freeform"
        prompt="What should the release notes say about this change?"
        description="One or two sentences for customers."
        placeholder="Faster search results on large knowledge bases…"
        onSubmit={(response) => setSent(response.text ?? "")}
        onSkip={() => setSent("(the agent will write it)")}
        labels={{ skip: "Let the agent write it" }}
      />
      {sent && <p className={styles.muted}>Sent: {sent}</p>}
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "question",
  title: "Question",
  category: "AI",
  description:
    "A question the agent asks the user, answered inline: single choice, multiple choice or free text, with an optional Other answer and submit / skip callbacks. Built from RadioGroup, CheckboxGroup, Field, Input and Button.",
  imports: `import { Question, QuestionFields } from "@/components/ui/question/question";`,
  examples: examples(raw, [
    ["SingleChoice", SingleChoice, { title: "Single choice with Other, answered state", wide: true }],
    ["MultipleChoice", MultipleChoice, { title: "Multiple choice", wide: true }],
    ["Freeform", Freeform, { title: "Freeform answer", wide: true }],
  ]),
  props: [
    {
      component: "Question",
      note: "A <form>; also accepts form props (except onSubmit, which receives the answer).",
      rows: [
        { name: "prompt", type: "ReactNode", required: true, description: "The question; names the form and the choice group (or text box)." },
        { name: "type", type: '"single" | "multiple" | "freeform"', default: '"single"', description: "Radio group, checkbox group or text box." },
        { name: "options", type: "{ value, label, description?, disabled? }[]", description: "The choices (single / multiple)." },
        { name: "allowOther", type: "boolean", description: 'Adds an "Other" choice that reveals a text input.' },
        { name: "description", type: "ReactNode", description: "Help text under the prompt." },
        { name: "placeholder", type: "string", description: "Placeholder for the freeform / Other text." },
        { name: "value / defaultValue / onValueChange", type: "{ selected: string[]; other: boolean; text: string }", description: "Controlled or uncontrolled answer in progress." },
        { name: "onSubmit", type: "(response: { selected: string[]; text?: string }) => void", description: "Called with the answer; empty submissions show an error instead." },
        { name: "onSkip", type: "() => void", description: "Shows a Skip button." },
        { name: "state", type: '"pending" | "answered" | "skipped"', default: '"pending"', description: "Answered / skipped lock the controls and announce the outcome." },
        { name: "headingLevel", type: "2 – 6", description: "Render the prompt as a heading." },
        { name: "labels", type: "Partial<QuestionLabels>", description: "submit, skip, required, answered, skipped, other, otherInput." },
        { name: "disabled", type: "boolean", description: "Disables the controls and actions." },
      ],
    },
    {
      component: "QuestionFields",
      note: "Just the answer controls (no form or actions), for building flows like Questionnaire. Also exported: isQuestionAnswered, toQuestionResponse, EMPTY_QUESTION_VALUE.",
      rows: [
        { name: "prompt", type: "ReactNode", required: true, description: "The question." },
        { name: "value / onValueChange", type: "QuestionValue / (value) => void", required: true, description: "Always controlled." },
        { name: "error", type: "ReactNode", description: "Marks the group invalid and shows the message." },
        { name: "headingRef", type: "Ref<HTMLHeadingElement>", description: "With headingLevel, a ref to the heading (to move focus to it)." },
      ],
    },
  ],
  a11y: [
    "The form is named by the prompt. Single choice is a radiogroup and multiple choice a group of checkboxes, each with the prompt as its legend; freeform is a text box labelled by the prompt.",
    "The Other text input appears only while Other is picked and has its own visible label.",
    "Submitting without an answer shows an error on the group (aria-invalid, described) and moves focus to the first choice or the text box.",
    'Once answered or skipped, the controls are disabled, the actions are removed, a role="status" message announces the outcome, and focus moves to the card if it was on a removed button. The state is shown by text and icon, not colour alone.',
  ],
};

export default doc;
