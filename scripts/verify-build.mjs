#!/usr/bin/env node
/**
 * Artifact verifier — docs/ARCHITECTURE.md §2, §7, §8, §9; CODING-STANDARDS §7.
 * Runs after build:bundle and fails on the first broken contract. Each failure
 * message names the section it enforces.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { DOMParser } from "./xmlParse.mjs";

const root = resolve(import.meta.dirname, "..");
const artifactPath = resolve(root, "Unicode.html");
const html = readFileSync(artifactPath, "utf-8");
const failures = [];
const fail = (section, msg) => failures.push(`[${section}] ${msg}`);

/* §2 no network: forbidden APIs and external URLs */
for (const api of ["fetch(", "XMLHttpRequest", "sendBeacon", "new WebSocket", "serviceWorker", "RTCPeerConnection", "EventSource", "importScripts("]) {
  if (html.includes(api)) fail("ARCHITECTURE §2", `artifact references ${api}`);
}
/*
 * URLs may appear as text (license notices, the About dialog, navigation links);
 * what must not appear is a URL in a position that loads a resource: src= on
 * any element, href= on <link>, CSS url() or @import, or a <script src> pointing
 * anywhere but the sidecar pack directory the runtime injects at run time.
 */
const resourceUrlRe = /(?:\bsrc|<link[^>]*\bhref)\s*=\s*["']?\s*(?:https?:)?\/\//gi;
for (const m of html.match(resourceUrlRe) ?? []) fail("ARCHITECTURE §2", `resource loaded from an external URL: ${m.slice(0, 80)}`);
const css = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []).join("\n");
if (/url\((?!\s*["']?data:)/i.test(css)) fail("ARCHITECTURE §2", "CSS url() that is not a data: URL");
if (/@import\s/i.test(css)) fail("ARCHITECTURE §2", "CSS @import survived the build");
if (/<script[^>]*\bsrc=/i.test(html)) fail("ARCHITECTURE §2", "static <script src> in artifact");

/* §3 no storage */
for (const api of ["localStorage", "sessionStorage", "indexedDB", "document.cookie", "openDatabase"]) {
  if (html.includes(api)) fail("ARCHITECTURE §3", `artifact references ${api}`);
}

/* §2 CSP present with the required directives */
const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
if (!csp) fail("ARCHITECTURE §2", "no Content-Security-Policy meta");
for (const d of ["default-src 'none'", "connect-src 'none'", "object-src 'none'", "base-uri 'none'", "font-src data:"]) {
  if (!csp.includes(d)) fail("ARCHITECTURE §2", `CSP lacks ${d}`);
}

/* §8 strict-XML shell and CDATA wrapping */
try {
  new DOMParser().parse(html);
} catch (e) {
  fail("ARCHITECTURE §8", `artifact is not well-formed XML: ${e.message}`);
}
if ((html.match(/<script[^>]*>\/\*<!\[CDATA\[\*\//g) ?? []).length !== 1) fail("ARCHITECTURE §8", "script body is not CDATA-wrapped exactly once");
if ((html.match(/<style[^>]*>\/\*<!\[CDATA\[\*\//g) ?? []).length !== 1) fail("ARCHITECTURE §8", "style body is not CDATA-wrapped exactly once");
if (/<script[^>]*\ssrc=/.test(html)) fail("ARCHITECTURE §2", "artifact references an external script");
if ((html.match(/\]\]>/g) ?? []).length !== 2) fail("ARCHITECTURE §8", "unexpected ']]>' inside an inlined body");
if (/<!--/.test(html)) fail("ARCHITECTURE §8", "comment survived minification");

/* §9 test IDs */
const manifest = JSON.parse(readFileSync(resolve(root, "scripts/testid-manifest.json"), "utf-8"));
const allIds = [...html.matchAll(/data-testid="([^"]+)"/g)].map((m) => m[1]);
const present = new Set(allIds);
if (allIds.length !== present.size) fail("CODING-STANDARDS §4.3", `duplicate data-testid in artifact: ${allIds.filter((id, i) => allIds.indexOf(id) !== i).join(", ")}`);
for (const id of manifest.dynamic) if (!html.includes(id.split("<")[0])) fail("ARCHITECTURE §9", `dynamic test ID prefix not found in bundle: ${id}`);
for (const id of manifest.required) if (!present.has(id)) fail("ARCHITECTURE §9", `required test ID missing: ${id}`);
for (const id of present) if (!manifest.required.includes(id)) fail("ARCHITECTURE §9", `test ID in artifact but not in manifest: ${id}`);
for (const id of [...present, ...manifest.required]) if (!/^[a-z]+-[a-z0-9]+-[a-z0-9-]+$/.test(id)) fail("ARCHITECTURE §9", `test ID violates {role}-{area}-{name}: ${id}`);

/* §7 version stamp agrees with package.json and data/version.json */
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));
const data = JSON.parse(readFileSync(resolve(root, "data/version.json"), "utf-8"));
if (!html.includes(`content="unicode-explorer app ${pkg.version} data ${data.data}"`)) fail("ARCHITECTURE §11", "generator meta does not match package.json / data/version.json");
if (!html.includes(`Unicode ${data.unicode}`)) fail("ARCHITECTURE §5", "header does not name the data Unicode version");

/* §7.6 size and gzip baseline */
const gz = gzipSync(html, { level: 9 }).length;
const baselinePath = resolve(root, "scripts/build-baseline.json");
if (!existsSync(baselinePath)) fail("CODING-STANDARDS §7.6", "scripts/build-baseline.json missing");
else {
  const base = JSON.parse(readFileSync(baselinePath, "utf-8"));
  if (gz > base.gzipBytes * 1.05) fail("CODING-STANDARDS §7.6", `gzip ${gz} exceeds baseline ${base.gzipBytes} by more than 5%; update the baseline in a reviewed commit with a note`);
}

if (failures.length) {
  console.error("verify:build FAILED\n" + failures.map((f) => "  " + f).join("\n"));
  process.exit(1);
}
console.log(`verify:build OK — ${Buffer.byteLength(html)} bytes, gzip ${gz}, ${present.size} test IDs, CSP present, XML well-formed`);
