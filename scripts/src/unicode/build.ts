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
 */

import { readFileSync, writeFileSync, watch } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* Paths */
const srcDir    = resolve(__dirname, "../../../unicode-src");
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

function build(): void {
  const template = read("template.html");
  const css      = read("style.css");
  const js       = JS_FILES
    .map(f => `/* === ${f} === */\n` + read(f))
    .join("\n\n");

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
    try {
      build();
    } catch (err) {
      console.error("Build error:", err);
    }
  });
} else {
  build();
}
