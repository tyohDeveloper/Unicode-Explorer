/**
 * Unicode Character Explorer — Build Script
 *
 * Assembles Unicode.html from source components in unicode-src/.
 * Run once:  pnpm --filter @workspace/scripts build:unicode
 * Watch:     pnpm --filter @workspace/scripts watch:unicode
 *
 * Source layout:
 *   unicode-src/template.html        HTML skeleton ({{CSS}} / {{JS}} / {{FONT_BTNS}} markers)
 *   unicode-src/style.css            All CSS
 *   unicode-src/config/fonts.json    Font selector definitions — edit here to change stacks
 *   unicode-src/data/blocks.js       BLOCKS array (346 Unicode 17.0 blocks)
 *   unicode-src/data/charnames.js    CN lookup table + algorithmic name helpers
 *   unicode-src/js/00-classify.js    isNonVisible, isReserved, utility fns
 *   unicode-src/js/01-sidebar.js     Collapsible sidebar + search + controls
 *   unicode-src/js/02-render.js      Auto-updating render engine
 *   unicode-src/js/03-controls.js    Font/size slider + copy button
 *
 * The build fetches UnicodeData.txt from unicode.org to derive the
 * UNASSIGNED ranges array (truly reserved code points within blocks).
 * The final Unicode.html is fully offline — the fetch happens only at
 * build time.
 */

import { readFileSync, writeFileSync, watch } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { minify as terserMinify } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Paths */
const srcDir     = resolve(__dirname, "../../../unicode-src");
const outputPath = resolve(__dirname, "../../../Unicode.html");

/* JS source files — order matters for dependency resolution */
const JS_FILES = [
  "data/blocks.js",
  "data/charnames.js",
  "js/00-classify.js",
  "js/01-sidebar.js",
  "js/02-render.js",
  "js/03-controls.js",
];

function read(rel: string): string {
  return readFileSync(resolve(srcDir, rel), "utf-8");
}

/* ============================================================
   FONT CONFIG — unicode-src/config/fonts.json
   ============================================================ */

interface FontEntry {
  label:   string;
  title:   string;
  stack:   string;
  checked?: boolean;
}

function buildFontBtns(): string {
  const fonts: FontEntry[] = JSON.parse(read("config/fonts.json"));
  const labels = fonts.map(f => {
    const checked = f.checked ? ' checked="checked"' : "";
    return `<label title="${f.title}"><input type="radio" name="gfont" value="${f.stack}"${checked} />${f.label}</label>`;
  });
  return `<div class="font-btns">${labels.join("")}</div>`;
}

/* ============================================================
   MINIFICATION
   ============================================================ */

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")        // strip block comments
    .replace(/\s+/g, " ")                     // collapse all whitespace to single space
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")    // remove spaces around punctuation
    .trim();
}

async function minifyJs(js: string): Promise<string> {
  const result = await terserMinify(js, {
    compress: { passes: 2 },
    mangle: true,
    format: { comments: false },
  });
  return result.code ?? js;
}

/**
 * Minify the HTML skeleton without touching CDATA sections.
 * Strategy: split on CDATA boundaries, minify each non-CDATA segment,
 * then rejoin.
 */
function minifyHtml(html: string): string {
  const CDATA_START = "<![CDATA[";
  const CDATA_END   = "]]>";
  let result = "";
  let i = 0;

  while (i < html.length) {
    const cdataStart = html.indexOf(CDATA_START, i);
    if (cdataStart === -1) {
      result += minifyHtmlSegment(html.slice(i));
      break;
    }
    result += minifyHtmlSegment(html.slice(i, cdataStart));
    const cdataEnd = html.indexOf(CDATA_END, cdataStart + CDATA_START.length);
    if (cdataEnd === -1) {
      result += html.slice(cdataStart);
      break;
    }
    result += html.slice(cdataStart, cdataEnd + CDATA_END.length);
    i = cdataEnd + CDATA_END.length;
  }

  return result;
}

function minifyHtmlSegment(segment: string): string {
  return segment
    .replace(/<!--[\s\S]*?-->/g, "")   // strip HTML comments
    .replace(/\s+/g, " ")              // collapse all whitespace to single space
    .replace(/>\s+</g, "><")           // remove whitespace between tags
    .trim();
}

/* ============================================================
   UNICODE DATA FETCH + UNASSIGNED RANGE GENERATION
   ============================================================ */

async function fetchAssignedCodePoints(): Promise<Set<number>> {
  const url = "https://unicode.org/Public/17.0.0/ucd/UnicodeData.txt";
  console.log("  Fetching UnicodeData.txt from unicode.org\u2026");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const text = await resp.text();

  const assigned = new Set<number>();
  let rangeFirst = -1;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(";");
    const cp   = parseInt(fields[0], 16);
    const name = fields[1];

    if (name.includes(", First>")) {
      rangeFirst = cp;
    } else if (name.includes(", Last>")) {
      if (rangeFirst >= 0) {
        for (let i = rangeFirst; i <= cp; i++) assigned.add(i);
        rangeFirst = -1;
      }
    } else {
      assigned.add(cp);
      rangeFirst = -1;
    }
  }

  return assigned;
}

