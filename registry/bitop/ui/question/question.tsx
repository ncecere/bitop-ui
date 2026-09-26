"use client";

import { CircleCheck, CircleSlash, MessageCircleQuestion } from "lucide-react";
import {
  type ComponentPropsWithRef,
  type FormEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { Checkbox, CheckboxGroup } from "@/registry/bitop/ui/checkbox/checkbox";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input, Textarea } from "@/registry/bitop/ui/input/input";
import { RadioGroup } from "@/registry/bitop/ui/radio-group/radio-group";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./question.module.css";

/*
 * Question: a question the agent asks the user, answered inline in the chat.
 *
 *   <Question
 *     prompt="Which environment should I deploy to?"
 *     options={[{ value: "staging", label: "Staging" }, { value: "prod", label: "Production" }]}
 *     allowOther
 *     onSubmit={(answer) => send(answer)}
 *     onSkip={() => send(null)}
 *   />
 *
 * `type` picks the control: "single" (RadioGroup), "multiple" (CheckboxGroup)
 * or "freeform" (Textarea in a Field). `allowOther` adds an "Other" choice
 * with a text input. Submitting without an answer shows an error on the
 * group and moves focus to it. Once `state` is "answered" or "skipped" the
 * controls lock, the actions disappear, the outcome is announced, and focus
 * moves to the card if it was on a removed button.
 *
 * QuestionFields (just the controls) and the answer helpers are exported for
 * multi-step flows such as Questionnaire.
 */

export type QuestionType = "single" | "multiple" | "freeform";

export type QuestionChoice = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

/** The in-progress answer. `other` is true when the "Other" choice is picked; `text` is its text (or the freeform answer). */
export type QuestionValue = { selected: string[]; other: boolean; text: string };

/** The submitted answer: chosen option values plus the trimmed "Other" / freeform text, if any. */
export type QuestionResponse = { selected: string[]; text?: string };

export const EMPTY_QUESTION_VALUE: QuestionValue = { selected: [], other: false, text: "" };

const OTHER = "__bitop_question_other__";

/** Whether a value counts as an answer for the given question type. */
export function isQuestionAnswered(type: QuestionType, value: QuestionValue): boolean {
  const text = value.text.trim();
  if (type === "freeform") return text.length > 0;
  return value.selected.length > 0 || (value.other && text.length > 0);
}

/** Converts an in-progress value into the response handed to `onSubmit`. */
export function toQuestionResponse(type: QuestionType, value: QuestionValue): QuestionResponse {
  const text = value.text.trim();
  if (type === "freeform") return { selected: [], text: text || undefined };
  return { selected: value.selected, text: value.other && text ? text : undefined };
}

/** Moves focus to the first answer control that can take it (e.g. after a validation error). */
export function focusFirstAnswerControl(root: HTMLElement | null) {
  const controls = root?.querySelectorAll<HTMLElement>('[role="radio"], [role="checkbox"], textarea, input:not([type="hidden"])') ?? [];
  for (const el of controls) {
    if (el.tabIndex >= 0 && !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true" && el.getAttribute("aria-hidden") !== "true") {
      el.focus();
      return;
    }
  }
}

export type QuestionFieldsLabels = {
  /** Label of the "Other" choice. */
  other: string;
  /** Label of the text input shown when "Other" is picked. */
  otherInput: string;
};

export type QuestionFieldsProps = {
  /** The question. Names the group (or the text box for freeform questions). */
  prompt: ReactNode;
  description?: ReactNode;
  type?: QuestionType;
  options?: QuestionChoice[];
  /** Add an "Other" choice with a free-text answer. */
  allowOther?: boolean;
  /** Placeholder for the freeform / "Other" text box. */
  placeholder?: string;
  value: QuestionValue;
  onValueChange: (value: QuestionValue) => void;
  /** Validation message; marks the group invalid. */
  error?: ReactNode;
  disabled?: boolean;
  /** Render the prompt as a heading of this level (it stays the group's name). */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Ref to the heading (only with `headingLevel`), e.g. to move focus to it. */
  headingRef?: Ref<HTMLHeadingElement>;
  /** Form field name for the choices. */
  name?: string;
  labels?: Partial<QuestionFieldsLabels>;
  className?: string;
};

/** The answer controls for one question, without a form or actions. */
export function QuestionFields({
  prompt,
  description,
  type = "single",
  options = [],
  allowOther = false,
  placeholder,
  value,
  onValueChange,
  error,
  disabled,
  headingLevel,
  headingRef,
  name,
  labels,
  className,
}: QuestionFieldsProps) {
  const headingId = useId();
  const otherLabel = labels?.other ?? "Other";
  const otherInputLabel = labels?.otherInput ?? "Your answer";
  const Heading = headingLevel ? (`h${headingLevel}` as const) : null;
  const promptNode = Heading ? (
    <Heading ref={headingRef} id={headingId} tabIndex={-1} className={styles.heading}>
      {prompt}
    </Heading>
  ) : (
    <span className={styles.prompt}>{prompt}</span>
  );

  const otherInput = allowOther && value.other && (
    <Field label={otherInputLabel} className={styles.other}>
      <Input
        value={value.text}
        placeholder={placeholder}
        disabled={disabled}
        name={name ? `${name}-other` : undefined}
        onValueChange={(text) => onValueChange({ ...value, text })}
      />
    </Field>
  );

  if (type === "freeform") {
    return (
      <div className={cx(styles.fields, className)}>
        {Heading && promptNode}
        <Field
          label={Heading ? undefined : promptNode}
          description={description}
          error={error}
          name={name}
        >
          <Textarea
            value={value.text}
            placeholder={placeholder}
            disabled={disabled}
            aria-labelledby={Heading ? headingId : undefined}
            onChange={(e) => onValueChange({ ...value, text: e.currentTarget.value })}
          />
        </Field>
      </div>
    );
  }

  if (type === "multiple") {
    return (
      <div className={cx(styles.fields, className)}>
        <CheckboxGroup
          legend={promptNode}
          description={description}
          error={error}
          name={name}
          disabled={disabled}
          value={value.other ? [...value.selected, OTHER] : value.selected}
          onValueChange={(next: string[]) =>
            onValueChange({ ...value, selected: next.filter((v) => v !== OTHER), other: next.includes(OTHER) })
          }
        >
          {options.map((o) => (
            <Checkbox key={o.value} value={o.value} label={o.label} description={o.description} disabled={o.disabled} />
          ))}
          {allowOther && <Checkbox value={OTHER} label={otherLabel} />}
        </CheckboxGroup>
        {otherInput}
      </div>
    );
  }

  return (
    <div className={cx(styles.fields, className)}>
      <RadioGroup
        legend={promptNode}
        description={description}
        error={error}
        name={name}
        disabled={disabled}
        value={value.other ? OTHER : (value.selected[0] ?? "")}
        onValueChange={(v) => onValueChange(v === OTHER ? { ...value, selected: [], other: true } : { ...value, selected: [v], other: false })}
        options={allowOther ? [...options, { value: OTHER, label: otherLabel }] : options}
      />
      {otherInput}
    </div>
  );
}

