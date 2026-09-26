"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronRight, File, FileBraces, FileCode, FileImage, FileText, Folder, FolderOpen } from "lucide-react";
import {
  type ComponentPropsWithRef,
  type KeyboardEvent,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx, dataFlag } from "@/registry/bitop/lib/bitop-utils";
import styles from "./file-tree.module.css";

/*
 * FileTree: an expandable folder / file tree with WAI-ARIA tree semantics
 * (role="tree" / "treeitem" / "group") and the full tree keyboard model:
 *
 *   ↓ / ↑        next / previous visible item
 *   → / ←        open a folder, then move into it / close it, then move to its parent
 *   Home / End   first / last visible item
 *   Enter/Space  select the item (folders also open or close)
 *   *            open every sibling folder
 *   a–z          type-ahead to the next item whose name starts with the typed text
 *
 * One item is in the tab order at a time (roving tabindex). Folders are Base
 * UI Collapsibles rendered as <li role="treeitem">, so the group animates open
 * and closed children leave the DOM.
 *
 *   <FileTree label="Project files" defaultExpanded={["src"]} onSelect={open}>
 *     <FileTreeFolder path="src" name="src">
 *       <FileTreeFile path="src/index.ts" name="index.ts" />
 *     </FileTreeFolder>
 *     <FileTreeFile path="package.json" name="package.json" />
 *   </FileTree>
 */

export type FileTreeItemKind = "file" | "folder";

type FileTreeContextValue = {
  expanded: ReadonlySet<string>;
  setOpen: (path: string, open: boolean) => void;
  selectedPath: string | null;
  select: (path: string, kind: FileTreeItemKind) => void;
  focusedPath: string | null;
};

const FileTreeContext = createContext<FileTreeContextValue | null>(null);
const LevelContext = createContext(1);

function useFileTree(part: string): FileTreeContextValue {
  const ctx = useContext(FileTreeContext);
  if (!ctx) throw new Error(`${part} must be used inside <FileTree>`);
  return ctx;
}

const ITEM = '[role="treeitem"]';

/** Items whose ancestor folders are all open, in document order. */
function visibleItems(tree: HTMLElement): HTMLElement[] {
  return Array.from(tree.querySelectorAll<HTMLElement>(ITEM)).filter((item) => {
    let parent = item.parentElement?.closest<HTMLElement>(ITEM);
    while (parent && tree.contains(parent)) {
      if (parent.getAttribute("aria-expanded") !== "true") return false;
      parent = parent.parentElement?.closest<HTMLElement>(ITEM);
    }
    return true;
  });
}

export type FileTreeProps = Omit<ComponentPropsWithRef<"ul">, "onSelect" | "children" | "aria-label" | "role"> & {
  /** Accessible name of the tree, e.g. "Project files". */
  label: string;
  children: ReactNode;
  /** Open folder paths (controlled). */
  expanded?: string[];
  /** Initially open folder paths (uncontrolled). */
  defaultExpanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Selected item path (controlled); `null` for none. */
  selectedPath?: string | null;
  defaultSelectedPath?: string | null;
  /** Called when an item is clicked or activated with Enter / Space. */
  onSelect?: (path: string, kind: FileTreeItemKind) => void;
};

