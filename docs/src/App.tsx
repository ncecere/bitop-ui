/*
 * The docs site shell. It is built entirely from bitop-ui components
 * (AppShell, CommandPalette, Select, ColorModeToggle, Toaster…).
 */
import { ArrowRight, BookOpen, Box, Download, Home, Moon, Palette } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppShell,
  Brand,
  Main,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarItem,
  SidebarNav,
  SidebarSection,
  TopBar,
} from "@/registry/bitop/ui/app-shell/app-shell";
import { ColorModeToggle, setColorMode, useColorMode } from "@/registry/bitop/ui/color-mode/color-mode";
import { CommandPalette, CommandPaletteTrigger, useCommandPaletteShortcut, type CommandGroup } from "@/registry/bitop/ui/command-palette/command-palette";
import { Select } from "@/registry/bitop/ui/select/select";
import { Toaster } from "@/registry/bitop/ui/toast/toast";
import { TooltipProvider } from "@/registry/bitop/ui/tooltip/tooltip";
import { docsByCategory, findDoc } from "./content";
import { ComponentPage } from "./pages/ComponentPage";
import { ComponentsIndexPage } from "./pages/ComponentsIndexPage";
import { HomePage } from "./pages/HomePage";
import { InstallationPage } from "./pages/InstallationPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ThemingPage } from "./pages/ThemingPage";
import { Link, RouterProvider, useRouter } from "./router";
import styles from "./App.module.css";

export type BrandTheme = "neutral" | "uf";
const BRAND_KEY = "bitop-docs-brand";

function readBrand(): BrandTheme {
  if (typeof document === "undefined") return "neutral";
  return document.documentElement.dataset.brand === "uf" ? "uf" : "neutral";
}

export function useBrand() {
  const [brand, setBrand] = useState<BrandTheme>(readBrand);
  useEffect(() => {
    const root = document.documentElement;
    if (brand === "uf") root.dataset.brand = "uf";
    else delete root.dataset.brand;
    try {
      localStorage.setItem(BRAND_KEY, brand);
    } catch {
      /* ignore */
    }
  }, [brand]);
  return [brand, setBrand] as const;
}

const pages = [
  { to: "/", label: "Introduction", icon: <Home aria-hidden /> },
  { to: "/installation", label: "Installation", icon: <Download aria-hidden /> },
  { to: "/theming", label: "Theming", icon: <Palette aria-hidden /> },
  { to: "/components", label: "All components", icon: <Box aria-hidden /> },
];

function Route() {
  const { path } = useRouter();
  if (path === "/") return <HomePage />;
  if (path === "/installation") return <InstallationPage />;
  if (path === "/theming") return <ThemingPage />;
  if (path === "/components") return <ComponentsIndexPage />;
  const m = path.match(/^\/components\/([a-z-]+)$/);
  const doc = m ? findDoc(m[1]!) : undefined;
  if (doc) return <ComponentPage key={doc.slug} doc={doc} />;
  return <NotFoundPage />;
}

function DocsShell() {
  const { path, navigate } = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [brand, setBrand] = useBrand();
  const { resolved } = useColorMode();
  const togglePalette = useCallback(() => setPaletteOpen((o) => !o), []);
  useCommandPaletteShortcut(togglePalette);
  const groups = useMemo(() => docsByCategory(), []);

  useEffect(() => {
    const doc = path.startsWith("/components/") ? findDoc(path.slice("/components/".length)) : undefined;
    const page = pages.find((p) => p.to === path);
    document.title = doc ? `${doc.title} · bitop-ui` : page && page.to !== "/" ? `${page.label} · bitop-ui` : "bitop-ui";
  }, [path]);

  const commands: CommandGroup[] = [
    {
      label: "Docs",
      items: pages.map((p) => ({ id: p.to, label: p.label, icon: <BookOpen aria-hidden />, hint: "Page", onSelect: () => navigate(p.to) })),
    },
    ...groups.map((g) => ({
      label: g.category,
      items: g.docs.map((d) => ({
        id: d.slug,
        label: d.title,
        icon: <ArrowRight aria-hidden />,
        hint: "Component",
        keywords: [d.slug],
        onSelect: () => navigate(`/components/${d.slug}`),
      })),
    })),
    {
      label: "Preferences",
      items: [
        { id: "dark", label: resolved === "dark" ? "Switch to light mode" : "Switch to dark mode", icon: <Moon aria-hidden />, keywords: ["theme", "dark", "light"], onSelect: () => setColorMode(resolved === "dark" ? "light" : "dark") },
        { id: "brand", label: brand === "uf" ? "Use the neutral theme" : "Use the UF theme", icon: <Palette aria-hidden />, keywords: ["theme", "brand", "uf", "neutral"], onSelect: () => setBrand(brand === "uf" ? "neutral" : "uf") },
      ],
    },
  ];

  return (
    <AppShell
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Brand name="bitop-ui" render={<Link to="/" />} />
          </SidebarHeader>
          <SidebarContent>
            <SidebarNav aria-label="Documentation">
              <SidebarSection label="Getting started">
                {pages.map((p) => (
                  <SidebarItem key={p.to} icon={p.icon} label={p.label} render={<Link to={p.to} />} />
                ))}
              </SidebarSection>
              {groups.map((g) => (
                <SidebarSection key={g.category} label={g.category}>
                  {g.docs.map((d) => (
                    <SidebarItem key={d.slug} label={d.title} render={<Link to={`/components/${d.slug}`} />} />
                  ))}
                </SidebarSection>
              ))}
            </SidebarNav>
          </SidebarContent>
        </Sidebar>
      }
      topbar={
        <TopBar
          start={<CommandPaletteTrigger onClick={() => setPaletteOpen(true)} label="Search docs…" className={styles.search} />}
          end={
            <>
              <Select
                label="Theme"
                hideLabel
                size="sm"
                value={brand}
                onValueChange={(v) => v && setBrand(v)}
                items={[
                  { value: "neutral", label: "Neutral theme" },
                  { value: "uf", label: "UF theme" },
                ]}
                className={styles.brandSelect}
              />
              <ColorModeToggle />
            </>
          }
        />
      }
    >
      <Main>
        <Route />
      </Main>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={commands} placeholder="Search components and pages…" />
      <Toaster />
    </AppShell>
  );
}

export function App({ initialPath }: { initialPath?: string }) {
  return (
    <RouterProvider initialPath={initialPath}>
      <TooltipProvider>
        <DocsShell />
      </TooltipProvider>
    </RouterProvider>
  );
}
