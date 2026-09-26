import { useState } from "react";
import { Stack } from "@/registry/bitop/ui/layout/layout";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Paginator,
} from "@/registry/bitop/ui/pagination/pagination";
import { type ComponentDoc, examples } from "../types";
import raw from "./pagination.tsx?raw";

export function Links() {
  return (
    <Pagination label="Search results pages">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#links" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#links">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#links" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#links">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#links" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export function ClientSide() {
  const [page, setPage] = useState(6);
  return (
    <Stack gap={2} align="center">
      <Paginator label="Audit log pages" page={page} pageCount={20} onPageChange={setPage} compact />
      <p>Page {page} of 20</p>
    </Stack>
  );
}

export function RouterLinks() {
  // With a router: renderLink={(p) => <Link to="/deployments" search={{ page: p }} />}
  return <Paginator label="Deployments pages" page={1} pageCount={4} getHref={(p) => `#page-${p}`} size="sm" />;
}

const doc: ComponentDoc = {
  slug: "pagination",
  title: "Pagination",
  category: "Navigation",
  description:
    "Page navigation with previous/next, page links and ellipses. Compose the parts yourself, or use Paginator, which computes the range and renders links or buttons.",
  imports: `import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, Paginator, getPaginationRange,
} from "@/components/ui/pagination/pagination";`,
  examples: examples(raw, [
    ["Links", Links, { title: "Composed from parts", wide: true }],
    ["ClientSide", ClientSide, { title: "Paginator with buttons (client-side state)", wide: true }],
    ["RouterLinks", RouterLinks, { title: "Paginator with links", wide: true }],
  ]),
  props: [
    {
      component: "Paginator",
      rows: [
        { name: "page / pageCount", type: "number / number", required: true, description: "Current page (1-based) and total pages." },
        { name: "onPageChange", type: "(page) => void", description: "Without getHref/renderLink the controls are buttons." },
        { name: "getHref / renderLink", type: "(page) => string / (page) => ReactElement", description: "Render links (plain or router)." },
        { name: "siblings / boundaries", type: "number / number", default: "1 / 1", description: "Pages around the current one and at each end." },
        { name: "label", type: "string", default: '"Pagination"', description: "Name of the navigation landmark." },
        { name: "pageLabel", type: "(page) => string", default: '"Page N"', description: "Accessible name of each page control." },
        { name: "size / compact", type: '"sm" | "md" / boolean', description: "Control size; hide Previous/Next text on narrow screens." },
      ],
    },
    {
      component: "PaginationLink",
      note: "PaginationPrevious and PaginationNext add text (default Previous/Next) and a chevron. Also accept native <a> props.",
      rows: [
        { name: "isActive", type: "boolean", description: 'Current page: aria-current="page".' },
        { name: "disabled", type: "boolean", description: "Renders a disabled native button instead of a link." },
        { name: "render", type: "ReactElement", description: "Router link element." },
      ],
    },
    {
      component: "getPaginationRange(page, pageCount, options?)",
      rows: [{ name: "returns", type: '(number | "start-ellipsis" | "end-ellipsis")[]', description: "Pages to show; its length stays constant as the page moves." }],
    },
  ],
  a11y: [
    "Renders a <nav> landmark; give each one on a page a distinct label.",
    'The current page has aria-current="page"; page controls are named "Page N".',
    "Previous/next are named “Go to previous/next page”; at either end they become disabled native buttons (a link cannot be disabled).",
    "Ellipses are not focusable and read “More pages”.",
    "Chevrons flip in right-to-left layouts.",
  ],
};

export default doc;
