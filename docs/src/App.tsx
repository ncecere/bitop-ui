/*
 * The docs site shell. It is built entirely from bitop-ui components
 * (AppShell, CommandPalette, ColorModeToggle, Toaster…).
 */
import { ArrowRight, BookOpen, Box, Download, Home, MessagesSquare, Moon, Palette } from "lucide-react";
import { type ComponentType, lazy, type LazyExoticComponent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import type { CommandGroup } from "@/registry/bitop/ui/command-palette/command-palette";
import { Toaster } from "@/registry/bitop/ui/toast/toast";
import { TooltipProvider } from "@/registry/bitop/ui/tooltip/tooltip";
import { docsByCategory, findDoc } from "./content";
import type { DocMeta } from "./content/types";
import { CommandPaletteTrigger, LazyCommandPalette, useCommandPaletteShortcut } from "./kit/lazy-command-palette";
import { ComponentsIndexPage } from "./pages/ComponentsIndexPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PageLoadError, PageLoading } from "./pages/PageLoading";
import { Link, RouterProvider, routeFocusTarget, useRouter } from "./router";
import styles from "./App.module.css";

const pages = [
  { to: "/", label: "Introduction", icon: <Home aria-hidden /> },
  { to: "/installation", label: "Installation", icon: <Download aria-hidden /> },
  { to: "/theming", label: "Theming", icon: <Palette aria-hidden /> },
  { to: "/components", label: "All components", icon: <Box aria-hidden /> },
];

/** The full chat example, listed first in the AI section. */
const CHAT_EXAMPLE = { to: "/examples/chat", label: "Chat example" };

// Code-split routes. Home and the components index stay in the entry chunk so
// the landing page and the page list render without a round trip.
const loadComponentPage = () => import("./pages/ComponentPage");
const ChatExamplePage = lazy(() => import("./pages/ChatExamplePage").then((m) => ({ default: m.ChatExamplePage })));
const InstallationPage = lazy(() => import("./pages/InstallationPage").then((m) => ({ default: m.InstallationPage })));
const ThemingPage = lazy(() => import("./pages/ThemingPage").then((m) => ({ default: m.ThemingPage })));

/** A component page: suspends until its content module (own chunk) has loaded. */
const docPages = new Map<string, LazyExoticComponent<ComponentType>>();
function docPage(meta: DocMeta) {
  let Page = docPages.get(meta.slug);
  if (!Page) {
    Page = lazy(async () => {
      try {
        // The page template and the page's content load in parallel.
        const [{ ComponentPage }, doc] = await Promise.all([loadComponentPage(), meta.load()]);
        return { default: () => <ComponentPage doc={doc} /> };
      } catch (error) {
        docPages.delete(meta.slug); // lazy() caches failures; let a later visit retry
        throw error;
      }
    });
    docPages.set(meta.slug, Page);
  }
  return Page;
}

function DocRoute({ meta }: { meta: DocMeta }) {
  const Page = docPage(meta);
  return <Page />;
}

/** Start fetching a page's chunks when the pointer heads for its link. */
const preload = (meta: DocMeta) => () => {
  void loadComponentPage();
  void meta.load().catch(() => {});
};

let initialHashHandled = false;
/**
 * On a deep link like /components/button#props the target only exists once
 * the page chunk has rendered, too late for the browser's own fragment
 * scroll, so do it once here. (Client navigations are handled by the router.)
 */
function InitialHashScroll() {
  useEffect(() => {
    if (initialHashHandled) return;
    initialHashHandled = true;
    const hash = window.location.hash.slice(1);
    if (hash) document.getElementById(decodeURIComponent(hash))?.scrollIntoView?.();
  }, []);
  return null;
}

function Route() {
  const { path } = useRouter();
  if (path === "/") return <HomePage />;
  if (path === "/installation") return <InstallationPage />;
  if (path === "/theming") return <ThemingPage />;
  if (path === "/components") return <ComponentsIndexPage />;
  if (path === CHAT_EXAMPLE.to) return <ChatExamplePage />;
  const m = path.match(/^\/components\/([a-z0-9-]+)$/);
  const doc = m ? findDoc(m[1]!) : undefined;
  if (doc) return <DocRoute key={doc.slug} meta={doc} />;
  return <NotFoundPage />;
}

function DocsShell() {
  const { path, navigate: routerNavigate } = useRouter();
  const [paletteOpen, setPaletteOpenState] = useState(false);
  // The palette's chunk loads the first time it opens; it stays mounted after.
  const [paletteMounted, setPaletteMounted] = useState(false);
  const setPaletteOpen = useCallback((open: boolean | ((o: boolean) => boolean)) => {
    setPaletteMounted(true);
    setPaletteOpenState(open);
  }, []);
  // A palette command that navigates hands focus to the new page's heading
  // instead of back to the search button (the router focuses it too).
  const paletteNavigated = useRef(false);
  const navigate = (to: string) => {
    paletteNavigated.current = true;
    routerNavigate(to);
  };
  const paletteFinalFocus = () => {
    if (!paletteNavigated.current) return true;
    paletteNavigated.current = false;
    return routeFocusTarget() ?? true;
  };
  const { resolved } = useColorMode();
  const togglePalette = useCallback(() => setPaletteOpen((o) => !o), [setPaletteOpen]);
  useCommandPaletteShortcut(togglePalette);
  const groups = useMemo(() => docsByCategory(), []);

  useEffect(() => {
    const doc = path.startsWith("/components/") ? findDoc(path.slice("/components/".length)) : undefined;
    const page = [...pages, CHAT_EXAMPLE].find((p) => p.to === path);
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
      label: "Examples",
      items: [{ id: CHAT_EXAMPLE.to, label: CHAT_EXAMPLE.label, icon: <MessagesSquare aria-hidden />, hint: "Example", keywords: ["ai", "chat", "rag"], onSelect: () => navigate(CHAT_EXAMPLE.to) }],
    },
    {
      label: "Preferences",
      items: [
        { id: "dark", label: resolved === "dark" ? "Switch to light mode" : "Switch to dark mode", icon: <Moon aria-hidden />, keywords: ["theme", "dark", "light"], onSelect: () => setColorMode(resolved === "dark" ? "light" : "dark") },
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
                  {g.category === "AI" && <SidebarItem icon={<MessagesSquare aria-hidden />} label={CHAT_EXAMPLE.label} render={<Link to={CHAT_EXAMPLE.to} />} />}
                  {g.docs.map((d) => (
                    <SidebarItem key={d.slug} label={d.title} render={<Link to={`/components/${d.slug}`} onPointerEnter={preload(d)} />} />
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
              <ColorModeToggle />
            </>
          }
        />
      }
    >
      <Main>
        <PageLoadError path={path}>
          <Suspense fallback={<PageLoading />}>
            <Route />
            <InitialHashScroll />
          </Suspense>
        </PageLoadError>
      </Main>
      <LazyCommandPalette
        mounted={paletteMounted}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        groups={commands}
        placeholder="Search components and pages…"
        finalFocus={paletteFinalFocus}
      />
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
