#!/usr/bin/env node
/**
 * Regeneration check (docs/PLAN.md D-9, ARCHITECTURE §5): the committed
 * Unicode.html must be exactly what the committed sources produce. Rebuilds in
 * place and compares against the git HEAD copy; restores nothing because a
 * clean tree makes the two identical by construction.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");

const committed = sha(execFileSync("git", ["show", "HEAD:Unicode.html"], { cwd: root, maxBuffer: 1 << 28 }));
execFileSync("npm", ["run", "-s", "build:bundle"], { cwd: root, stdio: "inherit" });
const rebuilt = sha(readFileSync(resolve(root, "Unicode.html")));

if (committed !== rebuilt) {
  console.error(`verify:regenerated FAILED — committed Unicode.html ${committed.slice(0, 12)} != rebuilt ${rebuilt.slice(0, 12)}. Rebuild and commit the artifact with its source change.`);
  process.exit(1);
}
console.log(`verify:regenerated OK — ${rebuilt.slice(0, 12)}`);
