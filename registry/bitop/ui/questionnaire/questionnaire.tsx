"use client";

import { type ComponentPropsWithRef, type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Progress } from "@/registry/bitop/ui/progress/progress";
import {
  EMPTY_QUESTION_VALUE,
  type QuestionChoice,
  type QuestionFieldsLabels,
  QuestionFields,
  type QuestionResponse,
  type QuestionType,
  type QuestionValue,
  focusFirstAnswerControl,
  isQuestionAnswered,
  toQuestionResponse,
} from "@/registry/bitop/ui/question/question";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./questionnaire.module.css";

/*
 * Questionnaire: a multi-step flow over questions, one per step.
 *
 *   <Questionnaire
 *     label="Project setup"
 *     questions={[
 *       { id: "region", prompt: "Where should it run?", options: regions },
 *       { id: "features", prompt: "What do you need?", type: "multiple", options: features },
 *       { id: "notes", prompt: "Anything else?", type: "freeform", optional: true },
 *     ]}
 *     onSubmit={(answers) => save(answers)}
 *   />
 *
 * Each step shows a progress bar ("Question 2 of 3"), the question (built with
 * QuestionFields from the question item) and Back / Skip / Next actions. Next
 * on an unanswered required question shows an error and focuses the answer
 * control. After the last question a review step lists every answer with an
 * Edit button (turn it off with `review={false}`), then Submit calls
 * `onSubmit` with `{ [id]: { selected, text? } | null }` (null = skipped).
 * Whenever the step changes, focus moves to the new step's heading. Answers
 * and the step can each be controlled or uncontrolled.
 */

export type QuestionnaireQuestion = {
  /** Unique key; used in the answers record. */
  id: string;
  prompt: ReactNode;
  description?: ReactNode;
  type?: QuestionType;
  options?: QuestionChoice[];
  allowOther?: boolean;
  placeholder?: string;
  /** May be skipped (shows a Skip button, and Next works without an answer). */
  optional?: boolean;
};

/** In-progress answers, keyed by question id. */
export type QuestionnaireAnswers = Record<string, QuestionValue>;
/** Submitted answers, keyed by question id; null when skipped. */
export type QuestionnaireResult = Record<string, QuestionResponse | null>;

export type QuestionnaireLabels = QuestionFieldsLabels & {
  back: string;
  next: string;
  skip: string;
  submit: string;
  /** Progress bar label. */
  progress: (current: number, total: number) => string;
  review: string;
  reviewDescription: string;
  edit: string;
  skipped: string;
  /** Error for an unanswered required question. */
  required: string;
};

const DEFAULT_LABELS: QuestionnaireLabels = {
  other: "Other",
  otherInput: "Your answer",
  back: "Back",
  next: "Next",
  skip: "Skip",
  submit: "Submit",
  progress: (current, total) => `Question ${current} of ${total}`,
  review: "Review your answers",
  reviewDescription: "Check your answers before you submit.",
  edit: "Edit",
  skipped: "Skipped",
  required: "Answer this question to continue.",
};

