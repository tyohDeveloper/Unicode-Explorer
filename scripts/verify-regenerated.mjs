#!/usr/bin/env node
/**
 * Regeneration check (docs/PLAN.md D-9, ARCHITECTURE §5): the committed
 * src/data/*.json and Unicode.html must be exactly what the committed sources
 * produce. Regenerates and rebuilds in place, then compares with git HEAD.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
function committed(path) {
  try {
    return sha(execFileSync("git", ["show", `HEAD:${path}`], { cwd: root, maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] }));
  } catch {
    return null; // not in HEAD yet: reported as stale below
  }
}
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: "inherit" });

run("npm", ["run", "-s", "generate:data"]);
run("npm", ["run", "-s", "build:bundle"]);

const files = ["src/data/aliases.json", "src/data/blocks.json", "src/data/unassigned.json", "src/data/names.json", "src/data/visibility.json", "src/data/marks.json", "src/data/abbreviations.json", "src/data/algorithmic-names.json", "src/data/properties.json", "Unicode.html"];
const stale = files.filter((f) => committed(f) !== sha(readFileSync(resolve(root, f))));
if (stale.length) {
  console.error(`verify:regenerated FAILED — committed files differ from regenerated output: ${stale.join(", ")}. Run npm run generate:data && npm run build:bundle and commit the result with its source change.`);
  process.exit(1);
}
console.log(`verify:regenerated OK — ${files.length} generated files match HEAD`);
