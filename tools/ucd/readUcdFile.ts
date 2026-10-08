/**
 * Read one vendored Unicode Character Database file and verify it against
 * data/ucd/<version>/manifest.json. Throws on a missing file, a missing manifest
 * entry, or a hash mismatch: the build must fail closed (PLAN.md Phase 2,
 * audit BLD-01/BLD-02). No network access anywhere in the build.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface UcdManifest {
  unicode_version: string;
  files: Record<string, { sha256: string; bytes: number; source: string }>;
}

export function readUcdFile(repoRoot: string, version: string, name: string): string {
  const dir = resolve(repoRoot, "data", "ucd", version);
  const manifest = JSON.parse(readFileSync(resolve(dir, "manifest.json"), "utf-8")) as UcdManifest;
  const entry = manifest.files[name];
  if (!entry) throw new Error(`UCD ${version}: ${name} is not listed in manifest.json`);
  const bytes = readFileSync(resolve(dir, name));
  const sha = createHash("sha256").update(bytes).digest("hex");
  if (sha !== entry.sha256) {
    throw new Error(`UCD ${version}: ${name} sha256 ${sha} does not match manifest ${entry.sha256}`);
  }
  if (bytes.length !== entry.bytes) {
    throw new Error(`UCD ${version}: ${name} is ${bytes.length} bytes, manifest says ${entry.bytes}`);
  }
  return bytes.toString("utf-8");
}
