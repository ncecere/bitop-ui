import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button, IconButton } from "@/registry/bitop/ui/button/button";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/registry/bitop/ui/drawer/drawer";
import { Field } from "@/registry/bitop/ui/field/field";
import { Input } from "@/registry/bitop/ui/input/input";
import { Switch } from "@/registry/bitop/ui/switch/switch";
import { toast } from "@/registry/bitop/ui/toast/toast";
import { type ComponentDoc, examples } from "../types";
import styles from "./overlay-examples.module.css";
import raw from "./drawer.tsx?raw";

export function BottomSheet() {
  const [goal, setGoal] = useState(350);
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="secondary">Set daily goal</Button>} />
      <DrawerContent>
        <div className={styles.stack}>
          <DrawerHeader>
            <DrawerTitle>Move goal</DrawerTitle>
            <DrawerDescription>Set your daily activity goal.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody>
            <div className={styles.goal}>
              <IconButton
                variant="secondary"
                icon={<Minus aria-hidden />}
                label="Decrease goal by 10"
                disabled={goal <= 200}
                onClick={() => setGoal((g) => g - 10)}
              />
              <div className={styles.goalValue} aria-live="polite">
                {goal}
                <span>Calories / day</span>
              </div>
              <IconButton
                variant="secondary"
                icon={<Plus aria-hidden />}
                label="Increase goal by 10"
                disabled={goal >= 500}
                onClick={() => setGoal((g) => g + 10)}
              />
            </div>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose variant="primary" onClick={() => toast.success(`Goal set to ${goal} calories`)}>
              Save goal
            </DrawerClose>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function Sides() {
  const sides = ["top", "right", "bottom", "left"] as const;
  return (
    <>
      {sides.map((side) => (
        <Drawer key={side} side={side}>
          <DrawerTrigger render={<Button variant="secondary">{side[0]!.toUpperCase() + side.slice(1)}</Button>} />
          <DrawerContent showClose>
            <DrawerHeader>
              <DrawerTitle>Notification settings</DrawerTitle>
              <DrawerDescription>Swipe {side === "bottom" ? "down" : side === "top" ? "up" : side} or press Escape to dismiss.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <Switch label="Deployment failures" defaultChecked />
              <Switch label="Weekly usage report" />
              <Switch label="New team members" defaultChecked />
            </DrawerBody>
            <DrawerFooter>
              <DrawerClose>Done</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ))}
    </>
  );
}

export function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Rename project…</Button>
      <Drawer side="right" open={open} onOpenChange={setOpen}>
        <DrawerContent showClose>
          <form
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              toast.success("Project renamed");
            }}
          >
            <DrawerHeader>
              <DrawerTitle>Rename project</DrawerTitle>
              <DrawerDescription>The URL of existing deployments won't change.</DrawerDescription>
            </DrawerHeader>
            <DrawerBody>
              <Field label="Project name">
                <Input defaultValue="marketing-site" />
              </Field>
            </DrawerBody>
            <DrawerFooter>
              <Button type="submit">Save</Button>
              <DrawerClose>Cancel</DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}

const doc: ComponentDoc = {
  slug: "drawer",
  title: "Drawer",
  category: "Overlays",
  description:
    "A panel attached to an edge of the screen that can be swiped away: bottom sheets on mobile, side panels on desktop. Composed from header, title, description, body, footer and close parts.",
  imports: `import {
  Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription,
  DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer/drawer";`,
  baseUi: { name: "Drawer", href: "https://base-ui.com/react/components/drawer" },
  examples: examples(raw, [
    ["BottomSheet", BottomSheet, { title: "Bottom sheet", description: "The default: slides up from the bottom with a grab handle; drag it down to dismiss." }],
    ["Sides", Sides, { title: "Sides", description: "side sets the edge and the swipe direction. showClose adds an × button." }],
    ["Controlled", Controlled, { title: "Controlled with a form", description: "open / onOpenChange without a DrawerTrigger." }],
  ]),
  props: [
    {
      component: "Drawer",
      note: "Also accepts Base UI Drawer.Root props: snapPoints, snapPoint, onSnapPointChange, modal, disablePointerDismissal, actionsRef, handle…",
      rows: [
        { name: "side", type: '"bottom" | "top" | "left" | "right"', default: '"bottom"', description: "Edge the drawer is attached to; it is swiped toward this edge to dismiss." },
        { name: "open / defaultOpen / onOpenChange", type: "boolean / boolean / (open, details) => void", description: "Controlled or uncontrolled state." },
        { name: "modal", type: 'boolean | "trap-focus"', default: "true", description: "false lets the page stay interactive (no backdrop)." },
      ],
    },
    { component: "DrawerTrigger", note: "Base UI Drawer.Trigger; pass render={<Button>…</Button>}.", rows: [] },
    {
      component: "DrawerContent",
      note: "Also accepts Base UI Drawer.Popup props (initialFocus, finalFocus…).",
      rows: [
        { name: "showHandle", type: "boolean", default: "true for bottom/top", description: "Decorative grab handle." },
        { name: "showClose", type: "boolean", default: "false", description: "An × button in the corner." },
        { name: "closeLabel", type: "string", default: '"Close"', description: "Accessible name of the × button." },
      ],
    },
    { component: "DrawerTitle", note: "Required in every drawer: it names the dialog. Renders an <h2>.", rows: [] },
    { component: "DrawerDescription", note: "Optional; describes the dialog.", rows: [] },
    { component: "DrawerHeader / DrawerBody / DrawerFooter", note: "Layout <div>s; the body scrolls and the footer stacks full-width buttons.", rows: [] },
    { component: "DrawerClose", note: "A Button (secondary by default) that closes the drawer; takes Button props.", rows: [] },
  ],
  a11y: [
    'The popup is a modal dialog (role="dialog") labelled by DrawerTitle and described by DrawerDescription.',
    "Focus moves into the drawer, is trapped while it is open and returns to the trigger on close.",
    "Escape, the backdrop and DrawerClose all close it; swiping is a pointer shortcut, never the only way.",
    "The grab handle is decorative (aria-hidden).",
    "Transitions are switched off under prefers-reduced-motion.",
  ],
};

export default doc;
