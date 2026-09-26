import {
  Test,
  TestError,
  TestErrorMessage,
  TestErrorStack,
  TestResults,
  TestResultsContent,
  TestResultsDuration,
  TestResultsHeader,
  TestResultsProgress,
  TestResultsSummary,
  TestSuite,
  TestSuiteContent,
  TestSuiteName,
  TestSuiteStats,
} from "@/registry/bitop/ui/test-results/test-results";
import { type ComponentDoc, examples } from "../types";
import styles from "./ai-examples.module.css";
import raw from "./test-results.tsx?raw";

export function Run() {
  return (
    <div className={styles.stack}>
      <TestResults summary={{ passed: 6, failed: 1, skipped: 1, total: 8, duration: 4210 }}>
        <TestResultsHeader>
          <TestResultsSummary />
          <TestResultsDuration />
        </TestResultsHeader>
        <TestResultsProgress />
        <TestResultsContent>
          <TestSuite name="auth/refresh.test.ts" status="failed" defaultOpen>
            <TestSuiteName>
              <TestSuiteStats passed={2} failed={1} />
            </TestSuiteName>
            <TestSuiteContent>
              <Test name="refreshes an expired access token" status="passed" duration={14} />
              <Test name="sends one request for concurrent refreshes" status="passed" duration={31} />
              <Test name="rejects a revoked refresh token" status="failed" duration={48}>
                <TestError>
                  <TestErrorMessage>expected 401 "Unauthorized", received 200 "OK"</TestErrorMessage>
                  <TestErrorStack>{`at Object.<anonymous> (tests/auth/refresh.test.ts:57:32)
at processTicksAndRejections (node:internal/process/task_queues:95:5)`}</TestErrorStack>
                </TestError>
              </Test>
            </TestSuiteContent>
          </TestSuite>
          <TestSuite name="billing/invoice.test.ts" status="passed">
            <TestSuiteName>
              <TestSuiteStats passed={4} skipped={1} />
            </TestSuiteName>
            <TestSuiteContent>
              <Test name="totals line items" status="passed" duration={3} />
              <Test name="applies percentage discounts" status="passed" duration={2} />
              <Test name="rounds half to even" status="passed" duration={2} />
              <Test name="formats currency" status="passed" duration={5} />
              <Test name="handles multi-currency invoices" status="skipped" />
            </TestSuiteContent>
          </TestSuite>
        </TestResultsContent>
      </TestResults>
    </div>
  );
}

export function SummaryOnly() {
  return (
    <div className={styles.stack}>
      <TestResults summary={{ passed: 128, failed: 0, skipped: 0, total: 128, duration: 12_840 }} />
      <TestResults>
        <TestResultsContent>
          <TestSuite name="e2e/checkout.spec.ts" status="running" defaultOpen>
            <TestSuiteName />
            <TestSuiteContent>
              <Test name="adds an item to the cart" status="passed" duration={1204} />
              <Test name="pays with a saved card" status="running" />
            </TestSuiteContent>
          </TestSuite>
        </TestResultsContent>
      </TestResults>
    </div>
  );
}

const doc: ComponentDoc = {
  slug: "test-results",
  title: "Test results",
  category: "AI",
  description: "A test run: passed, failed and skipped counts, duration, a pass-rate bar, and suites of tests with collapsible error details.",
  imports: `import { Test, TestError, TestResults, TestResultsContent, TestSuite, TestSuiteContent, TestSuiteName } from "@/components/ui/test-results/test-results";`,
  baseUi: { name: "Collapsible", href: "https://base-ui.com/react/components/collapsible" },
  examples: examples(raw, [
    ["Run", Run, { title: "A run with a failure", description: "Failed tests start with their details open.", wide: true }],
    ["SummaryOnly", SummaryOnly, { title: "Summary only, and a running suite", wide: true }],
  ]),
  props: [
    {
      component: "TestResults",
      note: "Also accepts native <div> props. Without children and with a summary, it renders the header and progress bar.",
      rows: [{ name: "summary", type: "{ passed; failed; skipped; total; duration? }", description: "Counts and duration in ms." }],
    },
    {
      component: "TestResultsProgress",
      rows: [{ name: "label", type: "string", default: '"Tests passed"', description: "Meter label (“6/8 tests passed”)." }],
      note: "A Base UI Meter whose value is the passed count; failed and skipped are extra bar segments.",
    },
    {
      component: "TestSuite",
      note: "Base UI Collapsible.Root props. TestSuiteName is the trigger (children render after the name); TestSuiteContent is the panel.",
      rows: [
        { name: "name", type: "string", required: true, description: "Suite name; also names its test list." },
        { name: "status", type: '"passed" | "failed" | "skipped" | "running"', required: true, description: "Status icon and hidden text." },
      ],
    },
    { component: "TestSuiteStats", rows: [{ name: "passed / failed / skipped", type: "number", default: "0", description: "Counts; zeros are omitted." }] },
    {
      component: "Test",
      note: "Also accepts native <li> props.",
      rows: [
        { name: "name", type: "string", required: true, description: "Test name." },
        { name: "status", type: '"passed" | "failed" | "skipped" | "running"', required: true, description: "Status icon and hidden text." },
        { name: "duration", type: "number", description: "Milliseconds, formatted (12ms, 4.21s, 1m 5s)." },
        { name: "children", type: "ReactNode", description: "Error details; makes the row a disclosure." },
        { name: "defaultOpen", type: "boolean", default: "status === \"failed\"", description: "Whether details start open." },
      ],
    },
    { component: "TestError / TestErrorMessage / TestErrorStack", rows: [], note: "A tinted error box, its message and a scrollable, focusable <pre>." },
  ],
  a11y: [
    "Statuses use different icon shapes plus hidden text (“Failed: …”), and counts are written out, so nothing is colour-only.",
    "Suites and failing tests are buttons with aria-expanded; the pass rate is a Base UI meter with a text value.",
    "The running spinner stops under reduced motion.",
  ],
};

export default doc;
