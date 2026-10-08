/**
 * Materialise one font in fonts/cache/<id>.woff2 from its manifest source:
 * download (or reuse), verify or pin the upstream SHA-256, extract a zip member,
 * convert SFNT to WOFF2. Returns the WOFF2 bytes. Mutates the entry's recorded
 * hashes and counts so the caller can write the manifest back.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync } from "fflate";
import type { FontEntry } from "./fontManifest.js";
import { downloadBytes } from "./downloadBytes.js";
import { sha256Hex } from "./sha256Hex.js";
import { toWoff2 } from "./toWoff2.js";
import { readCmap } from "./readCmap.js";

async function sourceBytes(cacheDir: string, font: FontEntry): Promise<Uint8Array> {
  const path = resolve(cacheDir, `${font.id}.source.${font.source.format.split("/")[0]}`);
  // An unpinned source (sha256 null: new font or new version) always downloads; a cached file
  // is only trusted against a pin, so an old version can never be pinned to a new URL.
  const cached = !!font.source.sha256 && existsSync(path);
  const bytes = cached ? new Uint8Array(readFileSync(path)) : await downloadBytes(font.source.url);
  const sha = sha256Hex(bytes);
  if (font.source.sha256 && font.source.sha256 !== sha) throw new Error(`${font.id}: upstream sha256 ${sha} does not match pinned ${font.source.sha256}`);
  if (!font.source.sha256) { font.source.sha256 = sha; font.source.bytes = bytes.length; delete font.source.note; }
  if (!cached) writeFileSync(path, bytes);
  return bytes;
}

function extractMember(bytes: Uint8Array, member: string): Uint8Array {
  const files = unzipSync(bytes, { filter: (f) => f.name === member });
  if (!files[member]) throw new Error(`zip has no member ${member}`);
  return files[member];
}

async function convert(font: FontEntry, source: Uint8Array): Promise<Uint8Array> {
  const sfnt = font.source.member ? extractMember(source, font.source.member) : source;
  const format = font.source.format.split("/").pop();
  return format === "woff" || format === "woff2" ? sfnt : toWoff2(sfnt);
}

export async function cacheFont(repoRoot: string, font: FontEntry, visible: ReadonlySet<number>): Promise<Uint8Array> {
  const cacheDir = resolve(repoRoot, "fonts/cache");
  mkdirSync(cacheDir, { recursive: true });
  const woff2 = await convert(font, await sourceBytes(cacheDir, font));
  const cmap = readCmap(woff2);
  font.woff2_sha256 = sha256Hex(woff2);
  font.woff2_bytes = woff2.length;
  font.cmap_code_points = cmap.length;
  font.assigned_visible_cmap_count = cmap.filter((cp) => visible.has(cp)).length;
  writeFileSync(resolve(cacheDir, `${font.id}.${font.source.format.endsWith("woff") ? "woff" : "woff2"}`), woff2);
  return woff2;
}
