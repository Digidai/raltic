#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sqlPath = fileURLToPath(new URL("./growth-funnel.sql", import.meta.url));
const sql = readFileSync(sqlPath, "utf8")
  .replace(/^(?:\s*--[^\n]*\n)+/, "")
  .trim();

const result = spawnSync(
  "pnpm",
  [
    "--filter",
    "@raltic/api",
    "exec",
    "wrangler",
    "d1",
    "execute",
    "raltic-staging",
    "--remote",
    "--json",
    "--command",
    sql,
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
  },
);

if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) {
  process.stdout.write(result.stdout);
  process.exit(result.status ?? 1);
}

const queries = JSON.parse(result.stdout);
for (const query of queries) {
  if (!query.success) {
    throw new Error("D1 returned an unsuccessful funnel query");
  }
  for (const row of query.results ?? []) {
    process.stdout.write(`${JSON.stringify(row)}\n`);
  }
}
