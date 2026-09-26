#!/usr/bin/env node
// @ts-check
/*
 * bitop: copy bitop-ui components into your project as source you own.
 *
 *   bitop add button dialog          install items and everything they depend on
 *   bitop add button --diff          show what would change, write nothing
 *   bitop update                     refresh installed items you haven't edited
 *   bitop list                       items the registry offers
 *   bitop init --registry <source>   write components.json
 *
 * Configuration comes from components.json in the project (the file shadcn
 * uses, so existing projects keep working): `aliases.ui` / `aliases.lib`
 * decide where files go and how imports are rewritten, and
 * `registries["@bitop"]` says where items come from. A registry source is
 *
 *   - a local checkout of bitop-ui:     "../bitop-ui"            (no build, no server)
 *   - a built registry directory:       "../bitop-ui/public/r"
 *   - a URL or path template:           "https://host/bitop-ui/r/{name}.json"
 *
 * Installed files and their hashes are recorded in bitop-lock.json, so
 * `update` can tell your edits apart from upstream changes.
 *
 * No dependencies: Node >= 20.19.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const VERSION = "0.1.0";
const NAME_RE = /^[a-z][a-z0-9-]*$/;
const TARGET_RE = /^@(ui|lib)(\/[a-z0-9][a-z0-9._-]*)+$/;
const LOCK_FILE = "bitop-lock.json";
const CODE_FILE = /\.(tsx?|jsx?|mts|cts)$/;

class CliError extends Error {}

/* ---------------- small utilities ---------------- */

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** JSON with comments and trailing commas (tsconfig), without touching strings. */
export function parseJsonc(text) {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === "\\" ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else out += c;
  }
  // Remove trailing commas only outside strings (",}" can be literal text).
  let json = "";
  for (let i = 0; i < out.length; i++) {
    if (out[i] === '"') {
      let j = i + 1;
      while (j < out.length && out[j] !== '"') j += out[j] === "\\" ? 2 : 1;
      json += out.slice(i, j + 1);
      i = j;
    } else if (out[i] !== "," || !/^\s*[}\]]/.test(out.slice(i + 1))) json += out[i];
  }
  return JSON.parse(json);
}

const readJsonFile = (file) => parseJsonc(fs.readFileSync(file, "utf8"));

function isInside(parent, child) {
  const rel = path.relative(parent, child);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

/** Check every existing segment, including dangling symlinks, before any writes. */
function assertSafePath(root, target) {
  if (!isInside(root, target)) throw new CliError(`Refusing path outside project: ${target}`);
  const parts = path.relative(root, target).split(path.sep).filter(Boolean);
  let current = root;
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new CliError(`${current} is a symlink; refusing to write through it`);
    if (stat && index < parts.length - 1 && !stat.isDirectory()) throw new CliError(`${current} is not a directory`);
  }
}

