/*
 * Semantics, props and className/ref pass-through for display components
 * that were previously only rendered by the docs-page axe sweep.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import { createRef, type ComponentProps } from "react";
import { axe } from "vitest-axe";
import { Avatar, initials } from "@/registry/bitop/ui/avatar/avatar";
import { Badge, StatusBadge, StatusDot } from "@/registry/bitop/ui/badge/badge";
import { Breadcrumbs } from "@/registry/bitop/ui/breadcrumbs/breadcrumbs";
import { Button } from "@/registry/bitop/ui/button/button";
import { Card, CardBody, CardFooter, CardHeader } from "@/registry/bitop/ui/card/card";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { Kbd, KbdShortcut } from "@/registry/bitop/ui/kbd/kbd";
import { Container, Inline, Stack } from "@/registry/bitop/ui/layout/layout";
import { PageHeader } from "@/registry/bitop/ui/page-header/page-header";
import { Progress } from "@/registry/bitop/ui/progress/progress";
import { Separator } from "@/registry/bitop/ui/separator/separator";
import { Shimmer } from "@/registry/bitop/ui/shimmer/shimmer";
import { Skeleton, SkeletonText } from "@/registry/bitop/ui/skeleton/skeleton";
import { Loading, Spinner } from "@/registry/bitop/ui/spinner/spinner";
import { TextLink } from "@/registry/bitop/ui/text-link/text-link";
import { VisuallyHidden } from "@/registry/bitop/ui/visually-hidden/visually-hidden";

function RouterLink(props: ComponentProps<"a">) {
  return <a data-router="" {...props} />;
}

describe("Avatar", () => {
  it("is an image named by the person, showing initials as the fallback", async () => {
    const { container } = render(<Avatar name="Ada Lovelace" size="lg" shape="square" className="scoped" />);
    const img = screen.getByRole("img", { name: "Ada Lovelace" });
    expect(img).toHaveClass("scoped");
    expect(img).toHaveAttribute("data-size", "lg");
    expect(img).toHaveAttribute("data-shape", "square");
    expect(img).toHaveTextContent("AL");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps the initials fallback while an image hasn't loaded (jsdom never loads it)", () => {
    render(<Avatar name="Grace Hopper" src="/grace.png" />);
    expect(screen.getByRole("img", { name: "Grace Hopper" })).toHaveTextContent("GH");
  });

  it("is hidden from assistive technology when decorative", () => {
    const { container } = render(<Avatar name="Ada Lovelace" decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("gives the same name the same tint", () => {
    const { container } = render(
      <>
        <Avatar name="Ada" />
        <Avatar name="Ada" />
      </>,
    );
    const [a, b] = [...container.querySelectorAll("[data-hue]")] as [Element, Element];
    expect(a.getAttribute("data-hue")).toBe(b.getAttribute("data-hue"));
    expect(Number(a.getAttribute("data-hue"))).toBeGreaterThanOrEqual(1);
    expect(Number(a.getAttribute("data-hue"))).toBeLessThanOrEqual(6);
  });

  it("computes initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("  ada   king  lovelace ")).toBe("AL");
    expect(initials("Cher")).toBe("C");
    expect(initials("   ")).toBe("?");
  });
});

describe("Badge", () => {
  it("maps tone/variant/size to data attributes and passes props and ref through", async () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <Badge ref={ref} tone="success" variant="outline" size="sm" className="scoped" title="State">
        Ready
      </Badge>,
    );
    const badge = screen.getByText("Ready");
    expect(ref.current).toBe(badge);
    expect(badge).toHaveAttribute("data-tone", "success");
    expect(badge).toHaveAttribute("data-variant", "outline");
    expect(badge).toHaveAttribute("data-size", "sm");
    expect(badge).toHaveClass("scoped");
    expect(badge).toHaveAttribute("title", "State");
    expect(badge.querySelector("[aria-hidden]")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatusBadge adds a decorative dot, pulsing on request", () => {
    render(
      <StatusBadge tone="info" pulse>
        Processing
      </StatusBadge>,
    );
    const dot = screen.getByText("Processing").querySelector("[aria-hidden]");
    expect(dot).toHaveAttribute("data-pulse");
    expect(screen.getByText("Processing")).toHaveTextContent(/^Processing$/);
  });

  it("StatusDot is hidden unless labelled, then it's a named image", () => {
    const { container } = render(
      <>
        <StatusDot tone="danger" data-testid="bare" />
        <StatusDot tone="success" label="Online" />
      </>,
    );
    expect(screen.getByTestId("bare")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("img", { name: "Online" })).toHaveAttribute("data-tone", "success");
    expect(container.querySelectorAll("[role='img']")).toHaveLength(1);
  });
});

describe("Spinner", () => {
  it("is decorative without a label and a status with one", async () => {
    const { container } = render(
      <>
        <Spinner data-testid="bare" size="lg" className="scoped" />
        <Spinner label="Saving" />
      </>,
    );
    const bare = screen.getByTestId("bare");
    expect(bare).toHaveAttribute("aria-hidden", "true");
    expect(bare).toHaveAttribute("data-size", "lg");
    expect(bare).toHaveClass("scoped");
    expect(screen.getByRole("status")).toHaveTextContent("Saving");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Loading announces its label politely", () => {
    render(<Loading label="Loading sources…" block={false} className="scoped" />);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading sources…");
    expect(status).toHaveClass("scoped");
    expect(status).not.toHaveAttribute("data-block");
  });
});

describe("Breadcrumbs", () => {
  it("is a named nav with an ordered list; the last item is the current page", async () => {
    const { container } = render(
      <Breadcrumbs
        className="scoped"
        items={[
          { label: "Teams", href: "/teams" },
          { label: "Acme", render: <RouterLink href="/teams/acme" /> },
          { label: "Sources", href: "/ignored" },
        ]}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toHaveClass("scoped");
    const list = within(nav).getByRole("list");
    expect(list.tagName).toBe("OL");
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Teams" })).toHaveAttribute("href", "/teams");
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute("data-router");
    // The current page is text, not a link.
    expect(screen.queryByRole("link", { name: "Sources" })).toBeNull();
    expect(screen.getByText("Sources")).toHaveAttribute("aria-current", "page");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("accepts a custom landmark label", () => {
    render(<Breadcrumbs label="You are here" items={[{ label: "Home" }]} />);
    expect(screen.getByRole("navigation", { name: "You are here" })).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("shorthand: a region named by its heading, with actions, body and footer", async () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Card ref={ref} title="Members" description="People in this team" actions={<Button>Invite</Button>} footer="3 members" titleAs="h3" className="scoped" interactive>
        Body
      </Card>,
    );
    const region = screen.getByRole("region", { name: "Members" });
    expect(ref.current).toBe(region);
    expect(region).toHaveClass("scoped");
    expect(region).toHaveAttribute("data-interactive");
    expect(screen.getByRole("heading", { level: 3, name: "Members" })).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "Invite" })).toBeInTheDocument();
    expect(region).toHaveTextContent("People in this team");
    expect(region).toHaveTextContent("Body");
    expect(region).toHaveTextContent("3 members");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("without a title is an unnamed section (no region landmark)", () => {
    render(<Card data-testid="card">Plain</Card>);
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.getByTestId("card").tagName).toBe("SECTION");
  });

  it("composes CardHeader, CardBody and CardFooter", () => {
    render(
      <Card aria-labelledby="t">
        <CardHeader title="Usage" titleId="t" />
        <CardBody flush className="body">
          Table
        </CardBody>
        <CardFooter className="foot">Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByRole("region", { name: "Usage" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Usage" })).toBeInTheDocument();
    expect(screen.getByText("Table")).toHaveAttribute("data-flush");
    expect(screen.getByText("Table")).toHaveClass("body");
    expect(screen.getByText("Footer")).toHaveClass("foot");
  });
});

describe("EmptyState", () => {
  it("renders title, description and action, with a decorative icon", async () => {
    const { container } = render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="No sources yet"
        description="Add one to get started."
        action={<Button>Add source</Button>}
        size="compact"
        className="scoped"
        data-testid="empty"
      />,
    );
    const root = screen.getByTestId("empty");
    expect(root).toHaveClass("scoped");
    expect(root).toHaveAttribute("data-size", "compact");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("No sources yet").tagName).toBe("P");
    expect(screen.getByText("Add one to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add source" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders the title as a heading when asked", () => {
    render(<EmptyState title="Nothing here" titleAs="h2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Nothing here" })).toBeInTheDocument();
  });
});

describe("Kbd", () => {
  it("renders a <kbd> and passes props through", () => {
    const ref = createRef<HTMLElement>();
    render(
      <Kbd ref={ref} size="sm" className="scoped" title="Escape">
        Esc
      </Kbd>,
    );
    const kbd = screen.getByText("Esc");
    expect(kbd.tagName).toBe("KBD");
    expect(ref.current).toBe(kbd);
    expect(kbd).toHaveClass("scoped");
    expect(kbd).toHaveAttribute("data-size", "sm");
    expect(kbd).toHaveAttribute("title", "Escape");
  });

  it("spells out symbols for screen readers and hides the glyphs", async () => {
    const { container } = render(<KbdShortcut keys={["mod", "shift", "K"]} className="scoped" />);
    const keys = [...container.querySelectorAll("kbd")] as [HTMLElement, HTMLElement, HTMLElement];
    expect(keys).toHaveLength(3);
    expect(container.firstElementChild).toHaveClass("scoped");
    expect(keys[0].querySelector("[aria-hidden]")).toBeInTheDocument();
    expect(within(keys[0]).getByText("Command or Control")).toHaveClass("sr-only");
    expect(within(keys[1]).getByText("Shift", { selector: ".sr-only" })).toBeInTheDocument();
    expect(keys[2]).toHaveTextContent("KK");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows Ctrl off Apple platforms and ⌘ on them", () => {
    const platform = vi.spyOn(navigator, "platform", "get");
    platform.mockReturnValue("Win32");
    const { unmount } = render(<KbdShortcut keys={["mod"]} />);
    expect(screen.getByText("Ctrl")).toHaveAttribute("aria-hidden", "true");
    unmount();
    platform.mockReturnValue("MacIntel");
    render(<KbdShortcut keys={["mod"]} />);
    expect(screen.getByText("⌘")).toHaveAttribute("aria-hidden", "true");
    platform.mockRestore();
  });
});

describe("Layout", () => {
  it("Stack and Inline map props to data attributes and a gap token", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <>
        <Stack ref={ref} gap={4} align="center" justify="between" className="scoped" data-testid="stack" style={{ color: "inherit" }}>
          a
        </Stack>
        <Inline gap={2} wrap={false} data-testid="inline">
          b
        </Inline>
      </>,
    );
    const stack = screen.getByTestId("stack");
    expect(ref.current).toBe(stack);
    expect(stack).toHaveClass("scoped");
    expect(stack).toHaveAttribute("data-align", "center");
    expect(stack).toHaveAttribute("data-justify", "between");
    expect(stack.style.getPropertyValue("--flex-gap")).toBe("var(--space-4)");
    expect(stack.style.color).toBe("inherit");
    const inline = screen.getByTestId("inline");
    expect(inline).toHaveAttribute("data-nowrap");
    expect(inline.style.getPropertyValue("--flex-gap")).toBe("var(--space-2)");
  });

  it("renders as another element through render", () => {
    render(
      <Stack render={<ul />} aria-label="Steps">
        <li>One</li>
      </Stack>,
    );
    expect(screen.getByRole("list", { name: "Steps" })).toContainElement(screen.getByRole("listitem"));
  });

  it("Container sets its size and passes props through", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref} size="md" className="scoped" data-testid="c" />);
    expect(screen.getByTestId("c")).toBe(ref.current);
    expect(ref.current).toHaveAttribute("data-size", "md");
    expect(ref.current).toHaveClass("scoped");
  });
});

describe("PageHeader", () => {
  it("renders an h1 by default with description, meta, actions and breadcrumbs", async () => {
    const { container } = render(
      <main>
        <PageHeader
          title="Sources"
          description="Documents the assistant can cite."
          meta={<span>12</span>}
          actions={<Button>Add source</Button>}
          breadcrumbs={<Breadcrumbs items={[{ label: "Team", href: "/" }, { label: "Sources" }]} />}
          className="scoped"
          data-testid="ph"
        />
      </main>,
    );
    expect(screen.getByTestId("ph")).toHaveClass("scoped");
    expect(screen.getByRole("heading", { level: 1, name: "Sources" })).toBeInTheDocument();
    expect(screen.getByText("Documents the assistant can cite.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add source" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses the requested heading level", () => {
    render(<PageHeader title="Members" titleAs="h2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Members" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });
});

describe("Progress", () => {
  it("is a progressbar named by its label with aria-value*", async () => {
    const { container } = render(<Progress label="Indexing" value={40} tone="success" size="sm" className="scoped" />);
    const bar = screen.getByRole("progressbar", { name: "Indexing" });
    expect(bar).toHaveClass("scoped");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("data-tone", "success");
    expect(bar).toHaveAttribute("data-size", "sm");
    expect(bar).toHaveTextContent("40%");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("honours max and hides the value when asked", () => {
    render(<Progress label="Files" value={3} max={4} showValue={false} />);
    const bar = screen.getByRole("progressbar", { name: "Files" });
    expect(bar).toHaveAttribute("aria-valuemax", "4");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).not.toHaveTextContent("%");
  });

  it("omits aria-valuenow when indeterminate", () => {
    render(<Progress label="Waiting" value={null} />);
    const bar = screen.getByRole("progressbar", { name: "Waiting" });
    expect(bar).not.toHaveAttribute("aria-valuenow");
  });

  it("keeps the name when the label is visually hidden", () => {
    render(<Progress label="Upload" hideLabel value={10} />);
    expect(screen.getByRole("progressbar", { name: "Upload" })).toBeInTheDocument();
    expect(screen.getByText("Upload")).toHaveClass("sr-only");
  });
});

describe("Separator", () => {
  it("is a horizontal separator by default and vertical on request", async () => {
    const { container } = render(
      <>
        <Separator className="scoped" spacing="lg" />
        <Separator orientation="vertical" />
      </>,
    );
    const [h, v] = screen.getAllByRole("separator");
    expect(h).toHaveAttribute("aria-orientation", "horizontal");
    expect(h).toHaveClass("scoped");
    expect(h).toHaveAttribute("data-spacing", "lg");
    expect(v).toHaveAttribute("aria-orientation", "vertical");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("with a label, flanks visible text with two rules", () => {
    render(<Separator label="or" className="scoped" />);
    const rules = screen.getAllByRole("separator");
    expect(rules).toHaveLength(2);
    const text = screen.getByText("or");
    expect(text.parentElement).toHaveClass("scoped");
    for (const r of rules) expect(r).not.toContainElement(text);
  });
});

describe("Shimmer", () => {
  it("is plain readable text with animation flags and a duration variable", async () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <p>
        <Shimmer ref={ref} duration={3} className="scoped">
          Thinking…
        </Shimmer>
      </p>,
    );
    const el = screen.getByText("Thinking…");
    expect(ref.current).toBe(el);
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("scoped");
    expect(el).toHaveAttribute("data-active");
    expect(el).not.toHaveAttribute("aria-hidden");
    expect(el.style.getPropertyValue("--shimmer-duration")).toBe("3s");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("can be switched off and rendered as another element", () => {
    render(
      <Shimmer active={false} render={<p />}>
        Done
      </Shimmer>,
    );
    const el = screen.getByText("Done");
    expect(el.tagName).toBe("P");
    expect(el).not.toHaveAttribute("data-active");
  });
});

describe("Skeleton", () => {
  it("is always hidden from assistive technology", async () => {
    const { container } = render(
      <div role="status" aria-busy="true" aria-label="Loading sources">
        <Skeleton width={120} height="1rem" shape="circle" className="scoped" data-testid="sk" />
        <SkeletonText lines={4} className="text" />
      </div>,
    );
    const sk = screen.getByTestId("sk");
    expect(sk).toHaveAttribute("aria-hidden", "true");
    expect(sk).toHaveAttribute("data-shape", "circle");
    expect(sk).toHaveClass("scoped");
    expect(sk.style.width).toBe("120px");
    expect(sk.style.height).toBe("1rem");

    const text = container.querySelector(".text")!;
    expect(text).toHaveAttribute("aria-hidden", "true");
    const lines = text.querySelectorAll("[data-shape='text']");
    expect(lines).toHaveLength(4);
    expect((lines[3] as HTMLElement).style.width).toBe("60%");
    expect((lines[0] as HTMLElement).style.width).toBe("100%");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a single text line is full width", () => {
    const { container } = render(<SkeletonText lines={1} />);
    const line = container.querySelector("[data-shape='text']") as HTMLElement;
    expect(line.style.width).toBe("100%");
  });
});

describe("TextLink", () => {
  it("renders an anchor with tone and forwards ref", async () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = render(
      <p>
        See{" "}
        <TextLink ref={ref} href="/docs" tone="muted" className="scoped">
          the docs
        </TextLink>
      </p>,
    );
    const link = screen.getByRole("link", { name: "the docs" });
    expect(ref.current).toBe(link);
    expect(link).toHaveAttribute("href", "/docs");
    expect(link).toHaveAttribute("data-tone", "muted");
    expect(link).toHaveClass("scoped");
    expect(link).not.toHaveAttribute("target");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("external links open in a new tab safely and say so", () => {
    render(
      <TextLink href="https://example.com" external>
        Example
      </TextLink>,
    );
    // jsdom trims the leading space of the sr-only suffix that browsers keep.
    const link = screen.getByRole("link", { name: /^Example\s*\(opens in a new tab\)$/ });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toMatch(/noopener/);
    expect(link.getAttribute("rel")).toMatch(/noreferrer/);
    expect(link).toHaveAttribute("data-external");
  });

  it("renders through a router link", () => {
    render(<TextLink render={<RouterLink href="/teams" />}>Teams</TextLink>);
    const link = screen.getByRole("link", { name: "Teams" });
    expect(link).toHaveAttribute("data-router");
    expect(link).toHaveAttribute("href", "/teams");
  });
});

describe("VisuallyHidden", () => {
  it("adds sr-only, keeps the text accessible and passes props and ref through", async () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <button type="button">
        <svg aria-hidden />
        <VisuallyHidden ref={ref} className="scoped" id="vh">
          Delete source
        </VisuallyHidden>
      </button>,
    );
    expect(screen.getByRole("button", { name: "Delete source" })).toBeInTheDocument();
    expect(ref.current).toHaveClass("sr-only", "scoped");
    expect(ref.current).toHaveAttribute("id", "vh");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("renders as another element", async () => {
    render(<VisuallyHidden render={<h2 />}>Filters</VisuallyHidden>);
    await waitFor(() => expect(screen.getByRole("heading", { level: 2, name: "Filters" })).toHaveClass("sr-only"));
  });
});