/* ---------- Question ---------- */

export type QuestionState = "pending" | "answered" | "skipped";

export type QuestionLabels = QuestionFieldsLabels & {
  submit: string;
  skip: string;
  /** Error shown when submitting without an answer. */
  required: string;
  /** Status shown once answered / skipped. */
  answered: string;
  skipped: string;
};

export type QuestionProps = Omit<ComponentPropsWithRef<"form">, "onSubmit" | "defaultValue" | "onChange" | "children"> &
  Omit<QuestionFieldsProps, "value" | "onValueChange" | "error" | "labels" | "className" | "headingRef"> & {
    value?: QuestionValue;
    defaultValue?: QuestionValue;
    onValueChange?: (value: QuestionValue) => void;
    /** Called with the answer. Only fires when the question is answered. */
    onSubmit?: (response: QuestionResponse) => void;
    /** Shows a Skip button. */
    onSkip?: () => void;
    /** "answered" / "skipped" lock the controls and replace the actions with an announced status. */
    state?: QuestionState;
    /** Extra content under the controls, e.g. why the agent is asking. */
    children?: ReactNode;
    labels?: Partial<QuestionLabels>;
    className?: string;
  };

export function Question({
  prompt,
  description,
  type = "single",
  options,
  allowOther,
  placeholder,
  value: valueProp,
  defaultValue = EMPTY_QUESTION_VALUE,
  onValueChange,
  onSubmit,
  onSkip,
  state = "pending",
  disabled,
  headingLevel,
  name,
  labels,
  className,
  children,
  ...props
}: QuestionProps) {
  const [inner, setInner] = useState(defaultValue);
  const value = valueProp ?? inner;
  const [showError, setShowError] = useState(false);
  const root = useRef<HTMLFormElement | null>(null);
  const userRef = props.ref;
  const setRoot = useCallback(
    (node: HTMLFormElement | null) => {
      root.current = node;
      if (typeof userRef === "function") userRef(node);
      else if (userRef) userRef.current = node;
    },
    [userRef],
  );
  const hadFocus = useRef(false);
  const promptId = useId();
  const locked = state !== "pending";

  useEffect(() => {
    if (locked && hadFocus.current && root.current && !root.current.contains(document.activeElement)) {
      root.current.focus({ preventScroll: true });
    }
  }, [locked]);

  const setValue = (next: QuestionValue) => {
    if (valueProp === undefined) setInner(next);
    onValueChange?.(next);
    if (showError && isQuestionAnswered(type, next)) setShowError(false);
  };

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (locked || disabled) return;
    if (!isQuestionAnswered(type, value)) {
      setShowError(true);
      focusFirstAnswerControl(root.current);
      return;
    }
    onSubmit?.(toQuestionResponse(type, value));
  }

  const StatusIcon = state === "answered" ? CircleCheck : state === "skipped" ? CircleSlash : MessageCircleQuestion;

  return (
    <form
      {...props}
      ref={setRoot}
      noValidate
      tabIndex={-1}
      aria-labelledby={promptId}
      data-state={state}
      className={cx(styles.root, className)}
      onSubmit={handleSubmit}
      onFocus={(e) => {
        props.onFocus?.(e);
        hadFocus.current = true;
      }}
      onBlur={(e) => {
        props.onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hadFocus.current = false;
      }}
    >
      <span aria-hidden className={styles.icon}>
        <StatusIcon />
      </span>
      <div className={styles.body}>
        <QuestionFields
          prompt={<span id={promptId}>{prompt}</span>}
          description={description}
          type={type}
          options={options}
          allowOther={allowOther}
          placeholder={placeholder}
          value={value}
          onValueChange={setValue}
          error={showError ? (labels?.required ?? (type === "freeform" ? "Type an answer." : "Choose an answer.")) : undefined}
          disabled={disabled || locked}
          headingLevel={headingLevel}
          name={name}
          labels={labels}
        />
        {children}
        {locked ? (
          <p role="status" className={styles.status}>
            {state === "answered" ? (labels?.answered ?? "Answered") : (labels?.skipped ?? "Skipped")}
          </p>
        ) : (
          <div className={styles.actions}>
            {onSkip && (
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={onSkip}>
                {labels?.skip ?? "Skip"}
              </Button>
            )}
            <Button type="submit" size="sm" disabled={disabled}>
              {labels?.submit ?? "Submit"}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