function findUp(start, names) {
  let dir = start;
  for (;;) {
    for (const name of names) if (fs.existsSync(path.join(dir, name))) return path.join(dir, name);
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Line-based unified diff (LCS), enough for component-sized files. */
export function unifiedDiff(before, after, label, context = 3) {
  const splitLines = (text) => text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  // Keep line endings in the comparison, but don't invent a line after a final LF.
  const a = splitLines(before);
  const b = splitLines(after);
  const n = a.length;
  const m = b.length;
  // Bound quadratic work; large files fall back to a whole-file replacement diff.
  const lcs = (n + 1) * (m + 1) <= 4_000_000 ? new Uint32Array((n + 1) * (m + 1)) : null;
  const at = (i, j) => i * (m + 1) + j;
  if (lcs) for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[at(i, j)] = a[i] === b[j] ? lcs[at(i + 1, j + 1)] + 1 : Math.max(lcs[at(i + 1, j)], lcs[at(i, j + 1)]);
    }
  }
  // Each op remembers how many lines of a and b came before it (for hunk headers).
  /** @type {{ op: " " | "-" | "+", text: string, aPos: number, bPos: number }[]} */
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    const pos = { aPos: i, bPos: j };
    if (lcs && i < n && j < m && a[i] === b[j]) {
      ops.push({ op: " ", text: a[i], ...pos });
      i++;
      j++;
    } else if (i < n && (j === m || !lcs || lcs[at(i + 1, j)] >= lcs[at(i, j + 1)])) {
      // Removals first, as in `diff -u`.
      ops.push({ op: "-", text: a[i], ...pos });
      i++;
    } else {
      ops.push({ op: "+", text: b[j], ...pos });
      j++;
    }
  }
  const changed = ops.map((o, k) => (o.op !== " " ? k : -1)).filter((k) => k >= 0);
  if (!changed.length) return "";
  const lines = [`--- ${label} (yours)`, `+++ ${label} (registry)`];
  let k = 0;
  while (k < changed.length) {
    const start = Math.max(0, changed[k] - context);
    let end = Math.min(ops.length - 1, changed[k] + context);
    while (k + 1 < changed.length && changed[k + 1] - context <= end + 1) end = Math.min(ops.length - 1, changed[++k] + context);
    k++;
    const hunk = ops.slice(start, end + 1);
    const aLen = hunk.filter((o) => o.op !== "+").length;
    const bLen = hunk.filter((o) => o.op !== "-").length;
    // Unified format: a zero-length side names the line before the hunk.
    const aStart = hunk[0].aPos + (aLen ? 1 : 0);
    const bStart = hunk[0].bPos + (bLen ? 1 : 0);
    lines.push(`@@ -${aStart},${aLen} +${bStart},${bLen} @@`);
    for (const o of hunk) {
      lines.push(`${o.op}${o.text.endsWith("\n") ? o.text.slice(0, -1) : o.text}`);
      if (!o.text.endsWith("\n")) lines.push("\\ No newline at end of file");
    }
  }
  return lines.join("\n");
}

/* ---------------- configuration ---------------- */

/**
 * Where an import alias lives on disk, from tsconfig `paths` (tsconfig.json,
 * then tsconfig.app.json, as Vite templates split them). Falls back to
 * "@/x" → "src/x".
 */
export function resolveAliasDir(cwd, alias) {
  for (const name of ["tsconfig.json", "tsconfig.app.json", "jsconfig.json"]) {
    const file = path.join(cwd, name);
    if (!fs.existsSync(file)) continue;
    let options;
    try {
      options = readJsonFile(file).compilerOptions ?? {};
    } catch {
      continue;
    }
    const baseDir = path.resolve(cwd, options.baseUrl ?? ".");
    // Match TypeScript's precedence: exact aliases, then longest wildcard prefix.
    const entries = Object.entries(options.paths ?? {}).sort(([a], [b]) => {
      const wildcardOrder = Number(a.endsWith("/*")) - Number(b.endsWith("/*"));
      return wildcardOrder || b.length - a.length;
    });
    for (const [key, targets] of entries) {
      const target = Array.isArray(targets) ? targets[0] : undefined;
      if (typeof target !== "string") continue;
      if (key.endsWith("/*") && target.endsWith("/*")) {
        const prefix = key.slice(0, -1);
        if (alias.startsWith(prefix)) return path.resolve(baseDir, target.slice(0, -1) + alias.slice(prefix.length));
      } else if (key === alias) return path.resolve(baseDir, target);
    }
  }
  if (alias.startsWith("@/")) return path.resolve(cwd, "src", alias.slice(2));
  throw new CliError(`Can't find where the alias "${alias}" points: add it to tsconfig.json "paths", or set "bitop.paths" in components.json.`);
}

