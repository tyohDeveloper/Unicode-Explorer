/**
 * Unicode Character Explorer — artifact assembly.
 *
 *   npm run build:bundle            one shot → Unicode.html
 *   npx tsx tools/build/assemble.ts --watch
 *
 * Inputs: unicode-src/ (template, CSS, JS, data, font config) and the vendored
 * Unicode Character Database under data/ucd/<version>/ (hash-verified, no
 * network). Any missing or mismatched input throws and the process exits
 * non-zero; a degraded artifact is never written (audit BLD-01).
 *
 * Output is deterministic: the same inputs produce a byte-identical file, which
 * scripts/verify-regenerated.mjs relies on.
 */
import { readFileSync, writeFileSync, watch } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { minify as terserMinify } from "terser";
import { readUcdFile } from "../ucd/readUcdFile.js";
import { parseUnicodeData } from "../ucd/parseUnicodeData.js";
import { extractBlockRanges } from "../ucd/extractBlockRanges.js";
import { buildUnassignedRanges } from "../ucd/buildUnassignedRanges.js";
import { serializeUnassigned } from "../ucd/serializeUnassigned.js";
import { serializeNameMap } from "../ucd/serializeNameMap.js";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const srcDir = resolve(repoRoot, "unicode-src");
const outputPath = resolve(repoRoot, "Unicode.html");
const lzStringPath = resolve(repoRoot, "node_modules/lz-string/libs/lz-string.min.js");

/* JS source files — concatenation order is dependency order. */
const JS_FILES = [
  "data/blocks.js",
  "data/algo-ranges.js",
  "data/charnames.js",
  "js/00-classify.js",
  "js/01-sidebar.js",
  "js/02-render-core.js",
  "js/03-render-grid.js",
  "js/04-render-table.js",
  "js/05-render-plain.js",
  "js/06-controls.js",
];

function read(rel: string): string {
  return readFileSync(resolve(srcDir, rel), "utf-8");
}

interface FontEntry { label: string; title: string; stack: string; checked?: boolean }

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildFontBtns(): string {
  const fonts: FontEntry[] = JSON.parse(read("config/fonts.json"));
  const labels = fonts.map((f) => {
    const checked = f.checked ? ' checked="checked"' : "";
    const testId = `radio-font-${f.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cjk"}`;
    return `<label title="${escapeAttr(f.title)}"><input type="radio" name="gfont" value="${escapeAttr(f.stack)}"${checked} data-testid="${testId}" />${escapeAttr(f.label)}</label>`;
  });
  return `<div class="font-btns">${labels.join("")}</div>`;
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .trim();
}

async function minifyJs(js: string): Promise<string> {
  const result = await terserMinify(js, { compress: { passes: 2 }, mangle: true, format: { comments: false } });
  if (!result.code) throw new Error("terser produced no output");
  return result.code;
}

function minifyHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_m, key: string) => {
    const v = values[key];
    if (v === undefined) throw new Error(`template marker {{${key}}} has no value`);
    return v;
  });
}

function countCdataEnds(html: string): number {
  return html.split("]]>").length - 1;
}

interface GeneratedTables { unassignedJs: string; cnJs: string; blockCount: number; nameCount: number; rangeCount: number }

function generateTables(unicodeVersion: string): GeneratedTables {
  const { assigned, nameMap } = parseUnicodeData(readUcdFile(repoRoot, unicodeVersion, "UnicodeData.txt"));
  const blockRanges = extractBlockRanges(read("data/blocks.js"));
  const ranges = buildUnassignedRanges(blockRanges, assigned);
  return {
    unassignedJs: serializeUnassigned(ranges),
    cnJs: serializeNameMap(nameMap),
    blockCount: blockRanges.length,
    nameCount: nameMap.size,
    rangeCount: ranges.length,
  };
}

function readVersions(): { app: string; data: string; unicode: string } {
  const pkg = JSON.parse(readFileSync(resolve(repoRoot, "package.json"), "utf-8")) as { version: string };
  const data = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { data: string; unicode: string };
  return { app: pkg.version, data: data.data, unicode: data.unicode };
}

async function build(): Promise<void> {
  const versions = readVersions();
  const tables = generateTables(versions.unicode);
  console.log(`  UCD ${versions.unicode}: ${tables.rangeCount} unassigned ranges across ${tables.blockCount} blocks; ${tables.nameCount} named characters.`);

  const rawJs = [tables.unassignedJs, readFileSync(lzStringPath, "utf-8"), tables.cnJs, ...JS_FILES.map(read)].join("\n\n");
  const html = minifyHtml(fillTemplate(read("template.html"), {
    CSS: minifyCss(read("style.css")),
    JS: await minifyJs(rawJs),
    FONT_BTNS: buildFontBtns(),
    APP_VERSION: versions.app,
    DATA_VERSION: versions.data,
    UNICODE_VERSION: versions.unicode,
    BLOCK_COUNT: String(tables.blockCount),
  }));
  if (/\{\{[A-Z_]+\}\}/.test(html)) throw new Error("unfilled template marker in output");
  if (html.includes("]]>", html.indexOf("/*<![CDATA[*/") + 13) && countCdataEnds(html) !== 2) throw new Error("']]>' inside an inlined body breaks the XML contract");

  writeFileSync(outputPath, html, "utf-8");
  console.log(`[${new Date().toLocaleTimeString()}] Built Unicode.html (${(html.length / 1024).toFixed(1)} KB)`);
}

if (process.argv.includes("--watch")) {
  build().catch((err) => console.error("Build error:", err));
  console.log("Watching unicode-src/ for changes… (Ctrl+C to stop)");
  watch(srcDir, { recursive: true }, (_event, filename) => {
    if (filename) build().catch((err) => console.error("Build error:", err));
  });
} else {
  build().catch((err) => { console.error("Build failed:", err); process.exit(1); });
}
