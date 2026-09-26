import { useState } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
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
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./confirmation.tsx?raw";

export function Approval() {
  const [state, setState] = useState<ConfirmationState>("requested");
  return (
    <div className={styles.stack}>
      <Confirmation state={state}>
        <ConfirmationTitle>Send the summary to 42 recipients?</ConfirmationTitle>
        <ConfirmationRequest>The assistant wants to call send_email with the weekly summary.</ConfirmationRequest>
        <ConfirmationAccepted>Approved. The email is on its way.</ConfirmationAccepted>
        <ConfirmationRejected>Rejected. Nothing was sent.</ConfirmationRejected>
        <ConfirmationActions>
          <ConfirmationAction variant="secondary" onClick={() => setState("rejected")}>
            Reject
          </ConfirmationAction>
          <ConfirmationAction onClick={() => setState("accepted")}>Approve</ConfirmationAction>
        </ConfirmationActions>
      </Confirmation>
      {state !== "requested" && (
        <div>
          <Button variant="link" onClick={() => setState("requested")}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "confirmation",
  title: "Confirmation",
  category: "AI",
  description: "Ask the user to approve a tool call before it runs, then show and announce the outcome.",
  imports: `import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ui/confirmation/confirmation";`,
  examples: examples(raw, [["Approval", Approval, { title: "Tool approval", wide: true }]]),
  props: [
    { component: "Confirmation", note: "A div; accepts div props.", rows: [{ name: "state", type: '"requested" | "accepted" | "rejected"', required: true, description: "Which parts are shown." }] },
    { component: "ConfirmationTitle", rows: [], note: "Names the group." },
    { component: "ConfirmationRequest / ConfirmationActions", rows: [], note: "Shown only while requested." },
    { component: "ConfirmationAccepted / ConfirmationRejected", rows: [], note: 'Shown for their state, as role="status" so the outcome is announced.' },
    { component: "ConfirmationAction", rows: [], note: "A small Button (all Button props)." },
  ],
  a11y: [
    "The card is a group named by its title.",
    "The outcome is announced when it appears.",
    "The buttons disappear once answered; if focus was on them it moves to the card, so keyboard users keep their place.",
  ],
};

export default doc;
