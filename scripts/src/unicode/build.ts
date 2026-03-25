/**
 * Unicode Character Explorer — Build Script
 *
 * Assembles Unicode.html from source components in unicode-src/.
 * Run once:  pnpm --filter @workspace/scripts build:unicode
 * Watch:     pnpm --filter @workspace/scripts watch:unicode
 *
 * Source layout:
 *   unicode-src/template.html      HTML skeleton ({{CSS}} / {{JS}} markers)
 *   unicode-src/style.css          All CSS
 *   unicode-src/data/blocks.js     BLOCKS array (346 Unicode 17.0 blocks)
 *   unicode-src/data/charnames.js  CN lookup table + algorithmic name helpers
 *   unicode-src/js/00-classify.js  isNonVisible, isReserved, utility fns
 *   unicode-src/js/01-sidebar.js   Collapsible sidebar + search + controls
 *   unicode-src/js/02-render.js    Auto-updating render engine
 *   unicode-src/js/03-controls.js  Font/size slider + copy button
 *
 * The build fetches UnicodeData.txt from unicode.org to derive the
 * UNASSIGNED ranges array (truly reserved code points within blocks).
 * The final Unicode.html is fully offline — the fetch happens only at
 * build time.
 */

import { readFileSync, writeFileSync, watch } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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
   UNICODE DATA FETCH + UNASSIGNED RANGE GENERATION
   ============================================================ */

/**
 * Parse UnicodeData.txt and return a sorted array of assigned code points.
 * The file only lists assigned characters; absences are unassigned.
 * Contiguous assigned ranges are encoded as <Foo, First> / <Foo, Last> pairs.
 */
async function fetchAssignedCodePoints(): Promise<Set<number>> {
  const url = "https://unicode.org/Public/17.0.0/ucd/UnicodeData.txt";
  console.log("  Fetching UnicodeData.txt from unicode.org…");
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

/**
 * Extract block ranges [start, end] from blocks.js source text.
 * Looks for numeric pairs like [0x0250, 0x02AF] in array literals.
 */
function extractBlockRanges(blocksJs: string): [number, number][] {
  const ranges: [number, number][] = [];
  // Match each block entry: ["Name", start, end, "Cat"]
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

/**
 * Given a set of assigned code points and block ranges, generate compact
 * [start, end] ranges covering every UNASSIGNED (reserved) code point
 * that falls within some block range.
 *
 * Surrogates (D800-DFFF), PUA (E000-F8FF, F0000-10FFFF), and noncharacters
 * (FDD0-FDEF, xFFFE, xFFFF) are excluded — they're handled separately in
 * getCharName() and should never be marked "reserved" by isReserved().
 */
function buildUnassignedRanges(
  blockRanges: [number, number][],
  assigned: Set<number>
): [number, number][] {
  const result: [number, number][] = [];

  for (const [bStart, bEnd] of blockRanges) {
    let runStart = -1;

    for (let cp = bStart; cp <= bEnd; cp++) {
      /* Skip code points that getCharName handles via category labels */
      if (cp >= 0xD800 && cp <= 0xDFFF) { endRun(cp - 1); continue; } // surrogates
      if (cp >= 0xE000 && cp <= 0xF8FF) { endRun(cp - 1); continue; } // PUA BMP
      if (cp >= 0xF0000)                { endRun(cp - 1); continue; } // PUA planes 15-16
      if (cp >= 0xFDD0 && cp <= 0xFDEF) { endRun(cp - 1); continue; } // noncharacters
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

/**
 * Serialise the unassigned ranges as a compact JS variable declaration.
 * Uses decimal integers (shorter than hex for most code points).
 */
function serializeUnassigned(ranges: [number, number][]): string {
  if (ranges.length === 0) return "var UNASSIGNED = []; /* all code points are assigned */";

  /* Compact: if start === end write [n] else [start, end] */
  const entries = ranges.map(([s, e]) => s === e ? `[${s}]` : `[${s},${e}]`);

  /* Wrap at ~120 chars per line for readability */
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
    `/* Auto-generated at build time from Unicode 17.0 UnicodeData.txt.\n` +
    ` * ${ranges.length} unassigned ranges within the 346 Unicode 17.0 blocks.\n` +
    ` * isReserved() binary-searches this sorted array. */\n` +
    `var UNASSIGNED = [\n` +
    lines.map(l => "  " + l).join("\n") +
    `\n];`
  );
}

/* ============================================================
   MAIN BUILD FUNCTION
   ============================================================ */

async function build(): Promise<void> {
  /* -- Generate UNASSIGNED ranges -- */
  let unassignedJs = "var UNASSIGNED = []; /* fetch skipped or failed */";
  try {
    const assigned    = await fetchAssignedCodePoints();
    const blocksJs    = read("data/blocks.js");
    const blockRanges = extractBlockRanges(blocksJs);
    const ranges      = buildUnassignedRanges(blockRanges, assigned);
    unassignedJs      = serializeUnassigned(ranges);
    console.log(`  Generated ${ranges.length} unassigned ranges across ${blockRanges.length} blocks.`);
  } catch (err) {
    console.warn("  Warning: could not fetch Unicode data — isReserved() disabled.", err);
  }

  const template = read("template.html");
  const css      = read("style.css");

  const js = [
    "/* === data/unassigned.js (generated) === */\n" + unassignedJs,
    ...JS_FILES.map(f => `/* === ${f} === */\n` + read(f)),
  ].join("\n\n");

  /* Inline CSS and JS into the XHTML template */
  const html = template
    .replace("{{CSS}}", css)
    .replace("{{JS}}",  js);

  /* Safety check: CSS/JS content must not contain ]]> (would break CDATA) */
  if (css.includes("]]>") || js.includes("]]>")) {
    console.warn("Warning: source files contain ']]>' which will break CDATA sections!");
  }

  writeFileSync(outputPath, html, "utf-8");
  const kb = (html.length / 1024).toFixed(1);
  console.log(`[${new Date().toLocaleTimeString()}] Built Unicode.html (${kb} KB)`);
}

/* ---- Single build or watch mode ---- */
if (process.argv.includes("--watch")) {
  build(); // initial build
  console.log("Watching unicode-src/ for changes…  (Ctrl+C to stop)");
  watch(srcDir, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    build().catch(err => console.error("Build error:", err));
  });
} else {
  build().catch(err => { console.error("Build failed:", err); process.exit(1); });
}