function loadConfig(cwd, opts) {
  const file = path.join(cwd, "components.json");
  const config = fs.existsSync(file) ? readJsonFile(file) : null;
  const registry = opts.registry ?? config?.registries?.["@bitop"];
  if (!registry) {
    throw new CliError(
      config
        ? `components.json has no "registries": { "@bitop": … } entry. Add one, or pass --registry.`
        : `No components.json in ${cwd}. Run "bitop init --registry <source>" first, or pass --registry.`,
    );
  }
  const aliases = { ui: config?.aliases?.ui ?? "@/components/ui", lib: config?.aliases?.lib ?? "@/lib" };
  for (const [key, value] of Object.entries(aliases)) {
    if (typeof value !== "string" || !/^[@~#\w][\w@~#/.-]*$/.test(value) || value.split("/").includes("..")) {
      throw new CliError(`components.json aliases.${key} is not a valid import path: ${value}`);
    }
  }
  const paths = config?.bitop?.paths ?? {};
  const dirs = {
    ui: paths.ui ? path.resolve(cwd, paths.ui) : resolveAliasDir(cwd, aliases.ui),
    lib: paths.lib ? path.resolve(cwd, paths.lib) : resolveAliasDir(cwd, aliases.lib),
  };
  for (const dir of Object.values(dirs)) assertSafePath(cwd, dir);
  return { cwd, registry: String(registry), aliases, dirs };
}

/* ---------------- registry sources ---------------- */

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(30_000), headers: { accept: "application/json" } });
  } catch (error) {
    throw new CliError(`Could not reach ${url}: ${error instanceof Error ? error.message : error}`);
  }
  if (!res.ok) throw new CliError(`${url} returned ${res.status} ${res.statusText}`);
  try {
    return await res.json();
  } catch {
    throw new CliError(`${url} is not JSON`);
  }
}

function readJsonOrThrow(file, what) {
  if (!fs.existsSync(file)) throw new CliError(`${what} not found: ${file}`);
  return readJsonFile(file);
}

/** A regular file inside `root` (no symlinks), or an error. */
function readSourceFile(root, rel) {
  if (typeof rel !== "string" || !rel.startsWith("registry/bitop/") || rel.split("/").includes("..")) {
    throw new CliError(`Refusing registry file path ${rel}`);
  }
  const abs = path.join(root, rel);
  assertSafePath(root, abs);
  const stat = fs.lstatSync(abs, { throwIfNoEntry: false });
  if (!stat || stat.isSymbolicLink() || !stat.isFile() || !isInside(fs.realpathSync(path.join(root, "registry/bitop")), fs.realpathSync(abs))) {
    throw new CliError(`Registry file ${rel} must be a regular file inside registry/bitop`);
  }
  return fs.readFileSync(abs, "utf8");
}

/**
 * Opens a registry source. Returns { describe, item(name), index() } where
 * item() resolves to a registry item with file contents.
 */
export function openRegistry(spec, cwd) {
  if (/^https?:\/\//i.test(spec)) {
    if (!spec.includes("{name}")) throw new CliError(`A registry URL needs a {name} placeholder, e.g. https://host/bitop-ui/r/{name}.json`);
    return {
      describe: spec,
      item: (name) => fetchJson(spec.replaceAll("{name}", name)),
      index: () => {
        if (!spec.endsWith("{name}.json")) throw new CliError(`Can't list items: the registry URL doesn't end in {name}.json`);
        return fetchJson(spec.slice(0, -"{name}.json".length) + "registry.json");
      },
    };
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(spec) && !/^file:/i.test(spec) && !/^[a-z]:[\\/]/i.test(spec)) {
    throw new CliError(`Unsupported registry source ${spec}: use an http(s) URL or a local path`);
  }
  // fileURLToPath decodes %7Bname%7D back to {name}.
  const local = path.resolve(cwd, /^file:/i.test(spec) ? fileURLToPath(spec) : spec);

  if (local.includes("{name}")) {
    return {
      describe: local,
      item: async (name) => readJsonOrThrow(local.replaceAll("{name}", name), `Registry item "${name}"`),
      index: async () => {
        if (!local.endsWith("{name}.json")) throw new CliError(`Can't list items: the registry path doesn't end in {name}.json`);
        return readJsonOrThrow(local.slice(0, -"{name}.json".length) + "registry.json", "Registry index");
      },
    };
  }

  // A bitop-ui checkout: read registry.json and the sources directly (nothing to build or serve).
  if (fs.existsSync(path.join(local, "registry.json")) && fs.existsSync(path.join(local, "registry/bitop"))) {
    const registry = readJsonFile(path.join(local, "registry.json"));
    const byName = new Map((registry.items ?? []).map((i) => [i.name, i]));
    return {
      describe: `${local} (checkout)`,
      item: async (name) => {
        const item = byName.get(name);
        if (!item) throw new CliError(`Registry item "${name}" not found in ${local}/registry.json`);
        return { ...item, files: (item.files ?? []).map((f) => ({ ...f, content: readSourceFile(local, f.path) })) };
      },
      index: async () => registry,
    };
  }

  // A built registry directory (public/r or dist/r).
  if (fs.existsSync(path.join(local, "registry.json"))) {
    return {
      describe: local,
      item: async (name) => readJsonOrThrow(path.join(local, `${name}.json`), `Registry item "${name}"`),
      index: async () => readJsonFile(path.join(local, "registry.json")),
    };
  }
  throw new CliError(`${local} is neither a bitop-ui checkout nor a built registry directory (no registry.json)`);
}