function extractBlockRanges(blocksJs: string): [number, number][] {
  const ranges: [number, number][] = [];
  const re = /\[\s*"[^"]*"\s*,\s*(0x[0-9A-Fa-f]+|\d+)\s*,\s*(0x[0-9A-Fa-f]+|\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(blocksJs)) !== null) {
    const start = parseInt(m[1], 16) || parseInt(m[1], 10);
    const end   = parseInt(m[2], 16) || parseInt(m[2], 10);
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      ranges.push([start, end]);
    }
  }
  return ranges;
}

function buildUnassignedRanges(
  blockRanges: [number, number][],
  assigned: Set<number>
): [number, number][] {
  const result: [number, number][] = [];

  for (const [bStart, bEnd] of blockRanges) {
    let runStart = -1;

    for (let cp = bStart; cp <= bEnd; cp++) {
      if (cp >= 0xD800 && cp <= 0xDFFF) { endRun(cp - 1); continue; }
      if (cp >= 0xE000 && cp <= 0xF8FF) { endRun(cp - 1); continue; }
      if (cp >= 0xF0000)                { endRun(cp - 1); continue; }
      if (cp >= 0xFDD0 && cp <= 0xFDEF) { endRun(cp - 1); continue; }
      if ((cp & 0xFFFF) === 0xFFFE || (cp & 0xFFFF) === 0xFFFF) { endRun(cp - 1); continue; }

      const unassigned = !assigned.has(cp);
      if (unassigned && runStart < 0) {
        runStart = cp;
      } else if (!unassigned && runStart >= 0) {
        result.push([runStart, cp - 1]);
        runStart = -1;
      }
    }
    endRun(bEnd);

    function endRun(at: number) {
      if (runStart >= 0) {
        result.push([runStart, at]);
        runStart = -1;
      }
    }
  }

  return result;
}

function serializeUnassigned(ranges: [number, number][]): string {
  if (ranges.length === 0) return "var UNASSIGNED=[];";

  const entries = ranges.map(([s, e]) => s === e ? `[${s}]` : `[${s},${e}]`);
  const lines: string[] = [];
  let line = "";
  for (const entry of entries) {
    const sep = line ? "," : "";
    if (line.length + sep.length + entry.length > 118) {
      lines.push(line + ",");
      line = entry;
    } else {
      line += sep + entry;
    }
  }
  if (line) lines.push(line);

  return (
    `var UNASSIGNED=[\n` +
    lines.map(l => l).join("\n") +
    `\n];`
  );
}

/* ============================================================
   MAIN BUILD FUNCTION
   ============================================================ */

async function build(): Promise<void> {
  /* -- Generate UNASSIGNED ranges -- */
  let unassignedJs = "var UNASSIGNED=[];";
  try {
    const assigned    = await fetchAssignedCodePoints();
    const blocksJs    = read("data/blocks.js");
    const blockRanges = extractBlockRanges(blocksJs);
    const ranges      = buildUnassignedRanges(blockRanges, assigned);
    unassignedJs      = serializeUnassigned(ranges);
    console.log(`  Generated ${ranges.length} unassigned ranges across ${blockRanges.length} blocks.`);
  } catch (err) {
    console.warn("  Warning: could not fetch Unicode data \u2014 isReserved() disabled.", err);
  }

  /* -- Font config -- */
  const fontBtns = buildFontBtns();

  /* -- Assemble JS -- */
  const rawJs = [
    unassignedJs,
    ...JS_FILES.map(f => read(f)),
  ].join("\n\n");

  /* -- Minify CSS -- */
  const css = minifyCss(read("style.css"));

  /* -- Minify JS -- */
  const js = await minifyJs(rawJs);

  /* -- Assemble HTML -- */
  const template = read("template.html");
  const assembled = template
    .replace("{{CSS}}",       css)
    .replace("{{JS}}",        js)
    .replace("{{FONT_BTNS}}", fontBtns);

  /* -- Minify HTML -- */
  const html = minifyHtml(assembled);

  /* Safety check */
  if (css.includes("]]>") || js.includes("]]>")) {
    console.warn("Warning: source files contain ']]>' which will break CDATA sections!");
  }

  writeFileSync(outputPath, html, "utf-8");
  const kb = (html.length / 1024).toFixed(1);
  console.log(`[${new Date().toLocaleTimeString()}] Built Unicode.html (${kb} KB)`);
}

/* ---- Single build or watch mode ---- */
if (process.argv.includes("--watch")) {
  build();
  console.log("Watching unicode-src/ for changes\u2026  (Ctrl+C to stop)");
  watch(srcDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    build().catch(err => console.error("Build error:", err));
  });
} else {
  build().catch(err => { console.error("Build failed:", err); process.exit(1); });
}
