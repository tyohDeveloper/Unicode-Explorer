#!/usr/bin/env node
/**
 * Standards lint — enforces docs/CODING-STANDARDS.md §3.1 (function length),
 * §3.3 (file length by layer role), §3.8 (shape names), and §11 (exception
 * expiry) over the layer mapping in §0 of that file. Uses the TypeScript
 * compiler API for function measurement (§7.4: AST, not regex). Every failure
 * names the section it enforces (§7.8).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, relative, basename, join } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const fail = (section, msg) => failures.push(`[CODING-STANDARDS ${section}] ${msg}`);

/* §0 mapping for the current layout. Phase 3 moves this to src/ and the table changes with it. */
const LAYERS = [
  { role: "VIEW", limit: 250, files: ["unicode-src/js/01-sidebar.js", "unicode-src/js/02-render-core.js", "unicode-src/js/03-render-grid.js", "unicode-src/js/04-render-table.js", "unicode-src/js/05-render-plain.js", "unicode-src/js/06-controls.js"] },
  { role: "PURE", limit: 150, files: ["unicode-src/js/00-classify.js", "unicode-src/data/charnames.js"] },
  { role: "DATA", limit: Infinity, files: ["unicode-src/data/blocks.js", "unicode-src/data/algo-ranges.js"] },
  { role: "BUILD", limit: 250, files: walk("tools").filter((f) => f.endsWith(".ts")) },
];
const SHAPE_NAMES = /^(helpers?|utils?|misc|common|shared|handlers|setters|getters|stuff|things|lib|index|types|useHelpers|useHandlers|useSetters|client|stub|connector|gateway)$/i;

/* §11 exceptions: active entries suppress (section, file) pairs; expired entries fail. */
const today = new Date().toISOString().slice(0, 10);
const exceptions = JSON.parse(readFileSync(resolve(root, ".architecture-exceptions.json"), "utf-8")).exceptions;
for (const ex of exceptions) if (ex.expires < today) fail("§11", `exception ${ex.id} (${ex.section}) expired ${ex.expires}; renew or remove`);
const excepted = (section, file) => exceptions.some((ex) => ex.expires >= today && ex.section === section && ex.scope.includes(file));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(resolve(root, dir))) {
    const p = join(dir, name);
    if (statSync(resolve(root, p)).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function codeLines(text) {
  return text.split("\n").filter((l) => { const t = l.trim(); return t && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*"); }).length;
}

function functionBodies(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, file.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS);
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

for (const layer of LAYERS) {
  for (const file of layer.files) {
    const text = readFileSync(resolve(root, file), "utf-8");
    const n = codeLines(text);
    if (n > layer.limit && !excepted("§3.3", file)) fail("§3.3", `${file} has ${n} code lines; ${layer.role} limit is ${layer.limit}`);
    if (layer.role !== "DATA") {
      for (const fn of functionBodies(file, text)) {
        if (fn.lines > 20 && !excepted("§3.1", file)) fail("§3.1", `${file}: ${fn.name} body is ${fn.lines} lines (limit 20)`);
      }
    }
    const stem = basename(file).replace(/\.(m?js|ts)$/, "").replace(/^\d+-/, "");
    if (SHAPE_NAMES.test(stem) && !excepted("§3.8", file)) fail("§3.8", `${file} is named for a shape, not a responsibility`);
  }
}

if (failures.length) {
  console.error("check:standards FAILED\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log(`check:standards OK — ${LAYERS.reduce((a, l) => a + l.files.length, 0)} files checked, ${exceptions.length} active exceptions`);
