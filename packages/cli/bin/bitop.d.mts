/** Types for the helpers bitop.mjs exports (used by its tests). */
export function parseJsonc(text: string): any;
export function unifiedDiff(before: string, after: string, label: string, context?: number): string;
export function resolveAliasDir(cwd: string, alias: string): string;
export function rewriteImports(content: string, aliases: { ui: string; lib: string }): string;
export function itemName(ref: string): string;
export function packageManagerArgs(args: string[], platform?: string): string[];
export function openRegistry(
  spec: string,
  cwd: string,
): { describe: string; item(name: string): Promise<any>; index(): Promise<any> };
export function parseArgs(argv: string[]): { command: string; args: string[]; opts: Record<string, unknown> };
export function main(argv: string[]): Promise<void>;
