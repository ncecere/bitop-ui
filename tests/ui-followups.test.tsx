/*
 * Regressions reported by the ragd integration:
 *   - vertical ScrollAreas let long lines widen their content, so sidebar
 *     labels were clipped instead of ellipsised;
 *   - ColorField's hex input cut off its "#rrggbb (default)" placeholder;
 *   - Resizable panels without a defaultSize got a ~1% share until layout.
 * jsdom has no layout engine, so these check the styles that drive layout.
 */
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { AppShell, Sidebar, SidebarContent, SidebarItem, SidebarNav, SidebarSection } from "@/registry/bitop/ui/app-shell/app-shell";
import { ColorField } from "@/registry/bitop/ui/color-field/color-field";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/registry/bitop/ui/resizable/resizable";
import { ScrollArea } from "@/registry/bitop/ui/scroll-area/scroll-area";

describe("ScrollArea content width", () => {
  // Base UI's Content element wraps the children directly.
  const content = (text: string) => screen.getByText(text).parentElement!;

  it("keeps vertical-only content as wide as the viewport, so long lines can ellipsise", () => {
    render(
      <ScrollArea label="Navigation" maxHeight="10rem">
        <span>A very long label that must be truncated</span>
      </ScrollArea>,
    );
    expect(content("A very long label that must be truncated").style.minWidth).toBe("0px");
  });

  it.each(["horizontal", "both"] as const)("still sizes %s content to fit, so it can scroll sideways", (orientation) => {
    render(
      <ScrollArea label="Wide table" orientation={orientation}>
        <span>wide</span>
      </ScrollArea>,
    );
    expect(content("wide").style.minWidth).toBe("fit-content");
  });
});

describe("AppShell sidebar labels", () => {
  it("sit in viewport-wide scroll content, so their ellipsis applies", () => {
    const long = "How do I order an official transcript for a former student?";
    render(
      <AppShell
        skipTo={null}
        sidebar={
          <Sidebar label="Workspace sidebar">
            <SidebarContent>
              <SidebarNav aria-label="Recent">
                <SidebarSection>
                  <SidebarItem href="#c1" label={long} />
                </SidebarSection>
              </SidebarNav>
            </SidebarContent>
          </Sidebar>
        }
      >
        <main>page</main>
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Recent" });
    // Walk up to the scroll content (Base UI's Content wraps SidebarContent's children).
    let el: HTMLElement | null = nav;
    while (el && el.style.minWidth === "") el = el.parentElement;
    expect(el?.style.minWidth).toBe("0px");
  });
});

describe("ColorField hex input width", () => {
  it("is sized in characters to fit the default placeholder", () => {
    render(<ColorField value="" onValueChange={() => {}} defaultColor="#1d4ed8" contrastWith="#ffffff" />);
    const input = screen.getByPlaceholderText("#1d4ed8 (default)");
    expect(input.style.getPropertyValue("--color-field-hex-chars")).toBe(String("#1d4ed8 (default)".length));
  });

  it("never gets narrower than a full #rrggbb value", () => {
    render(<ColorField value="#abcdef" onValueChange={() => {}} defaultColor="red" contrastWith="#ffffff" />);
    const input = screen.getByRole("textbox");
    expect(Number(input.style.getPropertyValue("--color-field-hex-chars"))).toBeGreaterThanOrEqual(7);
  });
});

describe("Resizable before the first layout", () => {
  const group = () => (
    <ResizablePanelGroup>
      <ResizablePanel id="side" defaultSize={30}>
        Side
      </ResizablePanel>
      <ResizableHandle label="Resize side" />
      <ResizablePanel id="main">Main</ResizablePanel>
    </ResizablePanelGroup>
  );

  it("gives a defaultSize panel its percentage and leaves the rest to panels without one (server render)", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(group());
    const side = host.querySelector<HTMLElement>('[data-panel-id="side"]')!;
    const main = host.querySelector<HTMLElement>('[data-panel-id="main"]')!;
    // Not a flex weight of 30 next to main's default weight of 1 (main would get ~3%).
    expect(side.style.getPropertyValue("--panel-size")).toBe("");
    expect(side.style.getPropertyValue("--panel-default-size")).toBe("30");
    expect(side).toHaveAttribute("data-size-pending");
    expect(main.style.getPropertyValue("--panel-size")).toBe("");
    expect(main).not.toHaveAttribute("data-size-pending");
  });

  it("switches to the computed layout once mounted", () => {
    const { container } = render(group());
    const side = container.querySelector<HTMLElement>('[data-panel-id="side"]')!;
    const main = container.querySelector<HTMLElement>('[data-panel-id="main"]')!;
    expect(side.style.getPropertyValue("--panel-size")).toBe("30");
    expect(main.style.getPropertyValue("--panel-size")).toBe("70");
    expect(side).not.toHaveAttribute("data-size-pending");
  });
});