/** "@bitop/button", "button" or ".../r/button.json" → "button". */
export function itemName(ref) {
  const m = /^@bitop\/(.+)$/.exec(ref) ?? /\/r\/([^/]+)\.json$/.exec(ref) ?? /^([^/@:]+)$/.exec(ref);
  const name = m?.[1];
  if (!name || !NAME_RE.test(name)) throw new CliError(`Not a registry item name: ${ref}`);
  return name;
}

function checkItem(name, item) {
  if (!item || typeof item !== "object" || item.name !== name) throw new CliError(`Registry returned an invalid item for "${name}"`);
  for (const key of ["files", "dependencies", "registryDependencies"]) {
    if (item[key] !== undefined && !Array.isArray(item[key])) throw new CliError(`Registry item "${name}" has invalid ${key}`);
  }
  for (const file of item.files ?? []) {
    if (typeof file.target !== "string" || !TARGET_RE.test(file.target)) {
      throw new CliError(`Registry item "${name}" has an unsafe target: ${file.target}`);
    }
    if (typeof file.content !== "string") throw new CliError(`Registry item "${name}" is missing content for ${file.target}`);
  }
  return item;
}

/** Items in dependency order (dependencies first), each fetched once. */
async function resolveItems(registry, names) {
  const items = new Map();
  const order = [];
  const visiting = new Set();
  async function visit(name) {
    if (items.has(name) || visiting.has(name)) return;
    visiting.add(name);
    const item = checkItem(name, await registry.item(name));
    items.set(name, item);
    for (const dep of item.registryDependencies ?? []) await visit(itemName(dep));
    order.push(item);
  }
  for (const name of names) await visit(name);
  return order;
}

/* ---------------- planning and writing ---------------- */

