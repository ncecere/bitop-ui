import { useState } from "react";
import { Questionnaire, type QuestionnaireResult } from "@/registry/bitop/ui/questionnaire/questionnaire";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./questionnaire.tsx?raw";

export function ProjectSetup() {
  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  return (
    <div className={styles.stack}>
      <Questionnaire
        label="Project setup"
        headingLevel={4}
        questions={[
          {
            id: "goal",
            prompt: "What are you building?",
            description: "Pick the closest match or describe it.",
            options: [
              { value: "support", label: "Support assistant", description: "Answers from your help centre." },
              { value: "research", label: "Research assistant", description: "Searches and cites documents." },
            ],
            allowOther: true,
          },
          {
            id: "sources",
            prompt: "Which sources should it use?",
            type: "multiple",
            options: [
              { value: "docs", label: "Documentation site" },
              { value: "tickets", label: "Past support tickets" },
              { value: "drive", label: "Shared drive" },
            ],
          },
          {
            id: "notes",
            prompt: "Anything else we should know?",
            type: "freeform",
            optional: true,
            placeholder: "Compliance requirements, languages, launch date…",
          },
        ]}
        onSubmit={setResult}
      />
      {result && (
        <pre className={styles.muted}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function Controlled() {
  const [step, setStep] = useState(0);
  return (
    <div className={styles.stack}>
      <Questionnaire
        label="Feedback"
        headingLevel={4}
        step={step}
        onStepChange={setStep}
        review={false}
        labels={{ progress: (current, total) => `Step ${current} / ${total}`, submit: "Send feedback" }}
        questions={[
          {
            id: "rating",
            prompt: "How was the answer?",
            options: [
              { value: "good", label: "Helpful" },
              { value: "ok", label: "Partly helpful" },
              { value: "bad", label: "Not helpful" },
            ],
          },
          { id: "why", prompt: "What could be better?", type: "freeform", optional: true },
        ]}
        onSubmit={() => setStep(0)}
      />
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "questionnaire",
  title: "Questionnaire",
  category: "Forms",
  description:
    "A multi-step flow over questions: single choice, multiple choice, freeform and skippable questions, a progress bar, Back / Next, an optional review step and a submit callback.",
  imports: `import { Questionnaire } from "@/components/ui/questionnaire/questionnaire";`,
  examples: examples(raw, [
    ["ProjectSetup", ProjectSetup, { title: "With a review step", wide: true }],
    ["Controlled", Controlled, { title: "Controlled step, no review", wide: true }],
  ]),
  props: [
    {
      component: "Questionnaire",
      note: "A <form>; also accepts form props (except onSubmit, which receives the answers).",
      rows: [
        { name: "label", type: "string", required: true, description: "Accessible name of the form." },
        {
          name: "questions",
          type: "{ id, prompt, description?, type?, options?, allowOther?, placeholder?, optional? }[]",
          required: true,
          description: "One step per question. Optional questions get a Skip button.",
        },
        { name: "onSubmit", type: "(result: Record<id, { selected, text? } | null>) => void", description: "Called from the last step; null means skipped." },
        { name: "value / defaultValue / onValueChange", type: "Record<id, QuestionValue>", description: "Controlled or uncontrolled answers." },
        { name: "step / defaultStep / onStepChange", type: "number", default: "0", description: "Current step; questions.length is the review step." },
        { name: "review", type: "boolean", default: "true", description: "Show a review step listing every answer, with Edit buttons." },
        { name: "headingLevel", type: "2 – 6", default: "2", description: "Level of the step headings; match your page outline." },
        { name: "labels", type: "Partial<QuestionnaireLabels>", description: "back, next, skip, submit, progress(current, total), review, reviewDescription, edit, skipped, required, other, otherInput." },
      ],
    },
  ],
  a11y: [
    "The form is named by label. Progress is a named progressbar (\"Question 2 of 3\").",
    "Each step's prompt is a heading inside the group's legend, so it both names the radio / checkbox group and appears in the heading outline. When the step changes, focus moves to the new heading.",
    "Next on an unanswered required question shows an error on the group and focuses its first control; Enter in a text box moves to the next step.",
    'Back, Skip, Next and Submit are real buttons. The review step lists answers in a description list; each Edit button is named "Edit <question>".',
  ],
};

export default doc;
