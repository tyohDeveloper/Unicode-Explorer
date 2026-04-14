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
 *   unicode-src/data/charnames.js    Algorithmic name helpers (CN is injected by build)
 *   unicode-src/js/00-classify.js    isNonVisible, isReserved, utility fns
 *   unicode-src/js/01-sidebar.js     Collapsible sidebar + search + controls
 *   unicode-src/js/02-render-core.js  Render orchestrator + shared helpers
 *   unicode-src/js/03-render-grid.js  Grid renderer
 *   unicode-src/js/04-render-table.js Table renderer + sort state/helpers
 *   unicode-src/js/05-render-plain.js Plain text renderer
 *   unicode-src/js/06-controls.js     Font/size slider + copy button
 *
 * The build fetches UnicodeData.txt from unicode.org to derive:
 *   - UNASSIGNED ranges array (truly reserved code points within blocks)
 *   - CN name map (all non-algorithmic named characters, ~40 K entries)
 *     Compressed at build time with LZString; decompressed at runtime using
 *     the LZString library (included inline in the generated HTML).
 * The final Unicode.html is fully offline — the fetch happens only at build time.
 */

import { readFileSync, writeFileSync, watch } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { minify as terserMinify } from "terser";
import LZString from "lz-string";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Paths */
const srcDir     = resolve(__dirname, "../../../unicode-src");
const outputPath = resolve(__dirname, "../../../Unicode.html");

/* JS source files — order matters for dependency resolution */
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

/* Path to the LZString minified library included in the runtime bundle */
const LZ_MIN_PATH = resolve(__dirname, "../../../scripts/node_modules/lz-string/libs/lz-string.min.js");

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
   UNICODE DATA FETCH — assigned code points + character names
   ============================================================ */

interface UnicodeData {
  assigned: Set<number>;
  nameMap:  Map<number, string>;
}

/**
 * Fetch UnicodeData.txt and parse it into:
 *   - assigned: every code point that exists in the standard (including ranges)
 *   - nameMap:  cp -> official Unicode name for every non-algorithmic, individually
 *               named character (excludes First/Last range markers, which are
 *               handled at runtime by getAlgoName / hangulName).
 *
 * Surrogates, PUA, and noncharacters are not present in UnicodeData.txt as
 * individually named entries, so they naturally fall through to the category
 * label fallback in getCharName().
 */
async function fetchUnicodeData(): Promise<UnicodeData> {
  const url = "https://unicode.org/Public/17.0.0/ucd/UnicodeData.txt";
  console.log("  Fetching UnicodeData.txt from unicode.org\u2026");
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
  const text = await resp.text();

  const assigned = new Set<number>();
  const nameMap  = new Map<number, string>();
  let rangeFirst = -1;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const fields = trimmed.split(";");
    if (fields.length < 2) continue;
    const cp   = parseInt(fields[0], 16);
    const name = fields[1];

    if (name.includes(", First>")) {
      /* Start of an algorithmic range — mark assigned but skip individual names */
      rangeFirst = cp;
    } else if (name.includes(", Last>")) {
      /* End of algorithmic range — bulk-add to assigned */
      if (rangeFirst >= 0) {
        for (let i = rangeFirst; i <= cp; i++) assigned.add(i);
        rangeFirst = -1;
      }
    } else {
      /* Individually named code point */
      assigned.add(cp);
      rangeFirst = -1;

      /* Skip any entry whose name field is a bracketed label (<control>, etc.) */
      if (!name.startsWith("<")) {
        nameMap.set(cp, name);
      }
    }
  }

  return { assigned, nameMap };
}

/* ============================================================
   CHAR NAME MAP SERIALIZATION — LZString-compressed
   ============================================================
   Build-time: compress all (cp, name) pairs with LZString.compressToBase64.
   Runtime:    decompress with LZString.decompressFromBase64 (library bundled
               inline in the generated HTML; Terser minifies it along with the
               other application JS).

   Wire format (before compression):
     "hex_cp:NAME\nhex_cp:NAME\n..."
   Hex code points are used because they are shorter for supplementary-plane
   code points (5 hex digits vs up to 6 decimal digits).
   ============================================================ */

/**
 * Serialize the full character name map using a two-stage compact encoding:
 *
 * Stage 1 — Delta + alphabetical sort (build-time)
 *   Entries are sorted alphabetically by Unicode name, so consecutive entries
 *   share long common prefixes (e.g., "LATIN CAPITAL LETTER A" →
 *   "LATIN CAPITAL LETTER B" shares 21 chars).  Each line is stored as:
 *     BASE36_SHARED_LEN | NAME_SUFFIX | HEX_CODEPOINT
 *   where BASE36_SHARED_LEN is how many leading chars to keep from the
 *   previous name (base-36, 1–2 chars for the typical 0–35 range).
 *
 * Stage 2 — LZString.compressToBase64 (build-time)
 *   The delta-encoded text is substantially more repetitive than the raw form,
 *   so LZString achieves much better compression.  The result is a base64-safe
 *   ASCII string embedded as a JS string literal in the generated HTML.
 *
 * Runtime (inside the generated HTML):
 *   LZString.decompressFromBase64 + tiny line-by-line decoder reconstruct CN.
 */
