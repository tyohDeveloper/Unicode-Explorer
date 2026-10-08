#!/usr/bin/env node
/**
 * Post-build: dist/index.html → Unicode.html under the polyglot contract
 * (docs/ARCHITECTURE.md §8). html-minifier-terser collapses whitespace and
 * minifies CSS; boolean attributes stay long-form; script and style bodies are
 * CDATA-wrapped; closing slashes are kept. Fails if an inlined body contains
 * "]]>" or "</script", which would break XML or HTML parsing respectively.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { minify } from "html-minifier-terser";

const root = resolve(import.meta.dirname, "..");
const input = readFileSync(resolve(root, "dist/index.html"), "utf-8");

const minified = await minify(input, {
  collapseWhitespace: true,
  conservativeCollapse: false,
  removeComments: true,
  minifyCSS: true,
  minifyJS: false, // already minified by esbuild; re-minifying is slower and changes nothing useful
  keepClosingSlash: true,
  collapseBooleanAttributes: false,
  removeAttributeQuotes: false,
  removeEmptyAttributes: false,
  caseSensitive: true,
});

function wrap(html, tag) {
  const re = new RegExp(`<${tag}([^>]*)>([\\s\\S]*?)</${tag}>`, "g");
  return html.replace(re, (_m, attrs, body) => {
    if (!body.trim()) return `<${tag}${attrs}></${tag}>`;
    if (body.includes("]]>")) throw new Error(`<${tag}> body contains "]]>"`);
    if (tag === "script" && /<\/script/i.test(body)) throw new Error("<script> body contains </script");
    return `<${tag}${attrs}>/*<![CDATA[*/${body}/*]]>*/</${tag}>`;
  });
}

/* Inline resources need no CORS mode; the bare attribute is also invalid XML. */
const cleaned = minified
  .replace(/<script type="module" crossorigin>/g, '<script type="module">')
  .replace(/<style rel="stylesheet" crossorigin>/g, "<style>");
if (/\scrossorigin[\s>]/.test(cleaned)) throw new Error("unexpected crossorigin attribute");
const out = wrap(wrap(cleaned, "script"), "style");
writeFileSync(resolve(root, "Unicode.html"), out);
console.log(`minify:artifact — Unicode.html ${out.length} bytes`);
