/* DataTable columns that start hidden on a narrow window. */
import { render, within } from "@testing-library/react";
import { DataTable } from "@/registry/bitop/ui/data-table/data-table";

function stubMatchMedia(matches: (q: string) => boolean) {
  const original = window.matchMedia;
  window.matchMedia = (query: string) =>
    ({ matches: matches(query), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList;
  return () => (window.matchMedia = original);
}

describe("DataTable defaultHiddenNarrow", () => {
  it("starts low-priority columns hidden on a narrow window only", () => {
    const columns = [
      { id: "name", header: "Name", accessor: "name" as const, rowHeader: true },
      { id: "share", header: "Share", accessor: "share" as const, defaultHiddenNarrow: true },
    ];
    const rows = [{ id: "1", name: "Alpha", share: "10%" }];
    const wide = render(<DataTable caption="Wide" columns={columns} data={rows} getRowId={(r) => r.id} columnsMenu />);
    expect(within(wide.container).getByRole("columnheader", { name: "Share" })).toBeInTheDocument();
    wide.unmount();
    const restore = stubMatchMedia((q) => q.includes("max-width"));
    try {
      const narrow = render(<DataTable caption="Narrow" columns={columns} data={rows} getRowId={(r) => r.id} columnsMenu />);
      expect(within(narrow.container).queryByRole("columnheader", { name: "Share" })).toBeNull();
      expect(within(narrow.container).getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