export function FileTree({
  label,
  children,
  expanded: expandedProp,
  defaultExpanded,
  onExpandedChange,
  selectedPath: selectedProp,
  defaultSelectedPath = null,
  onSelect,
  className,
  onKeyDown,
  onFocus,
  ref,
  ...props
}: FileTreeProps) {
  const [expandedState, setExpandedState] = useState<string[]>(defaultExpanded ?? []);
  const expandedList = expandedProp ?? expandedState;
  const expanded = useMemo(() => new Set(expandedList), [expandedList]);
  const [selectedState, setSelectedState] = useState<string | null>(defaultSelectedPath);
  const selectedPath = selectedProp !== undefined ? selectedProp : selectedState;
  const [focusedPath, setFocusedPath] = useState<string | null>(selectedPath);

  const treeRef = useRef<HTMLUListElement | null>(null);
  const typeahead = useRef({ text: "", timer: undefined as ReturnType<typeof setTimeout> | undefined });
  useEffect(() => () => clearTimeout(typeahead.current.timer), []);

  const setRef = useCallback(
    (node: HTMLUListElement | null) => {
      treeRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const setExpandedPaths = useCallback(
    (next: string[]) => {
      if (expandedProp === undefined) setExpandedState(next);
      onExpandedChange?.(next);
    },
    [expandedProp, onExpandedChange],
  );

  const setOpen = useCallback(
    (path: string, open: boolean) => {
      if (expanded.has(path) === open) return;
      setExpandedPaths(open ? [...expandedList, path] : expandedList.filter((p) => p !== path));
    },
    [expanded, expandedList, setExpandedPaths],
  );

  const select = useCallback(
    (path: string, kind: FileTreeItemKind) => {
      if (selectedProp === undefined) setSelectedState(path);
      onSelect?.(path, kind);
    },
    [selectedProp, onSelect],
  );

  // Keep exactly one visible item in the tab order, even after the focused
  // item was hidden (a controlled collapse) or on first render.
  useEffect(() => {
    const tree = treeRef.current;
    if (!tree) return;
    const items = visibleItems(tree);
    if (items.length > 0 && !items.some((i) => i.dataset.path === focusedPath)) {
      setFocusedPath(items[0]!.dataset.path ?? null);
    }
  });

  const ctx = useMemo<FileTreeContextValue>(
    () => ({ expanded, setOpen, selectedPath, select, focusedPath }),
    [expanded, setOpen, selectedPath, select, focusedPath],
  );

  function focusItem(item: HTMLElement | undefined) {
    if (!item) return;
    setFocusedPath(item.dataset.path ?? null);
    item.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    onKeyDown?.(event);
    const tree = treeRef.current;
    const item = (event.target as HTMLElement).closest<HTMLElement>(ITEM);
    if (event.defaultPrevented || !tree || !item || !tree.contains(item) || event.target !== item) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const items = visibleItems(tree);
    const index = items.indexOf(item);
    const path = item.dataset.path ?? "";
    const kind = (item.dataset.kind as FileTreeItemKind) ?? "file";
    const isOpen = item.getAttribute("aria-expanded") === "true";
    const parentItem = item.parentElement?.closest<HTMLElement>(ITEM);
    let handled = true;
    // Any non-character key ends a type-ahead run.
    if (event.key.length !== 1 || event.key === " ") typeahead.current.text = "";

    switch (event.key) {
      case "ArrowDown":
        focusItem(items[index + 1]);
        break;
      case "ArrowUp":
        focusItem(items[index - 1]);
        break;
      case "Home":
        focusItem(items[0]);
        break;
      case "End":
        focusItem(items[items.length - 1]);
        break;
      case "ArrowRight":
        if (kind === "folder" && !isOpen) setOpen(path, true);
        else if (kind === "folder") {
          const next = items[index + 1];
          if (next && next.parentElement?.closest(ITEM) === item) focusItem(next);
        }
        break;
      case "ArrowLeft":
        if (kind === "folder" && isOpen) setOpen(path, false);
        else if (parentItem && tree.contains(parentItem)) focusItem(parentItem);
        break;
      case "Enter":
      case " ":
        select(path, kind);
        if (kind === "folder") setOpen(path, !isOpen);
        break;
      case "*": {
        const siblings = Array.from(item.parentElement?.children ?? []).filter(
          (el): el is HTMLElement => el instanceof HTMLElement && el.getAttribute("aria-expanded") === "false",
        );
        const toOpen = siblings.map((el) => el.dataset.path ?? "").filter((p) => p && !expanded.has(p));
        if (toOpen.length) setExpandedPaths([...expandedList, ...toOpen]);
        break;
      }
      default:
        handled = event.key.length === 1 && event.key !== " " && typeAhead(event.key, items, index);
    }
    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function typeAhead(char: string, items: HTMLElement[], index: number): boolean {
    const state = typeahead.current;
    clearTimeout(state.timer);
    state.text += char.toLowerCase();
    state.timer = setTimeout(() => (state.text = ""), 500);
    // A repeated single character cycles through matches; a longer string refines from the current item.
    const repeated = state.text.split("").every((c) => c === state.text[0]);
    const query = repeated ? state.text[0]! : state.text;
    const start = repeated || state.text.length === 1 ? index + 1 : index;
    for (let i = 0; i < items.length; i++) {
      const candidate = items[(start + i) % items.length]!;
      if ((candidate.dataset.name ?? "").toLowerCase().startsWith(query)) {
        focusItem(candidate);
        break;
      }
    }
    return true;
  }

  return (
    <FileTreeContext.Provider value={ctx}>
      <ul
        {...props}
        ref={setRef}
        role="tree"
        aria-label={label}
        className={cx(styles.tree, className)}
        onKeyDown={handleKeyDown}
        onFocus={(event) => {
          onFocus?.(event);
          const item = (event.target as HTMLElement).closest<HTMLElement>(ITEM);
          if (item?.dataset.path !== undefined && item.dataset.path !== focusedPath) setFocusedPath(item.dataset.path);
        }}
      >
        <LevelContext.Provider value={1}>{children}</LevelContext.Provider>
      </ul>
    </FileTreeContext.Provider>
  );
}

/** A guess at a file's icon from its extension. */
export function fileIcon(name: string): ReactNode {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "";
  if (["ts", "tsx", "js", "jsx", "mjs", "cjs", "py", "go", "rs", "rb", "java", "css", "html", "sh"].includes(ext)) return <FileCode />;
  if (["json", "yaml", "yml", "toml"].includes(ext)) return <FileBraces />;
  if (["md", "mdx", "txt", "rst"].includes(ext)) return <FileText />;
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "avif", "ico"].includes(ext)) return <FileImage />;
  return <File />;
}

type ItemBaseProps = Omit<ComponentPropsWithRef<"li">, "children" | "role" | "onSelect"> & {
  /** Unique path, passed to `onSelect` and used in `expanded`. */
  path: string;
  /** Visible name; also the item's accessible name and type-ahead text. */
  name: string;
  /** Decorative icon (default: chosen from the extension / folder state). */
  icon?: ReactNode;
  /** Trailing text such as a git status or size; read after the name. */
  meta?: ReactNode;
};

function useItem(part: string, path: string, meta: ReactNode) {
  const tree = useFileTree(part);
  const level = useContext(LevelContext);
  const nameId = useId();
  const metaId = useId();
  return {
    tree,
    level,
    nameId,
    metaId,
    itemProps: {
      role: "treeitem",
      "aria-level": level,
      "aria-selected": tree.selectedPath === path,
      "aria-labelledby": meta ? `${nameId} ${metaId}` : nameId,
      tabIndex: tree.focusedPath === path ? 0 : -1,
      "data-path": path,
      "data-selected": dataFlag(tree.selectedPath === path),
    } as const,
  };
}

export type FileTreeFolderProps = ItemBaseProps & {
  /** Nested FileTreeFolder / FileTreeFile items. */
  children?: ReactNode;
};

export function FileTreeFolder({ path, name, icon, meta, className, children, ...props }: FileTreeFolderProps) {
  const { tree, level, nameId, metaId, itemProps } = useItem("FileTreeFolder", path, meta);
  const open = tree.expanded.has(path);
  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(next) => tree.setOpen(path, next)}
      render={<li {...props} {...itemProps} aria-expanded={open} data-kind="folder" data-name={name} />}
      className={cx(styles.item, className)}
    >
      <div
        className={styles.row}
        onClick={() => {
          tree.select(path, "folder");
          tree.setOpen(path, !open);
        }}
      >
        <ChevronRight aria-hidden className={styles.chevron} />
        <span aria-hidden className={styles.icon} data-kind="folder">
          {icon ?? (open ? <FolderOpen /> : <Folder />)}
        </span>
        <span id={nameId} className={styles.name}>
          {name}
        </span>
        {meta && (
          <span id={metaId} className={styles.meta}>
            {meta}
          </span>
        )}
      </div>
      <Collapsible.Panel render={<ul role="group" />} className={styles.group}>
        <LevelContext.Provider value={level + 1}>{children}</LevelContext.Provider>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

export type FileTreeFileProps = ItemBaseProps;

export function FileTreeFile({ path, name, icon, meta, className, ...props }: FileTreeFileProps) {
  const { tree, nameId, metaId, itemProps } = useItem("FileTreeFile", path, meta);
  return (
    <li {...props} {...itemProps} data-kind="file" data-name={name} className={cx(styles.item, className)}>
      <div className={styles.row} onClick={() => tree.select(path, "file")}>
        <span aria-hidden className={styles.spacer} />
        <span aria-hidden className={styles.icon} data-kind="file">
          {icon ?? fileIcon(name)}
        </span>
        <span id={nameId} className={styles.name}>
          {name}
        </span>
        {meta && (
          <span id={metaId} className={styles.meta}>
            {meta}
          </span>
        )}
      </div>
    </li>
  );
}
