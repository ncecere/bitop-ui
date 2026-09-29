/* The command palette's plural- and prefix-tolerant matching. */
import { commandMatches } from "@/registry/bitop/ui/command-palette/command-palette";

describe("commandMatches", () => {
  const cmd = { label: "Add member", keywords: ["invite", "people"] };
  it.each([
    ["member", true],
    ["members", true],
    ["memb", true],
    ["MEMBERS invite", true],
    ["peoples", true],
    ["policies", false],
    ["membersx", false],
  ])("%s → %s", (q, want) => expect(commandMatches(cmd, q)).toBe(want));

  it("reads -ies and -es plurals", () => {
    expect(commandMatches({ label: "Retention policy" }, "policies")).toBe(true);
    expect(commandMatches({ label: "Saved search" }, "searches")).toBe(true);
    expect(commandMatches({ label: "Access" }, "access")).toBe(true);
  });
});