export type QuestionnaireProps = Omit<ComponentPropsWithRef<"form">, "onSubmit" | "defaultValue" | "onChange" | "children"> & {
  /** Accessible name of the questionnaire (names the form). */
  label: string;
  questions: QuestionnaireQuestion[];
  value?: QuestionnaireAnswers;
  defaultValue?: QuestionnaireAnswers;
  onValueChange?: (answers: QuestionnaireAnswers) => void;
  /** Current step: 0 … questions.length − 1, or questions.length for the review step. */
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Show a review step with every answer before submitting. */
  review?: boolean;
  onSubmit?: (result: QuestionnaireResult) => void;
  /** Level of the step headings. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  labels?: Partial<QuestionnaireLabels>;
  className?: string;
};

export function Questionnaire({
  label,
  questions,
  value: valueProp,
  defaultValue = {},
  onValueChange,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  review = true,
  onSubmit,
  headingLevel = 2,
  labels: labelsProp,
  className,
  ...props
}: QuestionnaireProps) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const [innerAnswers, setInnerAnswers] = useState(defaultValue);
  const answers = valueProp ?? innerAnswers;
  const [innerStep, setInnerStep] = useState(defaultStep);
  const total = questions.length;
  const lastStep = review ? total : total - 1;
  const step = Math.min(Math.max(stepProp ?? innerStep, 0), Math.max(lastStep, 0));
  const [errorFor, setErrorFor] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);
  const userRef = props.ref;
  const setFormRef = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (typeof userRef === "function") userRef(node);
      else if (userRef) userRef.current = node;
    },
    [userRef],
  );
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const shownStep = useRef(step);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    headingRef.current?.focus();
  }, [step]);

  const onReview = review && step === total;
  const question = onReview ? undefined : questions[step];
  const valueOf = (id: string) => answers[id] ?? EMPTY_QUESTION_VALUE;

  function setAnswer(id: string, next: QuestionValue) {
    const all = { ...answers, [id]: next };
    if (valueProp === undefined) setInnerAnswers(all);
    onValueChange?.(all);
    if (errorFor === id) setErrorFor(null);
  }

  function goTo(next: number) {
    setErrorFor(null);
    if (stepProp === undefined) setInnerStep(next);
    onStepChange?.(next);
  }

  function result(): QuestionnaireResult {
    const out: QuestionnaireResult = {};
    for (const q of questions) {
      const v = valueOf(q.id);
      const type = q.type ?? "single";
      out[q.id] = isQuestionAnswered(type, v) ? toQuestionResponse(type, v) : null;
    }
    return out;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (question) {
      if (!question.optional && !isQuestionAnswered(question.type ?? "single", valueOf(question.id))) {
        setErrorFor(question.id);
        focusFirstAnswerControl(formRef.current?.querySelector<HTMLElement>("[data-questionnaire-step]") ?? null);
        return;
      }
      if (step < lastStep) {
        goTo(step + 1);
        return;
      }
    }
    onSubmit?.(result());
  }

  const Heading = `h${headingLevel}` as const;
  const isFinal = step === lastStep;

  return (
    <form
      {...props}
      ref={setFormRef}
      noValidate
      aria-label={label}
      className={cx(styles.root, className)}
      onSubmit={handleSubmit}
    >
      <Progress
        label={onReview ? labels.review : labels.progress(step + 1, total)}
        value={onReview ? total : step + 1}
        max={Math.max(total, 1)}
        showValue={false}
        size="sm"
        className={styles.progress}
      />

      <div className={styles.step} data-questionnaire-step="" key={onReview ? "review" : question?.id}>
        {question ? (
          <QuestionFields
            prompt={question.prompt}
            description={question.description}
            type={question.type}
            options={question.options}
            allowOther={question.allowOther}
            placeholder={question.placeholder}
            name={question.id}
            value={valueOf(question.id)}
            onValueChange={(v) => setAnswer(question.id, v)}
            error={errorFor === question.id ? labels.required : undefined}
            headingLevel={headingLevel}
            headingRef={headingRef}
            labels={labels}
          />
        ) : (
          <div className={styles.review}>
            <Heading ref={headingRef} tabIndex={-1} className={styles.heading}>
              {labels.review}
            </Heading>
            <p className={styles.description}>{labels.reviewDescription}</p>
            <dl className={styles.summary}>
              {questions.map((q, index) => (
                <div key={q.id} className={styles.summaryRow}>
                  <dt className={styles.summaryPrompt}>{q.prompt}</dt>
                  <dd className={styles.summaryAnswer}>
                    <AnswerText question={q} value={valueOf(q.id)} skipped={labels.skipped} />
                  </dd>
                  <dd className={styles.summaryEdit}>
                    <Button type="button" variant="link" size="sm" onClick={() => goTo(index)}>
                      {labels.edit}{" "}
                      <span className="sr-only">{q.prompt}</span>
                    </Button>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        {step > 0 && (
          <Button type="button" variant="secondary" onClick={() => goTo(step - 1)} className={styles.back}>
            {labels.back}
          </Button>
        )}
        {question?.optional && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setAnswer(question.id, EMPTY_QUESTION_VALUE);
              if (step < lastStep) goTo(step + 1);
              else onSubmit?.({ ...result(), [question.id]: null });
            }}
          >
            {labels.skip}
          </Button>
        )}
        <Button type="submit">{isFinal ? labels.submit : labels.next}</Button>
      </div>
    </form>
  );
}

function AnswerText({ question, value, skipped }: { question: QuestionnaireQuestion; value: QuestionValue; skipped: string }) {
  const type = question.type ?? "single";
  if (!isQuestionAnswered(type, value)) return <span className={styles.skipped}>{skipped}</span>;
  const response = toQuestionResponse(type, value);
  const parts: ReactNode[] = response.selected.map((v) => question.options?.find((o) => o.value === v)?.label ?? v);
  if (response.text) parts.push(response.text);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && ", "}
          {p}
        </span>
      ))}
    </>
  );
}
