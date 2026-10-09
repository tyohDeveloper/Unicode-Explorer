#!/usr/bin/env node
/**
 * Release — the only supported way to move either version track
 * (CODING-STANDARDS §12; PLAN.md D-8, Q-7).
 *
 *   npm run release -- app  1.2.0.0
 *   npm run release -- data 1.0.0.0
 *
 * Refuses an app release while data/ or fonts/manifest.json has changes
 * since the last data tag (CP4-05), so release data first. Refuses a dirty tree, validates the four-part format, requires a matching
 * CHANGELOG section (the number carries no meaning by itself; the changelog
 * does), writes the version into package.json / data/version.json, rebuilds
 * so the artifact stamp agrees, runs verify:build, commits, and creates an
 * annotated tag <version>-<track> whose message is the CHANGELOG section.
 * Pushing is left to the operator.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { unreleasedDataChanges } from "./release-guard.mjs";

const root = resolve(import.meta.dirname, "..");
const [track, version] = process.argv.slice(2);
const die = (msg) => { console.error(`release: ${msg}`); process.exit(1); };
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf-8" }).trim();

if (!["app", "data"].includes(track)) die("usage: release <app|data> <MAJOR.MAJORFIX.MINORFIX.SPELLING>");
if (!/^\d+\.\d+\.\d+\.\d+$/.test(version ?? "")) die(`"${version}" is not a four-part version`);
if (git("status", "--porcelain")) die("working tree is dirty; commit or stash first");
const tag = `${version}-${track}`;
if (git("tag", "--list", tag)) die(`tag ${tag} already exists`);

if (track === "app") {
  const lastData = git("tag", "--list", "*-data", "--sort=-v:refname").split("\n")[0];
  const pending = lastData ? unreleasedDataChanges(git("diff", "--name-only", lastData, "HEAD").split("\n").filter(Boolean)) : [];
  if (pending.length) die(`data changed since ${lastData} without a data release (CP4-05): ${pending.join(", ")}. Release the data track first: npm run release -- data <version>`);
}

const changelogPath = resolve(root, track === "app" ? "CHANGELOG.md" : "data/CHANGELOG.md");
const changelog = readFileSync(changelogPath, "utf-8");
const section = changelog.match(new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\][^\\n]*\\n([\\s\\S]*?)(?=^## \\[|(?![\\s\\S]))`, "m"));
if (!section) die(`${changelogPath} has no "## [${version}]" section; write the changes down first (PLAN.md D-8)`);

if (track === "app") {
  for (const file of ["package.json", "package-lock.json"]) {
    const p = resolve(root, file);
    const j = JSON.parse(readFileSync(p, "utf-8"));
    j.version = version;
    if (j.packages?.[""]) j.packages[""].version = version;
    writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  }
} else {
  const p = resolve(root, "data/version.json");
  const j = JSON.parse(readFileSync(p, "utf-8"));
  j.data = version;
  writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
}

execFileSync("npm", ["run", "-s", "build:bundle"], { cwd: root, stdio: "inherit" });
execFileSync("npm", ["run", "-s", "verify:build"], { cwd: root, stdio: "inherit" });

const changed = git("status", "--porcelain");
if (changed) {
  git("add", "-A");
  git("commit", "-q", "-m", `release: ${track} ${version}`);
}
const message = `${track} ${version}\n\n${section[1].trim()}\n`;
execFileSync("git", ["tag", "-a", tag, "-m", message], { cwd: root });
console.log(`release: tagged ${tag}${changed ? " (with release commit)" : ""}. Push with: git push origin main ${tag}`);