/** Rewrites the registry's import paths to the project's aliases (code files only; CSS is copied verbatim). */
export function rewriteImports(content, aliases) {
  return content
    .replace(/(["'])@\/registry\/bitop\/ui\//g, `$1${aliases.ui}/`)
    .replace(/(["'])@\/registry\/bitop\/lib\//g, `$1${aliases.lib}/`);
}

function targetPath(config, target) {
  const [, kind, rest] = /^@(ui|lib)\/(.+)$/.exec(target) ?? [];
  const dir = config.dirs[kind];
  const abs = path.resolve(dir, rest);
  if (!isInside(dir, abs)) throw new CliError(`Refusing to write outside ${dir}: ${target}`);
  return abs;
}

function readLock(cwd) {
  const file = path.join(cwd, LOCK_FILE);
  assertSafePath(cwd, file);
  if (!fs.existsSync(file)) return { items: {} };
  try {
    const lock = readJsonFile(file);
    return { ...lock, items: lock.items ?? {} };
  } catch {
    throw new CliError(`${LOCK_FILE} is not valid JSON`);
  }
}

/**
 * Decides what happens to every file. Statuses:
 *   create     | new file
 *   unchanged  | identical already
 *   update     | differs and will be overwritten
 *   skip       | differs and is left alone (use --overwrite)
 */
function plan(config, items, lock, mode, overwrite) {
  const files = [];
  const targets = new Set();
  for (const item of items) {
    const locked = lock.items[item.name]?.files ?? {};
    for (const file of item.files ?? []) {
      const abs = targetPath(config, file.target);
      assertSafePath(config.cwd, abs);
      if (targets.has(abs)) throw new CliError(`Registry has duplicate target: ${file.target}`);
      targets.add(abs);
      const rel = path.relative(config.cwd, abs).split(path.sep).join("/");
      const content = CODE_FILE.test(file.target) ? rewriteImports(file.content, config.aliases) : file.content;
      const stat = fs.lstatSync(abs, { throwIfNoEntry: false });
      if (stat?.isSymbolicLink()) throw new CliError(`${rel} is a symlink; refusing to write through it`);
      if (stat && !stat.isFile()) throw new CliError(`${rel} exists and is not a file`);
      const current = stat ? fs.readFileSync(abs, "utf8") : null;
      const editedLocally = current !== null && locked[rel] !== undefined && sha256(current) !== locked[rel];
      let status;
      if (current === null) status = "create";
      else if (current === content) status = "unchanged";
      else if (overwrite) status = "update";
      // `update` refreshes files you haven't touched since the last install.
      else if (mode === "update" && locked[rel] !== undefined && !editedLocally) status = "update";
      else status = "skip";
      files.push({ item: item.name, rel, abs, content, current, status, editedLocally });
    }
  }
  return files;
}

function missingDependencies(cwd, items) {
  const pkgFile = findUp(cwd, ["package.json"]);
  const pkg = pkgFile ? readJsonFile(pkgFile) : {};
  const have = new Set(["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"].flatMap((k) => Object.keys(pkg[k] ?? {})));
  const wanted = new Map();
  for (const item of items) {
    for (const spec of item.dependencies ?? []) {
      // Only named npm packages and versions/ranges/tags, never options, URLs,
      // local paths, quotes, or variable expansions. Windows arguments are quoted.
      const m = typeof spec === "string" && /^(@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)(?:@([a-zA-Z0-9^~*<>=|. +_-]+))?$/.exec(spec);
      if (!m || /(?:^|\s)--?[a-zA-Z]/.test(spec)) throw new CliError(`Invalid dependency "${spec}" in ${item.name}`);
      if (!have.has(m[1]) && !wanted.has(m[1])) wanted.set(m[1], spec);
    }
  }
  return { specs: [...wanted.values()], packageDir: pkgFile ? path.dirname(pkgFile) : cwd };
}

function packageManager(dir) {
  const lock = findUp(dir, ["pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "package-lock.json"]);
  const name = lock ? path.basename(lock) : "package-lock.json";
  if (name === "pnpm-lock.yaml") return { bin: "pnpm", args: ["add"] };
  if (name === "yarn.lock") return { bin: "yarn", args: ["add"] };
  if (name.startsWith("bun.")) return { bin: "bun", args: ["add"] };
  return { bin: "npm", args: ["install"] };
}

/** Windows package-manager .cmd shims need a shell; preserve each argument. */
export function packageManagerArgs(args, platform = process.platform) {
  if (platform !== "win32") return args;
  // Quotes protect spaces and < > | ^ in version ranges. Reject anything that
  // could escape quotes or expand shell variables even within quotes.
  if (args.some((arg) => /["\r\n%!]/.test(arg))) throw new CliError("Unsafe package-manager argument");
  return args.map((arg) => `"${arg}"`);
}

/* ---------------- commands ---------------- */

const SYMBOL = { create: "+", update: "~", unchanged: "=", skip: "!" };

async function add(names, opts, mode = "add") {
  const config = loadConfig(opts.cwd, opts);
  const registry = openRegistry(config.registry, opts.cwd);
  const lock = readLock(opts.cwd);
  if (!names.length) {
    if (mode === "update") names = Object.keys(lock.items);
    if (!names.length) throw new CliError(mode === "update" ? `Nothing to update: ${LOCK_FILE} lists no items.` : "Name at least one item, e.g. bitop add button");
  }
  const items = await resolveItems(registry, names.map(itemName));
  const files = plan(config, items, lock, mode, opts.overwrite);
  const deps = missingDependencies(opts.cwd, items);
  const dry = opts.dryRun || opts.diff;

  const log = (line) => process.stdout.write(`${line}\n`);
  log(`Registry: ${registry.describe}`);
  log(`Items: ${items.map((i) => i.name).join(", ")}`);
  for (const f of files) {
    if (f.status === "unchanged" && !opts.verbose) continue;
    const note =
      f.status === "skip"
        ? f.editedLocally
          ? " (you changed this file; --overwrite replaces it)"
          : " (differs from the registry; --overwrite replaces it)"
        : f.status === "update" && f.editedLocally
          ? " (replacing your local changes)"
          : "";
    log(`  ${SYMBOL[f.status]} ${f.rel}${note}`);
  }
  const counts = Object.fromEntries(["create", "update", "unchanged", "skip"].map((s) => [s, files.filter((f) => f.status === s).length]));
  log(`${dry ? "Would write" : "Wrote"}: ${counts.create} new, ${counts.update} updated; ${counts.unchanged} unchanged, ${counts.skip} skipped.`);

  if (opts.diff) {
    for (const f of files) {
      if (f.current !== f.content) log(`\n${unifiedDiff(f.current ?? "", f.content, f.rel)}`);
    }
  }

  if (!dry) {
    for (const f of files) {
      if (f.status !== "create" && f.status !== "update") continue;
      assertSafePath(config.cwd, f.abs);
      fs.mkdirSync(path.dirname(f.abs), { recursive: true });
      fs.writeFileSync(f.abs, f.content);
    }
    // Record what the registry shipped for every resolved item, so `update`
    // can tell later edits apart. Skipped files keep their previous record.
    const next = { ...lock, registry: config.registry, items: { ...lock.items } };
    for (const item of items) {
      const prev = next.items[item.name]?.files ?? {};
      const entry = { ...prev };
      for (const f of files.filter((x) => x.item === item.name)) {
        if (f.status !== "skip") entry[f.rel] = sha256(f.content);
      }
      next.items[item.name] = { files: Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) };
    }
    next.items = Object.fromEntries(Object.entries(next.items).sort(([a], [b]) => a.localeCompare(b)));
    assertSafePath(opts.cwd, path.join(opts.cwd, LOCK_FILE));
    fs.writeFileSync(path.join(opts.cwd, LOCK_FILE), JSON.stringify({ version: 1, registry: next.registry, items: next.items }, null, 2) + "\n");
  }

  if (deps.specs.length) {
    const pm = packageManager(deps.packageDir);
    const command = [pm.bin, ...pm.args, ...deps.specs];
    if (dry || !opts.install) log(`Dependencies to install: ${command.join(" ")}`);
    else {
      log(`Installing: ${command.join(" ")}`);
      const result = spawnSync(pm.bin, packageManagerArgs([...pm.args, ...deps.specs]), { cwd: deps.packageDir, stdio: "inherit", shell: process.platform === "win32" });
      if (result.status !== 0) throw new CliError(`${pm.bin} exited with ${result.status ?? result.signal}; install the dependencies above yourself`);
    }
  }

  if (!dry) for (const item of items) if (item.docs && files.some((f) => f.item === item.name && f.status === "create")) log(`\n${item.name}: ${item.docs}`);
  if (counts.skip && !opts.diff) log(`\n${counts.skip} file(s) skipped. See the changes with --diff; replace them with --overwrite.`);
}

async function list(opts) {
  const config = loadConfig(opts.cwd, opts);
  const index = await openRegistry(config.registry, opts.cwd).index();
  const lock = readLock(opts.cwd);
  const items = (index.items ?? []).filter((i) => NAME_RE.test(i.name ?? ""));
  const width = Math.max(...items.map((i) => i.name.length));
  for (const i of items) process.stdout.write(`${lock.items[i.name] ? "*" : " "} ${i.name.padEnd(width)}  ${i.description ?? ""}\n`);
  process.stdout.write(`\n${items.length} items (* installed)\n`);
}

function init(opts) {
  const file = path.join(opts.cwd, "components.json");
  assertSafePath(opts.cwd, file);
  if (fs.existsSync(file) && !opts.overwrite) throw new CliError(`${file} exists (use --overwrite to replace it)`);
  if (!opts.registry) throw new CliError('Pass --registry <source>, e.g. --registry ../bitop-ui or --registry "https://host/bitop-ui/r/{name}.json"');
  const existing = fs.existsSync(file) ? readJsonFile(file) : {};
  const config = {
    ...existing,
    aliases: { ui: "@/components/ui", lib: "@/lib", ...existing.aliases },
    registries: { ...existing.registries, "@bitop": opts.registry },
  };
  // Fail early if the aliases can't be resolved or the registry can't be opened.
  loadConfig(opts.cwd, { registry: opts.registry });
  openRegistry(opts.registry, opts.cwd);
  const content = JSON.stringify(config, null, 2) + "\n";
  if (opts.diff) process.stdout.write(unifiedDiff(fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "", content, "components.json") + "\n");
  if (!opts.dryRun && !opts.diff) fs.writeFileSync(file, content);
  process.stdout.write(`${opts.dryRun || opts.diff ? "Would write" : "Wrote"} ${file}\nNext: bitop add core button\n`);
}

const HELP = `bitop ${VERSION}: copy bitop-ui components into your project

Usage:
  bitop add <item...>      Install items and their dependencies (core, other items, npm packages)
  bitop update [item...]   Refresh installed items; files you edited are skipped unless --overwrite
  bitop diff <item...>     Show how your files differ from the registry (writes nothing)
  bitop list               List the registry's items (* = installed)
  bitop init --registry <source>
                           Write components.json

Options:
  --cwd <dir>          Project directory (default: current directory)
  --registry <source>  Registry source; overrides components.json registries["@bitop"]
  --overwrite          Replace files that differ from the registry
  --dry-run            Show what would happen; write and install nothing
  --diff               Like --dry-run, plus a diff for every file that would change
  --no-install         Write files but only print the npm dependencies to install
  --verbose            Also list unchanged files

Registry sources: a bitop-ui checkout (../bitop-ui), a built registry
directory (../bitop-ui/public/r), or a URL/path template with {name}
(https://host/bitop-ui/r/{name}.json).`;

export function parseArgs(argv) {
  const opts = { cwd: process.cwd(), registry: undefined, overwrite: false, dryRun: false, diff: false, install: true, verbose: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined || v.startsWith("--")) throw new CliError(`${a} needs a value`);
      return v;
    };
    if (a === "--cwd") opts.cwd = path.resolve(value());
    else if (a === "--registry") opts.registry = value();
    else if (a === "--overwrite") opts.overwrite = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--diff") opts.diff = true;
    else if (a === "--no-install") opts.install = false;
    else if (a === "--verbose") opts.verbose = true;
    else if (a === "-h" || a === "--help") rest.unshift("help");
    else if (a === "-v" || a === "--version") rest.unshift("version");
    else if (a.startsWith("-")) throw new CliError(`Unknown option ${a}`);
    else rest.push(a);
  }
  return { command: rest[0] ?? "help", args: rest.slice(1), opts };
}

export async function main(argv) {
  const { command, args, opts } = parseArgs(argv);
  // Normalize OS aliases such as macOS /tmp → /private/tmp before containment checks.
  opts.cwd = fs.realpathSync(opts.cwd);
  switch (command) {
    case "add":
      return add(args, opts, "add");
    case "update":
      return add(args, opts, "update");
    case "diff":
      return add(args, { ...opts, diff: true }, "add");
    case "list":
      return list(opts);
    case "init":
      return init(opts);
    case "version":
      process.stdout.write(`${VERSION}\n`);
      return;
    case "help":
      process.stdout.write(`${HELP}\n`);
      return;
    default:
      throw new CliError(`Unknown command "${command}". Run bitop --help.`);
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // `bitop list | head` closes the pipe early: that's not an error.
  process.stdout.on("error", (error) => {
    if (/** @type {NodeJS.ErrnoException} */ (error).code === "EPIPE") process.exit(0);
    throw error;
  });
  main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`bitop: ${error instanceof CliError ? error.message : error?.stack ?? error}\n`);
    process.exit(1);
  });
}
