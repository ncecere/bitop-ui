// @vitest-environment node
/*
 * The bitop CLI (packages/cli): installs into throwaway projects from this
 * checkout, from a built registry served over HTTP, and checks that it never
 * writes outside the configured folders.
 */
import { execFile } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { packageManagerArgs, parseJsonc, resolveAliasDir, unifiedDiff } from "../packages/cli/bin/bitop.mjs";

const repo = path.resolve(__dirname, "..");
const bin = path.join(repo, "packages/cli/bin/bitop.mjs");
const run = promisify(execFile);
const temps: string[] = [];

afterEach(() => {
  for (const dir of temps.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function project(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bitop-cli-"));
  temps.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}

async function bitop(cwd: string, ...args: string[]) {
  try {
    const { stdout, stderr } = await run(process.execPath, [bin, ...args, "--cwd", cwd]);
    return { code: 0, stdout, stderr };
  } catch (error) {
    const e = error as { code: number; stdout: string; stderr: string };
    return { code: e.code, stdout: e.stdout, stderr: e.stderr };
  }
}

const read = (dir: string, rel: string) => fs.readFileSync(path.join(dir, rel), "utf8");
const exists = (dir: string, rel: string) => fs.existsSync(path.join(dir, rel));

function viteProject(registry: string, extra: Record<string, string> = {}) {
  return project({
    "package.json": JSON.stringify({ name: "consumer", private: true, dependencies: { react: "19.3.0", "@base-ui/react": "1.8.0" } }),
    "tsconfig.json": '{\n  // comments and trailing commas, like Vite\'s\n  "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"], }, },\n}\n',
    "components.json": JSON.stringify({ aliases: { ui: "@/components/ui", lib: "@/lib" }, registries: { "@bitop": registry } }),
    ...extra,
  });
}

describe("bitop add from a bitop-ui checkout", () => {
  it("installs an item with its dependencies and rewrites imports to the project's aliases", async () => {
    const dir = viteProject(repo);
    const { code, stdout } = await bitop(dir, "add", "button", "--no-install");
    expect(code).toBe(0);
    expect(stdout).toContain("Items: theme-neutral, core, spinner, button");
    for (const rel of [
      "src/components/ui/button/button.tsx",
      "src/components/ui/button/button.module.css",
      "src/components/ui/spinner/spinner.tsx",
      "src/components/ui/styles/bitop.css",
      "src/components/ui/themes/neutral.css",
      "src/lib/bitop-utils.ts",
    ]) {
      expect(exists(dir, rel), rel).toBe(true);
    }
    const button = read(dir, "src/components/ui/button/button.tsx");
    expect(button).toContain('from "@/components/ui/spinner/spinner"');
    expect(button).toContain('from "@/lib/bitop-utils"');
    expect(button).not.toContain("@/registry/bitop");
    // CSS is copied verbatim.
    expect(read(dir, "src/components/ui/button/button.module.css")).toBe(read(repo, "registry/bitop/ui/button/button.module.css"));
    // Only packages the project lacks are installed (react and @base-ui/react are already there).
    expect(stdout).toContain("Dependencies to install: npm install @fontsource-variable/inter@");
    expect(stdout).not.toMatch(/install .*@base-ui\/react/);
    const lock = JSON.parse(read(dir, "bitop-lock.json"));
    expect(Object.keys(lock.items)).toEqual(["button", "core", "spinner", "theme-neutral"]);
    expect(lock.items.button.files["src/components/ui/button/button.tsx"]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is idempotent, protects local edits, shows diffs and overwrites only when asked", async () => {
    const dir = viteProject(repo);
    await bitop(dir, "add", "button", "--no-install");
    const again = await bitop(dir, "add", "button", "--no-install");
    expect(again.stdout).toContain("0 new, 0 updated; 10 unchanged, 0 skipped");

    const file = "src/components/ui/button/button.tsx";
    const original = read(dir, file);
    fs.writeFileSync(path.join(dir, file), original.replace('variant = "primary"', 'variant = "secondary"'));

    const add = await bitop(dir, "add", "button", "--no-install");
    expect(add.stdout).toContain(`! ${file} (you changed this file; --overwrite replaces it)`);
    expect(read(dir, file)).toContain('variant = "secondary"');

    const update = await bitop(dir, "update", "--no-install");
    expect(update.stdout).toContain(`! ${file}`);
    expect(read(dir, file)).toContain('variant = "secondary"');

    const diff = await bitop(dir, "diff", "button");
    expect(diff.stdout).toMatch(/-    variant = "secondary",\n\+    variant = "primary",/);
    expect(read(dir, file)).toContain('variant = "secondary"');

    const overwrite = await bitop(dir, "add", "button", "--overwrite", "--no-install");
    expect(overwrite.stdout).toContain(`~ ${file} (replacing your local changes)`);
    expect(read(dir, file)).toBe(original);
  });

  it("update refreshes files you haven't edited since the last install", async () => {
    const dir = viteProject(repo);
    await bitop(dir, "add", "spinner", "--no-install");
    // Simulate an older upstream version: the file and the lock agree, but differ from the registry.
    const file = "src/components/ui/spinner/spinner.tsx";
    const old = read(dir, file) + "\n// older upstream version\n";
    fs.writeFileSync(path.join(dir, file), old);
    const lock = JSON.parse(read(dir, "bitop-lock.json"));
    lock.items.spinner.files[file] = (await import("node:crypto")).createHash("sha256").update(old).digest("hex");
    fs.writeFileSync(path.join(dir, "bitop-lock.json"), JSON.stringify(lock));

    const { stdout } = await bitop(dir, "update", "--no-install");
    expect(stdout).toContain(`~ ${file}`);
    expect(read(dir, file)).not.toContain("older upstream version");
  });

  it("--dry-run writes nothing", async () => {
    const dir = viteProject(repo);
    const { code, stdout } = await bitop(dir, "add", "dialog", "--dry-run");
    expect(code).toBe(0);
    expect(stdout).toContain("Would write:");
    expect(exists(dir, "src")).toBe(false);
    expect(exists(dir, "bitop-lock.json")).toBe(false);
  });

  it("follows custom aliases through tsconfig.app.json paths", async () => {
    const dir = project({
      "package.json": JSON.stringify({ name: "consumer", private: true }),
      "tsconfig.json": JSON.stringify({ files: [], references: [{ path: "./tsconfig.app.json" }] }),
      "tsconfig.app.json": JSON.stringify({ compilerOptions: { paths: { "~/*": ["./app/*"] } } }),
      "components.json": JSON.stringify({ aliases: { ui: "~/ui", lib: "~/lib" }, registries: { "@bitop": repo } }),
    });
    const { code } = await bitop(dir, "add", "button", "--no-install");
    expect(code).toBe(0);
    const button = read(dir, "app/ui/button/button.tsx");
    expect(button).toContain('from "~/ui/spinner/spinner"');
    expect(button).toContain('from "~/lib/bitop-utils"');
    expect(exists(dir, "app/lib/bitop-utils.ts")).toBe(true);
  });

  it("previews new-file contents without writing", async () => {
    const dir = viteProject(repo);
    const result = await bitop(dir, "add", "button", "--diff");
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('+import { Spinner } from "@/components/ui/spinner/spinner"');
    expect(exists(dir, "src")).toBe(false);
    expect(exists(dir, "bitop-lock.json")).toBe(false);
  });

  it.each(["src", "src/components/ui", "src/components/ui/button", "bitop-lock.json"])("rejects symlinks at %s before writing anything", async (rel) => {
    const dir = viteProject(repo);
    const outside = project({ "sentinel": "untouched" });
    const dest = path.join(dir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.symlinkSync(rel === "bitop-lock.json" ? path.join(outside, "missing.json") : outside, dest);
    const result = await bitop(dir, "add", "button", "--overwrite", "--no-install");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("symlink");
    expect(fs.readdirSync(outside)).toEqual(["sentinel"]);
    expect(read(outside, "sentinel")).toBe("untouched");
    expect(exists(dir, "src/lib/bitop-utils.ts")).toBe(false);
  });

  it("uses explicit disk paths and refuses paths outside the project", async () => {
    const dir = viteProject(repo, {
      "components.json": JSON.stringify({ aliases: { ui: "#ui", lib: "#lib" }, bitop: { paths: { ui: "app/ui", lib: "app/lib" } }, registries: { "@bitop": repo } }),
    });
    expect((await bitop(dir, "add", "button", "--no-install")).code).toBe(0);
    expect(read(dir, "app/ui/button/button.tsx")).toContain('from "#lib/bitop-utils"');
    const config = JSON.parse(read(dir, "components.json"));
    config.bitop.paths.ui = "../outside";
    fs.writeFileSync(path.join(dir, "components.json"), JSON.stringify(config));
    expect((await bitop(dir, "add", "button", "--no-install")).stderr).toContain("outside project");
  });

  it("init dry-run and diff are read-only, and overwrite preserves unrelated configuration", async () => {
    const dir = project({ "package.json": "{}" });
    for (const flag of ["--dry-run", "--diff"]) {
      const result = await bitop(dir, "init", "--registry", repo, flag);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Would write");
      expect(exists(dir, "components.json")).toBe(false);
    }
    expect((await bitop(dir, "init", "--registry", repo)).code).toBe(0);
    const config = JSON.parse(read(dir, "components.json"));
    config.aliases.ui = "@/widgets";
    config.style = "existing-style";
    config.registries["@other"] = "https://example.com/{name}.json";
    fs.writeFileSync(path.join(dir, "components.json"), JSON.stringify(config));
    expect((await bitop(dir, "init", "--registry", repo)).code).toBe(1);
    expect((await bitop(dir, "init", "--registry", repo, "--overwrite")).code).toBe(0);
    expect(JSON.parse(read(dir, "components.json"))).toEqual(config);
  });

  it.each(["registry/bitop", "registry/bitop/lib", "registry/bitop/lib/bitop-utils.ts"])("rejects checkout source symlinks at %s", async (rel) => {
    const file = { path: "registry/bitop/lib/bitop-utils.ts", target: "@lib/bitop-utils.ts", type: "registry:lib" };
    const source = project({ "registry.json": JSON.stringify({ items: [{ name: "core", files: [file] }] }) });
    const outside = project({ "lib/bitop-utils.ts": "private data", "bitop-utils.ts": "private data" });
    const target = path.join(source, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.symlinkSync(rel.endsWith(".ts") ? path.join(outside, "bitop-utils.ts") : outside, target);
    const dir = viteProject(source);
    const result = await bitop(dir, "add", "core", "--no-install");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("symlink");
    expect(exists(dir, "src")).toBe(false);
  });

  it("refuses a symlinked components.json even with init --overwrite", async () => {
    const dir = project({ "package.json": "{}" });
    const outside = project({ "config.json": "{}" });
    fs.symlinkSync(path.join(outside, "config.json"), path.join(dir, "components.json"));
    const result = await bitop(dir, "init", "--registry", repo, "--overwrite");
    expect(result.code).toBe(1);
    expect(read(outside, "config.json")).toBe("{}");
  });

  it("explains a missing components.json", async () => {
    const dir = project({ "package.json": "{}" });
    const { code, stderr } = await bitop(dir, "add", "button");
    expect(code).toBe(1);
    expect(stderr).toContain('Run "bitop init --registry <source>" first');
  });
});

describe("bitop add from a registry URL", () => {
  let server: http.Server | undefined;
  afterEach(() => new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve())));

  async function serve(items: Record<string, unknown>) {
    server = http.createServer((req, res) => {
      const name = /^\/r\/([a-z-]+)\.json$/.exec(req.url ?? "")?.[1];
      const body = name === "registry" ? { name: "bitop", items: Object.values(items) } : name && items[name];
      res.writeHead(body ? 200 : 404, { "content-type": "application/json" }).end(JSON.stringify(body ?? {}));
    });
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    return `http://127.0.0.1:${(server!.address() as AddressInfo).port}/r/{name}.json`;
  }

  const lib = { name: "core", type: "registry:lib", description: "Core", files: [{ path: "registry/bitop/lib/bitop-utils.ts", type: "registry:lib", target: "@lib/bitop-utils.ts", content: "export const x = 1;\n" }] };

  it("fetches items and URL-form dependencies", async () => {
    const url = await serve({
      core: lib,
      badge: {
        name: "badge",
        type: "registry:ui",
        description: "Badge",
        registryDependencies: ["http://elsewhere.invalid/r/core.json"],
        files: [{ path: "registry/bitop/ui/badge/badge.tsx", type: "registry:ui", target: "@ui/badge/badge.tsx", content: 'import { x } from "@/registry/bitop/lib/bitop-utils";\n' }],
      },
    });
    const dir = viteProject(url);
    const { code, stdout, stderr } = await bitop(dir, "add", "badge", "--no-install");
    expect(stderr).toBe("");
    expect(code).toBe(0);
    expect(stdout).toContain("Items: core, badge");
    expect(read(dir, "src/components/ui/badge/badge.tsx")).toBe('import { x } from "@/lib/bitop-utils";\n');
    const list = await bitop(dir, "list");
    expect(list.stdout).toMatch(/\* badge\s+Badge/);
  });

  it.each(["--prefix=/tmp/elsewhere", "example@1 --prefix=..", "example@1 -g", "file:../untrusted", "x@1;echo bad", "https://example.com/pkg.tgz"])("rejects unsafe dependency %s before writes", async (dependency) => {
    const url = await serve({ core: { ...lib, dependencies: [dependency] } });
    const dir = viteProject(url);
    const result = await bitop(dir, "add", "core", "--no-install");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Invalid dependency");
    expect(exists(dir, "src")).toBe(false);
    expect(exists(dir, "bitop-lock.json")).toBe(false);
  });

  it("rejects duplicate targets before writes", async () => {
    const url = await serve({ core: { ...lib, files: [...lib.files, ...lib.files] } });
    const dir = viteProject(url);
    const result = await bitop(dir, "add", "core", "--no-install");
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("duplicate target");
    expect(exists(dir, "src")).toBe(false);
  });

  it("installs from a built local registry directory and file URL template", async () => {
    const source = project({ "registry.json": JSON.stringify({ items: [lib] }), "core.json": JSON.stringify(lib) });
    for (const registry of [source, `${(await import("node:url")).pathToFileURL(source)}/{name}.json`]) {
      const dir = viteProject(registry);
      const result = await bitop(dir, "add", "core", "--no-install");
      expect(result.code).toBe(0);
      expect(read(dir, "src/lib/bitop-utils.ts")).toBe("export const x = 1;\n");
    }
  });

  it("refuses items that would write outside the project folders, and writes nothing", async () => {
    const url = await serve({
      core: lib,
      evil: {
        name: "evil",
        type: "registry:ui",
        registryDependencies: ["@bitop/core"],
        files: [{ path: "registry/bitop/ui/evil/evil.tsx", type: "registry:ui", target: "@ui/../../../escaped.tsx", content: "boom" }],
      },
    });
    const dir = viteProject(url);
    const { code, stderr } = await bitop(dir, "add", "evil", "--no-install");
    expect(code).toBe(1);
    expect(stderr).toContain("unsafe target");
    expect(exists(dir, "src")).toBe(false);
    expect(exists(dir, "bitop-lock.json")).toBe(false);
  });
});

describe("helpers", () => {
  it("resolves exact aliases before wildcards, and longer prefixes before shorter ones", () => {
    const dir = project({ "tsconfig.json": JSON.stringify({ compilerOptions: { paths: {
      "@/*": ["src/*"],
      "@/components/*": ["custom-components/*"],
      "@/components/ui": ["exact-ui"],
    } } }) });
    expect(resolveAliasDir(dir, "@/components/ui")).toBe(path.join(dir, "exact-ui"));
    expect(resolveAliasDir(dir, "@/components/other")).toBe(path.join(dir, "custom-components/other"));
    expect(resolveAliasDir(dir, "@/lib")).toBe(path.join(dir, "src/lib"));
  });

  it("keeps Windows package manager argument boundaries intact", () => {
    const args = ["install", "example@>=1 <2 || ^3", "@scope/pkg@1.0.0 - 2.0.0"];
    expect(packageManagerArgs(args, "win32")).toEqual([
      '"install"', '"example@>=1 <2 || ^3"', '"@scope/pkg@1.0.0 - 2.0.0"',
    ]);
    expect(packageManagerArgs(args, "darwin")).toEqual(args);
    for (const unsafe of ['x" & echo bad', "x@%PATH%", "x@!PATH!", "x\ny"]) {
      expect(() => packageManagerArgs([unsafe], "win32")).toThrow("Unsafe package-manager argument");
    }
  });
  it("diff handles empty files and missing final newlines", () => {
    expect(unifiedDiff("", "hello\n", "f")).toContain("@@ -0,0 +1,1 @@\n+hello");
    expect(unifiedDiff("hello\n", "", "f")).toContain("@@ -1,1 +0,0 @@\n-hello");
    expect(unifiedDiff("hello", "hello\n", "f")).toContain("-hello\n\\ No newline at end of file\n+hello");
    expect(unifiedDiff("", "", "f")).toBe("");
  });

  it("diff bounds memory for large inputs", () => {
    const before = "a\n".repeat(2500);
    const after = "b\n".repeat(2500);
    const diff = unifiedDiff(before, after, "f");
    expect(diff).toContain("@@ -1,2500 +1,2500 @@");
    expect(diff).toContain("-a\n+b");
  });
  it("parseJsonc keeps // inside strings", () => {
    expect(parseJsonc('{ "a": "https://x.test/y", // c\n "b": [1,], /* d */ }')).toEqual({ a: "https://x.test/y", b: [1] });
  });

  it("parseJsonc preserves comma/bracket sequences in strings", () => {
    expect(parseJsonc('{ "a": ",}", "b": ",]", "c": "escaped \\\" //", }')).toEqual({ a: ",}", b: ",]", c: 'escaped " //' });
  });

  it("unifiedDiff prints removals before additions with line numbers", () => {
    const diff = unifiedDiff("a\nb\nc\n", "a\nB\nc\n", "f.txt");
    expect(diff).toBe(["--- f.txt (yours)", "+++ f.txt (registry)", "@@ -1,3 +1,3 @@", " a", "-b", "+B", " c"].join("\n"));
  });
});
