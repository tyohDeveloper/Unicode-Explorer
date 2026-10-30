/*
 * C-26 license inventory check. Third-party material that ships is fonts;
 * no npm package ships (the artifact has no runtime dependencies). Checks:
 *   1. package.json declares no runtime dependencies.
 *   2. Every font in fonts/manifest.json has an allowed license (manifest
 *      policy.licenses_allowed) and a license_url.
 *   3. Every pack license file referenced by the manifest exists.
 *   4. Every non-Noto font family is named in THIRD_PARTY_LICENSES.md, and the
 *      Noto outline-pack count stated there matches the manifest.
 * Fails the build on any gap, so the hand-written inventory cannot go stale.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = (p) => readFileSync(resolve(root, p), "utf-8");
const failures = [];
const fail = (m) => failures.push(m);

const pkg = JSON.parse(read("package.json"));
const runtime = Object.keys(pkg.dependencies ?? {});
if (runtime.length) fail(`runtime dependencies would ship untracked: ${runtime.join(", ")}`);

const manifest = JSON.parse(read("fonts/manifest.json"));
const allowed = new Set(manifest.policy.licenses_allowed);
for (const font of manifest.fonts) {
  if (!allowed.has(font.license)) fail(`${font.id}: license ${font.license} not in ${[...allowed].join("/")}`);
  if (!font.license_url) fail(`${font.id}: no license_url`);
}
const licenseFiles = new Set(manifest.packs.flatMap((p) => p.license_files ?? []));
for (const file of licenseFiles) if (!existsSync(resolve(root, file))) fail(`missing license file ${file}`);

const doc = read("THIRD_PARTY_LICENSES.md");
const families = new Set(manifest.fonts.map((f) => f.family));
const aliases = { LastResort: "Last Resort" };
for (const family of families) {
  if (family.startsWith("Noto")) continue;
  if (!doc.includes(aliases[family] ?? family)) fail(`${family} is not named in THIRD_PARTY_LICENSES.md`);
}
const outlineCount = manifest.fonts.filter((f) => f.id.startsWith("outline-")).length;
const stated = doc.match(/Outline packs: (\d+) \[Noto\]/);
if (!stated) fail("THIRD_PARTY_LICENSES.md lacks the Noto outline-pack row");
else if (Number(stated[1]) !== outlineCount) fail(`Noto outline packs: inventory says ${stated[1]}, manifest has ${outlineCount}`);

if (failures.length) {
  console.error("verify:licenses FAILED\n  " + failures.join("\n  "));
  process.exit(1);
}
console.log(`verify:licenses OK — ${manifest.fonts.length} fonts, ${licenseFiles.size} license files, 0 runtime dependencies`);
