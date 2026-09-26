import { Component, type ReactNode } from "react";
import { Button } from "@/registry/bitop/ui/button/button";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { Loading } from "@/registry/bitop/ui/spinner/spinner";
import styles from "./pages.module.css";

/**
 * Suspense fallback while a page chunk loads. Announced politely (role=status)
 * straight away, but only faded in after a short delay so a fast load doesn't
 * flash a spinner. It reserves the page's height to limit layout shift.
 */
export function PageLoading() {
  return (
    <div className={styles.pageLoading}>
      <Loading label="Loading page…" />
    </div>
  );
}

type PageLoadErrorProps = { path: string; children: ReactNode };
type PageLoadErrorState = { error: unknown; path: string };

/**
 * Shown when a page chunk fails to load (offline, or a stale deploy). Resets
 * on navigation. (Not keyed by path: remounting the Suspense boundary inside
 * would make every navigation flash the fallback.)
 */
export class PageLoadError extends Component<PageLoadErrorProps, PageLoadErrorState> {
  state: PageLoadErrorState = { error: undefined, path: this.props.path };

  static getDerivedStateFromError(error: unknown): Partial<PageLoadErrorState> {
    return { error };
  }

  static getDerivedStateFromProps(props: PageLoadErrorProps, state: PageLoadErrorState): Partial<PageLoadErrorState> | null {
    return props.path === state.path ? null : { error: undefined, path: props.path };
  }

  render() {
    if (this.state.error === undefined) return this.props.children;
    return (
      <EmptyState
        titleAs="h1"
        title="This page didn't load"
        description="Check your connection and try again. If the site was just updated, reloading fetches the new version."
        action={<Button onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }
}
