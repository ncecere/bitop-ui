#!/usr/bin/env node
/*
 * Serves the built registry (public/r) on a fixed local port, so a consumer
 * project can install from it before a hosted URL exists:
 *
 *   npm run registry:build && npm run registry:serve
 *   # consumer components.json: "@bitop": "http://127.0.0.1:4180/r/{name}.json"
 *
 * Read-only static files, bound to 127.0.0.1. Port: REGISTRY_PORT (default 4180).
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const port = Number(process.env.REGISTRY_PORT ?? 4180);

if (!fs.existsSync(path.join(root, "r", "registry.json"))) {
  console.error("public/r is missing: run `npm run registry:build` first.");
  process.exit(1);
}

http
  .createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
    if (!file.startsWith(path.join(root, "r") + path.sep) || !file.endsWith(".json") || !fs.existsSync(file)) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found\n");
      return;
    }
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => console.log(`bitop registry: http://127.0.0.1:${port}/r/{name}.json (Ctrl+C to stop)`));
