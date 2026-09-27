/*
 * AppShell's Sidebar: an <aside> landmark with scrolling content.
 */
import { act, render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { AppShell, Sidebar, SidebarContent, SidebarFooter, SidebarItem, SidebarNav, SidebarSection } from "@/registry/bitop/ui/app-shell/app-shell";

describe("AppShell sidebar", () => {
  it("is a named <aside> whose content scrolls between header and footer", async () => {
    const { container } = render(
      <AppShell
        skipTo={null}
        sidebar={
          <Sidebar label="Admin sidebar">
            <SidebarContent>
              <SidebarNav aria-label="Admin">
                <SidebarSection>
                  <SidebarItem href="#a" label="Overview" current />
                </SidebarSection>
              </SidebarNav>
            </SidebarContent>
            <SidebarFooter>
              <button type="button">Account</button>
            </SidebarFooter>
          </Sidebar>
        }
      >
        <main>page</main>
      </AppShell>,
    );
    const aside = screen.getByRole("complementary", { name: "Admin sidebar" });
    expect(aside.tagName).toBe("ASIDE");
    const nav = within(aside).getByRole("navigation", { name: "Admin" });
    // The nav sits inside the scroll area's viewport; the footer is outside it.
    const viewport = nav.closest("[data-base-ui-scroll-area-viewport], [class*='viewport']");
    expect(viewport).toBeInTheDocument();
    expect(viewport!.contains(within(aside).getByRole("button", { name: "Account" }))).toBe(false);
    await act(async () => {});
    expect(await axe(container)).toHaveNoViolations();
  });

  it("defaults the landmark name to Sidebar", () => {
    render(
      <Sidebar>
        <SidebarContent>
          <p>x</p>
        </SidebarContent>
      </Sidebar>,
    );
    expect(screen.getByRole("complementary", { name: "Sidebar" })).toBeInTheDocument();
  });
});