function serializeNameMapCompressed(nameMap: Map<number, string>): string {
  /* Sort alphabetically by name — clusters similar names together for better
     prefix sharing and LZ dictionary reuse */
  const sorted = [...nameMap.entries()].sort((a, b) => {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return  1;
    return a[0] - b[0];   // stable tie-break by code point
  });

  /* Build delta-encoded wire string */
  let prevName = "";
  const lines = sorted.map(([cp, name]) => {
    /* Shared prefix length with the previous name */
    let shared = 0;
    const minLen = Math.min(prevName.length, name.length);
    while (shared < minLen && prevName[shared] === name[shared]) shared++;

    const suffix    = name.slice(shared);
    const sharedB36 = shared.toString(36); // 1 char for 0–35, 2 chars for 36+
    const hexCp     = cp.toString(16);
    prevName = name;

    /* Line: SHARED_B36 | SUFFIX | HEX_CP  (no char in these fields clashes with "|") */
    return `${sharedB36}|${suffix}|${hexCp}`;
  });
  const raw = lines.join("\n");

  const rawKb = (raw.length / 1024).toFixed(1);

  /* Compress with LZString (build-time) */
  const compressed = LZString.compressToBase64(raw);
  const compKb = (compressed.length / 1024).toFixed(1);
  console.log(`  Name map: ${rawKb} KB raw (delta+alpha-sorted) → ${compKb} KB compressed.`);

  /*
   * Runtime initialiser (included verbatim in the generated HTML; Terser
   * will mangle variable names and minimise the decoder):
   *
   *   LZString.decompressFromBase64(compressed)
   *     → split on "\n"
   *     → for each line: restore full name via shared-prefix delta, store in T
   */
  const compressedJson = JSON.stringify(compressed);
  return (
    `var CN=(function(){` +
    `var T={};` +
    `var d=LZString.decompressFromBase64(${compressedJson});` +
    `var p="";` +
    `d.split("\\n").forEach(function(l){` +
      `if(!l)return;` +
      `var a=l.indexOf("|"),b=l.indexOf("|",a+1);` +
      `var s=parseInt(l.slice(0,a),36);` +
      `p=p.slice(0,s)+l.slice(a+1,b);` +
      `T[parseInt(l.slice(b+1),16)]=p;` +
    `});` +
    `return T;` +
    `})()`
  );
}

/* ============================================================
   UNASSIGNED RANGE GENERATION
   ============================================================ */

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
  /* -- Fetch UnicodeData.txt (once) — derive UNASSIGNED ranges + full name map -- */
  let unassignedJs = "var UNASSIGNED=[];";
  let cnJs         = "var CN={}";
  try {
    const { assigned, nameMap } = await fetchUnicodeData();
    const blocksJs    = read("data/blocks.js");
    const blockRanges = extractBlockRanges(blocksJs);
    const ranges      = buildUnassignedRanges(blockRanges, assigned);
    unassignedJs      = serializeUnassigned(ranges);
    cnJs              = serializeNameMapCompressed(nameMap);
    console.log(`  Generated ${ranges.length} unassigned ranges across ${blockRanges.length} blocks.`);
    console.log(`  Extracted ${nameMap.size} named characters for CN lookup table.`);
  } catch (err) {
    console.warn("  Warning: could not fetch Unicode data \u2014 isReserved() and CN disabled.", err);
  }

  /* -- LZString runtime library (needed for CN decompression at page load) -- */
  const lzStringSource = readFileSync(LZ_MIN_PATH, "utf-8");

  /* -- Font config -- */
  const fontBtns = buildFontBtns();

  /* -- Assemble JS:
        1. UNASSIGNED (build-time ranges)
        2. LZString library (runtime decompressor)
        3. CN initialiser (decompresses + parses name map)
        4. Source files (blocks, charnames, classify, sidebar, render, controls)
     -- */
  const rawJs = [
    unassignedJs,
    lzStringSource,
    cnJs,
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
  const under400 = html.length < 400 * 1024 ? "\u2714 under 400 KB" : "\u26A0 OVER 400 KB target";
  console.log(`[${new Date().toLocaleTimeString()}] Built Unicode.html (${kb} KB) — ${under400}`);
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
