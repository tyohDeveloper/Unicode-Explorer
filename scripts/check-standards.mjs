#!/usr/bin/env node
/**
 * Standards lint — enforces docs/CODING-STANDARDS.md over the §0 layer mapping:
 *   §1.4 PURE/STATE purity (no document/window/navigator/location/Date.now/Math.random)
 *   §3.1 function bodies ≤ 20 lines
 *   §3.2 one export per PURE file, filename matches the export
 *   §3.3 file length by layer role
 *   §3.8 shape names prohibited
 *   §3.9 no barrel files or re-exports
 *   §11  exception expiry
 * Uses the TypeScript compiler API (§7.4). Every failure names its section (§7.8).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, basename, join } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const fail = (section, msg) => failures.push(`[CODING-STANDARDS ${section}] ${msg}`);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(resolve(root, dir))) {
    if (name === "node_modules") continue;
    const p = join(dir, name);
    if (statSync(resolve(root, p)).isDirectory()) out.push(...walk(p));
    else if (/\.(ts|mjs)$/.test(p) && !p.endsWith(".d.ts")) out.push(p);
  }
  return out;
}

/* §0 mapping (CODING-STANDARDS.md §0). Order matters: first match wins. */
const LAYERS = [
  { role: "PURE-CORE", limit: 100, oneExport: true, pure: true, match: (f) => f.startsWith("src/codepoint/") },
  { role: "PURE", limit: 150, oneExport: true, pure: true, match: (f) => /^src\/(ucd|selection|markup|coverage)\//.test(f) || /^src\/webfonts\/(chooseWebFonts|blockSpansFor|webFontCss|deviceFontCss)\.ts$/.test(f) || f === "src/names/decodeNameTable.ts" || /^src\/fonts\/(composeFontStack|packsForBlocks|packStatusText|standardFonts|splitFontFamilies|isGenericFamily|packsForStyle)\.ts$/.test(f) },
  { role: "STATE", limit: 150, oneExport: false, pure: true, match: (f) => f.startsWith("src/state/") },
  { role: "CONTROLLER", limit: 150, oneExport: false, pure: false, match: (f) => /^src\/(settings|clipboard|render)\//.test(f) || f === "src/names/loadNameTable.ts" || /^src\/fonts\/(glyphProbe|fontPacks|coverageScanner)\.ts$/.test(f) || f === "src/webfonts/loadWebFontRanges.ts" || /^$/.test(f) },
  { role: "VIEW", limit: 250, oneExport: false, pure: false, match: (f) => /^src\/[^/]+\.ts$/.test(f) },
  { role: "BUILD", limit: 250, oneExport: false, pure: false, match: (f) => f.startsWith("tools/") || f.startsWith("scripts/") },
];
const SHAPE_NAMES = /^(helpers?|utils?|misc|common|shared|handlers|setters|getters|stuff|things|lib|index|types|useHelpers|useHandlers|useSetters|client|stub|connector|gateway)$/i;
const AMBIENT = new Set(["document", "window", "navigator", "location", "localStorage", "sessionStorage", "history", "fetch", "setTimeout", "setInterval", "requestAnimationFrame"]);

const today = new Date().toISOString().slice(0, 10);
const exceptions = JSON.parse(readFileSync(resolve(root, ".architecture-exceptions.json"), "utf-8")).exceptions;
for (const ex of exceptions) if (ex.expires < today) fail("§11", `exception ${ex.id} (${ex.section}) expired ${ex.expires}; renew or remove`);
const excepted = (section, file) => exceptions.some((ex) => ex.expires >= today && ex.section === section && ex.scope.includes(file));

function codeLines(text) {
  return text.split("\n").filter((l) => { const t = l.trim(); return t && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*"); }).length;
}

function parse(file, text) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS);
}

function functionBodies(sf) {
  const out = [];
  const visit = (node) => {
    if ((ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) && node.body && ts.isBlock(node.body)) {
      const start = sf.getLineAndCharacterOfPosition(node.body.getStart(sf)).line;
      const end = sf.getLineAndCharacterOfPosition(node.body.getEnd()).line;
      const name = node.name?.getText(sf) ?? (ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(sf) : "(anonymous)");
      out.push({ name, lines: Math.max(0, end - start - 1) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}

function exportedValues(sf) {
  const names = [];
  for (const node of sf.statements) {
    const exported = ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isFunctionDeclaration(node) && node.name) names.push(node.name.text);
    else if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) names.push(d.name.getText(sf));
  }
  return names;
}

function hasReExport(sf) {
  return sf.statements.some((n) => ts.isExportDeclaration(n) && (n.moduleSpecifier || n.exportClause));
}

function ambientIdentifiers(sf) {
  const hits = new Set();
  const visit = (node) => {
    if (ts.isIdentifier(node) && AMBIENT.has(node.text) && !(ts.isPropertyAccessExpression(node.parent) && node.parent.name === node)) hits.add(node.text);
    if (ts.isPropertyAccessExpression(node) && /^(Date\.now|Math\.random)$/.test(node.getText(sf))) hits.add(node.getText(sf));
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return [...hits];
}

function checkFile(file, layer) {
  const text = readFileSync(resolve(root, file), "utf-8");
  const sf = parse(file, text);
  const n = codeLines(text);
  if (n > layer.limit && !excepted("§3.3", file)) fail("§3.3", `${file} has ${n} code lines; ${layer.role} limit is ${layer.limit}`);
  for (const fn of functionBodies(sf)) if (fn.lines > 20 && !excepted("§3.1", file)) fail("§3.1", `${file}: ${fn.name} body is ${fn.lines} lines (limit 20)`);
  const stem = basename(file).replace(/\.(mjs|ts)$/, "");
  if (SHAPE_NAMES.test(stem) && !excepted("§3.8", file)) fail("§3.8", `${file} is named for a shape, not a responsibility`);
  if (hasReExport(sf) && !excepted("§3.9", file)) fail("§3.9", `${file} re-exports symbols (barrel)`);
  if (layer.oneExport) {
    const names = exportedValues(sf);
    if (names.length !== 1 && !excepted("§3.2", file)) fail("§3.2", `${file} exports ${names.length} values (${names.join(", ")}); PURE files export exactly one`);
    if (names.length === 1 && names[0] !== stem && !excepted("§3.2", file)) fail("§3.2", `${file} exports ${names[0]}; filename must match`);
  }
  if (layer.pure) {
    const hits = ambientIdentifiers(sf);
    if (hits.length && !excepted("§1.4", file)) fail("§1.4", `${file} touches ambient state: ${hits.join(", ")}`);
  }
}

const files = [...walk("src"), ...walk("tools"), ...walk("scripts")];
let checked = 0;
for (const file of files) {
  const layer = LAYERS.find((l) => l.match(file));
  if (!layer) { fail("§0", `${file} is not covered by the layer mapping`); continue; }
  checkFile(file, layer);
  checked++;
}

if (failures.length) {
  console.error("check:standards FAILED\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log(`check:standards OK — ${checked} files checked across ${LAYERS.length} layer roles, ${exceptions.length} active exceptions`);
