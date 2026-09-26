import { formatBytes, formatDate, formatNumber, formatRelativeTime, plural } from "@/registry/bitop/lib/bitop-format";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import { Table, Td, Tr } from "@/registry/bitop/ui/table/table";
import { Time } from "@/registry/bitop/ui/time/time";
import { type ComponentDoc, examples } from "../types";
import raw from "./time.tsx?raw";

export function Formats() {
  const deployedAt = "2026-09-26T14:30:00Z";
  return (
    <Table caption="Time formats" columns={["format", "Output"]} density="compact">
      <Tr>
        <Td>datetime (default)</Td>
        <Td>
          <Time value={deployedAt} locale="en-US" timeZone="UTC" />
        </Td>
      </Tr>
      <Tr>
        <Td>date</Td>
        <Td>
          <Time value={deployedAt} format="date" locale="en-US" timeZone="UTC" />
        </Td>
      </Tr>
      <Tr>
        <Td>time</Td>
        <Td>
          <Time value={deployedAt} format="time" locale="en-US" timeZone="UTC" />
        </Td>
      </Tr>
      <Tr>
        <Td>long</Td>
        <Td>
          <Time value={deployedAt} format="long" locale="en-US" timeZone="UTC" />
        </Td>
      </Tr>
      <Tr>
        <Td>missing value</Td>
        <Td>
          <Time value={null} fallback="—" />
        </Td>
      </Tr>
    </Table>
  );
}

export function Relative() {
  const now = Date.now();
  return (
    <Stack gap={2}>
      <p>
        Indexed <Time value={now - 20 * 1000} format="relative" />
      </p>
      <p>
        Last sign-in <Time value={now - 3 * 60 * 60 * 1000} format="relative" />
      </p>
      <p>
        Key expires <Time value={now + 12 * 24 * 60 * 60 * 1000} format="relative" />
      </p>
    </Stack>
  );
}

export function Helpers() {
  const now = new Date("2026-09-26T12:00:00Z");
  const rows: [string, string][] = [
    ['formatDate(d, { style: "date" })', formatDate("2026-09-24T08:15:00Z", { style: "date", locale: "en-US", timeZone: "UTC" })],
    ["formatRelativeTime(d, { now })", formatRelativeTime("2026-09-24T08:15:00Z", { now, locale: "en-US" })],
    ["formatNumber(1234567)", formatNumber(1234567, { locale: "en-US" })],
    ["formatNumber(1234567, { compact })", formatNumber(1234567, { locale: "en-US", compact: true })],
    ["formatBytes(1_500_000)", formatBytes(1_500_000, { locale: "en-US" })],
    ["formatBytes(1536, { binary })", formatBytes(1536, { locale: "en-US", binary: true })],
    ['plural(3, { one: "file", other: "files" })', plural(3, { one: "file", other: "files" }, "en-US")],
    ['plural(0, { …, zero: "No files" })', plural(0, { one: "file", other: "files", zero: "No files" }, "en-US")],
  ];
  return (
    <Table caption="Format helpers" columns={["Call", "Result"]} density="compact">
      {rows.map(([call, result]) => (
        <Tr key={call}>
          <Td>
            <code>{call}</code>
          </Td>
          <Td>{result}</Td>
        </Tr>
      ))}
    </Table>
  );
}

const doc: ComponentDoc = {
  slug: "time",
  title: "Time",
  category: "Display",
  description:
    "A semantic <time> with locale-formatted dates, or a relative time that keeps itself up to date. Built on the format item (bitop-format.ts): pure Intl helpers for dates, numbers, bytes, relative times and plurals that you can use on their own.",
  imports: `import { Time } from "@/components/ui/time/time";
import { formatBytes, formatDate, formatNumber, formatRelativeTime, plural } from "@/lib/bitop-format";`,
  examples: examples(raw, [
    ["Formats", Formats, { title: "Formats", description: "Pass locale and timeZone for output that doesn't depend on the viewer's machine.", wide: true }],
    ["Relative", Relative, { title: "Relative", description: "Hover for the full date. Updates every second under a minute, then less often." }],
    ["Helpers", Helpers, { title: "Format helpers", description: "Install with the format item; Time depends on it.", wide: true }],
  ]),
  props: [
    {
      component: "Time",
      note: "Also accepts native <time> props; dateTime is set from value.",
      rows: [
        { name: "value", type: "Date | string | number | null | undefined", required: true, description: "The date (ISO string or epoch ms work too)." },
        { name: "format", type: '"datetime" | "date" | "time" | "long" | "relative"', default: '"datetime"', description: "Output style." },
        { name: "locale", type: "string", description: "BCP 47 locale (default: the browser's)." },
        { name: "timeZone", type: "string", description: "IANA time zone for absolute formats and the relative title." },
        { name: "now", type: "Date | string | number", description: "Fixed reference for relative; disables the refresh timer (SSR, tests)." },
        { name: "fallback", type: "ReactNode", description: "Rendered instead when value is missing or invalid." },
      ],
    },
    {
      component: "formatDate(value, options?)",
      note: "Returns fallback (\"\") for missing or invalid dates, or an unknown locale / time zone. Never throws.",
      rows: [
        { name: "style", type: '"date" | "datetime" | "time" | "long"', default: '"datetime"', description: '"Sep 26, 2026", "Sep 26, 2026, 2:30 PM", "2:30 PM", "Saturday, September 26, 2026 at 2:30:00 PM UTC".' },
        { name: "locale / timeZone", type: "string", description: "Passed to Intl.DateTimeFormat." },
        { name: "fallback", type: "string", default: '""', description: "Result for invalid input." },
      ],
    },
    {
      component: "formatRelativeTime(value, options?)",
      note: "Seconds under a minute, then minutes, hours, days, weeks, months and years; never \"60 minutes\" or \"12 months\".",
      rows: [
        { name: "now", type: "Date | string | number", default: "new Date()", description: "Reference time." },
        { name: "numeric", type: '"auto" | "always"', default: '"auto"', description: '"yesterday" vs "1 day ago".' },
        { name: "locale / fallback", type: "string", description: "As for formatDate." },
      ],
    },
    {
      component: "formatNumber(n, options?) · formatBytes(bytes, options?)",
      note: "NaN returns \"\".",
      rows: [
        { name: "compact", type: "boolean", default: "false", description: 'formatNumber: "1.2M".' },
        { name: "binary", type: "boolean", default: "false", description: "formatBytes: powers of 1024 (KiB, MiB) instead of 1000 (kB, MB)." },
        { name: "maximumFractionDigits", type: "number", description: "formatNumber: 3 (1 when compact). formatBytes: 1 below 10 units, else 0." },
        { name: "locale", type: "string", description: "Passed to Intl.NumberFormat." },
      ],
    },
    {
      component: "plural(count, forms, locale?)",
      note: 'Selects with Intl.PluralRules and includes the formatted count: "1 file", "1,200 files". A form with {count} is a template; zero is used verbatim for 0.',
      rows: [
        { name: "forms", type: "{ one; other; zero?; two?; few?; many? }", required: true, description: "Words or {count} templates per plural category." },
      ],
    },
  ],
  a11y: [
    "Renders a <time> element with a machine-readable ISO dateTime.",
    "Relative times carry the full date in a title; the text updates silently (it is not a live region).",
    "Pass a text fallback such as \"—\" when a value may be missing, so table cells aren't empty.",
  ],
};

export default doc;
