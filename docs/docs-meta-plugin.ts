/*
 * bitop-docs-meta: a Vite plugin providing `virtual:bitop-docs-meta`, the
 * slug/title/category/description of every docs page
 * (docs/src/content/components/*.tsx), read statically at build, dev and test
 * time with the TypeScript parser. The docs shell needs these up front for
 * the sidebar, the components index and the ⌘K palette, while the page
 * modules themselves are code-split (content/index.ts).
 *
 * Why parse instead of registry.json: registry categories (ai, disclosure,
 * foundation, theme…) don't map 1:1 onto docs categories, and titles and
 * descriptions differ. Why not a separate metadata file: content files keep
 * their existing shape and need no registration step. The parser reads the
 * AST (not regexes) and fails the build with the file and field named if a
 * page's metadata isn't a static string, so nothing is ever silently dropped.
 */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { Plugin, ViteDevServer } from "vite";

const DOCS_META_ID = "virtual:bitop-docs-meta";

export type ExtractedDocMeta = { file: string; slug: string; title: string; category: string; description: string };

/** The members of `export type Category = "A" | "B" | …` in content/types.ts. */
export function readCategories(typesSource: string): string[] {
  const sf = ts.createSourceFile("types.ts", typesSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const st of sf.statements) {
    if (ts.isTypeAliasDeclaration(st) && st.name.text === "Category" && ts.isUnionTypeNode(st.type)) {
      return st.type.types.map((t) => {
        if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) return t.literal.text;
        throw new Error("[bitop-docs-meta] content/types.ts: Category must be a union of string literals");
      });
    }
  }
  throw new Error('[bitop-docs-meta] content/types.ts: `type Category = "…" | …` not found');
}

function unwrap(e: ts.Expression): ts.Expression {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isSatisfiesExpression(e) || ts.isTypeAssertionExpression(e)) e = e.expression;
  return e;
}

const FIELDS = ["slug", "title", "category", "description"] as const;

/**
 * Reads slug/title/category/description from one content module without
 * executing it. The default export (an object literal, or a top-level const
 * bound to one; `satisfies`/`as` are fine) must give those four fields as
 * plain string literals. Throws naming the file and field otherwise.
 */
export function extractDocMeta(fileName: string, source: string, categories: readonly string[]): Omit<ExtractedDocMeta, "file"> {
  const fail = (msg: string): never => {
    throw new Error(`[bitop-docs-meta] ${fileName}: ${msg}`);
  };
  const sf = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let obj: ts.Expression | undefined;
  for (const st of sf.statements) if (ts.isExportAssignment(st) && !st.isExportEquals) obj = unwrap(st.expression);
  if (!obj) return fail("no `export default` found");
  if (ts.isIdentifier(obj)) {
    const name = obj.text;
    let init: ts.Expression | undefined;
    for (const st of sf.statements) {
      if (!ts.isVariableStatement(st)) continue;
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) init = d.initializer;
    }
    if (!init) return fail(`default export \`${name}\` is not a top-level const in this file`);
    obj = unwrap(init);
  }
  if (!ts.isObjectLiteralExpression(obj)) return fail("the default export must be a ComponentDoc object literal (or a const bound to one)");
  const fields: Partial<Record<(typeof FIELDS)[number], string>> = {};
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : undefined;
    if (!FIELDS.includes(key as (typeof FIELDS)[number])) continue;
    const v = unwrap(p.initializer);
    if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) fields[key as (typeof FIELDS)[number]] = v.text;
    else fail(`\`${key}\` must be a plain string literal so the sidebar and search can list the page without loading it (found ${ts.SyntaxKind[v.kind]})`);
  }
  const missing = FIELDS.filter((k) => !fields[k]);
  if (missing.length) fail(`missing ${missing.map((k) => `\`${k}\``).join(", ")}`);
  const { slug, title, category, description } = fields as Record<(typeof FIELDS)[number], string>;
  if (!/^[a-z][a-z0-9-]*$/.test(slug)) fail(`slug "${slug}" must be lowercase kebab-case`);
  if (!categories.includes(category)) fail(`category "${category}" is not one of ${categories.join(", ")} (content/types.ts)`);
  return { slug, title, category, description };
}

/** Metadata for every <contentDir>/components/*.tsx, keyed like content/index.ts's import.meta.glob. */
export function collectDocMeta(contentDir: string): ExtractedDocMeta[] {
  const docsDir = path.join(contentDir, "components");
  const categories = readCategories(fs.readFileSync(path.join(contentDir, "types.ts"), "utf8"));
  const files = fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".tsx"))
    .sort();
  const meta = files.map((f) => ({ file: `./components/${f}`, ...extractDocMeta(`docs/src/content/components/${f}`, fs.readFileSync(path.join(docsDir, f), "utf8"), categories) }));
  const seen = new Map<string, string>();
  for (const m of meta) {
    const other = seen.get(m.slug);
    if (other) throw new Error(`[bitop-docs-meta] duplicate slug "${m.slug}" in ${other} and ${m.file}`);
    seen.set(m.slug, m.file);
  }
  return meta;
}

export function docsMeta({ contentDir }: { contentDir: string }): Plugin {
  const resolved = `\0${DOCS_META_ID}`;
  const docsDir = path.join(contentDir, "components");
  const isContentFile = (file: string) => path.dirname(path.resolve(file)) === docsDir && file.endsWith(".tsx");
  const invalidate = (server: ViteDevServer) => {
    const mod = server.moduleGraph.getModuleById(resolved);
    if (mod) server.moduleGraph.invalidateModule(mod);
    return mod;
  };
  return {
    name: "bitop-docs-meta",
    resolveId(id) {
      return id === DOCS_META_ID ? resolved : undefined;
    },
    load(id) {
      if (id !== resolved) return;
      this.addWatchFile(path.join(contentDir, "types.ts"));
      for (const f of fs.readdirSync(docsDir)) if (f.endsWith(".tsx")) this.addWatchFile(path.join(docsDir, f));
      return `export default ${JSON.stringify(collectDocMeta(contentDir))};`;
    },
    configureServer(server) {
      // A new or deleted content file changes the page list: rebuild the metadata.
      const onAddOrRemove = (file: string) => {
        if (!isContentFile(file)) return;
        invalidate(server);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", onAddOrRemove);
      server.watcher.on("unlink", onAddOrRemove);
    },
    handleHotUpdate(ctx) {
      if (!isContentFile(ctx.file)) return;
      const mod = invalidate(ctx.server);
      if (mod) return [...ctx.modules, mod];
    },
  };
}
