"use client";

import type { ReactNode } from "react";
import { ErrorAlert, type ErrorAlertProps } from "@/registry/bitop/ui/alert/alert";
import { EmptyState } from "@/registry/bitop/ui/empty-state/empty-state";
import { Loading } from "@/registry/bitop/ui/spinner/spinner";
import { cx } from "@/registry/bitop/lib/bitop-utils";
import styles from "./query-state.module.css";

/*
 * QueryState: the loading / error / empty / content switch every data view
 * repeats. Pass the states directly, or a TanStack-Query-like result:
 *
 *   <QueryState query={projects} emptyTitle="No projects yet">
 *     {(data) => <ProjectTable rows={data} />}
 *   </QueryState>
 *
 * Order: loading, then error, then empty, then the children. With `query`,
 * "loading" means pending *without data*, so a background refetch (or kept
 * previous/placeholder data) keeps the current content on screen instead of
 * flashing a spinner, and a failed refetch shows the error above the last
 * good data instead of replacing it. Nothing here imports TanStack Query.
 */

/** The subset of a TanStack Query result (or SWR-style object) that QueryState reads. */
export type QueryLike<TData> = {
  isPending?: boolean;
  isLoading?: boolean;
  /** When true during an error, the retry button shows a spinner. */
  isFetching?: boolean;
  error?: unknown;
  data?: TData;
  refetch?: () => unknown;
};

export type QueryStateProps<TData = unknown> = {
  /** Derive loading, error, empty and retry from a query result. Explicit props below win. */
  query?: QueryLike<TData>;
  /** With `query`: decides whether loaded data is empty. Default: `null` or an empty array. */
  isEmpty?: (data: NonNullable<TData>) => boolean;

  loading?: boolean;
  /** Any truthy value shows an ErrorAlert (status-aware titles via `describeError`). */
  error?: unknown;
  empty?: boolean;
  /** Shows a retry button on the error. Defaults to `query.refetch`. */
  onRetry?: () => void;
  retryLabel?: ReactNode;
  /** App-specific error mapping, passed to ErrorAlert. */
  describeError?: ErrorAlertProps["describe"];

  /** Visible and announced loading text. Default "Loading…". */
  loadingLabel?: ReactNode;
  /** Replaces the spinner, e.g. skeleton rows. `loadingLabel` is still announced to screen readers. */
  loadingFallback?: ReactNode;

  /** Replaces the default EmptyState. */
  emptyState?: ReactNode;
  /** Default "Nothing here yet". */
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;

  /** Class for the loading / error / empty wrapper (the content is rendered as-is). */
  className?: string;
  /** The content. A function is called only when there is data to show (it receives `query.data`). */
  children: ReactNode | ((data: NonNullable<TData>) => ReactNode);
};

const isEmptyDefault = (data: unknown) => data === null || (Array.isArray(data) && data.length === 0);

/** Switches between a loading indicator, an error alert, an empty state and the content. */
export function QueryState<TData = unknown>(props: QueryStateProps<TData>) {
  const { query, isEmpty = isEmptyDefault, retryLabel, describeError, loadingLabel = "Loading…", loadingFallback, className, children } = props;
  const data = query?.data;
  const hasData = data !== undefined;
  const queryError = query?.error ?? undefined;

  const loading = props.loading ?? (query ? !hasData && !queryError && Boolean(query.isPending ?? query.isLoading) : false);
  const error = props.error !== undefined ? props.error : queryError;
  const empty = props.empty ?? (query && hasData ? data === null || isEmpty(data as NonNullable<TData>) : false);
  const refetch = query?.refetch;
  const onRetry = props.onRetry ?? (refetch ? () => void refetch() : undefined);

  if (loading) {
    if (loadingFallback === undefined) return <Loading label={loadingLabel} data-query-state="loading" className={className} />;
    return (
      <div aria-busy="true" data-query-state="loading" className={className}>
        <span role="status" className="sr-only">
          {loadingLabel}
        </span>
        {loadingFallback}
      </div>
    );
  }

  const alert = error ? (
    <ErrorAlert error={error} onRetry={onRetry} retryLabel={retryLabel} retrying={Boolean(query?.isFetching)} describe={describeError} />
  ) : null;

  if (error) {
    // A failed background refetch keeps the last good data (as TanStack Query
    // does): show it with the error above instead of blanking the page.
    const stale = query && hasData && !empty ? renderContent(children, data) : null;
    if (stale !== null) {
      return (
        <>
          <div data-query-state="error" className={cx(styles.error, className)}>
            {alert}
          </div>
          {stale}
        </>
      );
    }
    return (
      <div data-query-state="error" className={cx(styles.error, className)}>
        {alert}
      </div>
    );
  }

  if (empty) {
    return (
      <div data-query-state="empty" className={className}>
        {props.emptyState ?? (
          <EmptyState title={props.emptyTitle ?? "Nothing here yet"} description={props.emptyDescription} icon={props.emptyIcon} action={props.emptyAction} />
        )}
      </div>
    );
  }

  if (typeof children !== "function") return <>{children}</>;
  // A render function only runs with data (e.g. a query that is disabled and idle renders nothing).
  if (query && !hasData) return null;
  return <>{renderContent(children, data)}</>;
}

function renderContent<TData>(children: QueryStateProps<TData>["children"], data: TData | undefined): ReactNode {
  return typeof children === "function" ? children(data as NonNullable<TData>) : children;
}
