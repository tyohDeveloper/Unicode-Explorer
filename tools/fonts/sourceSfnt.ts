/** The cached upstream SFNT for a font (fonts/cache/<id>.source.*), extracting its zip member when the source is a zip. */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync } from "fflate";
import type { FontEntry } from "./fontManifest.js";

export function sourceSfnt(repoRoot: string, font: FontEntry): Uint8Array {
  const path = resolve(repoRoot, "fonts/cache", `${font.id}.source.${font.source.format.split("/")[0]}`);
  if (!existsSync(path)) throw new Error(`${path} is missing; run npm run fetch:fonts`);
  const bytes = new Uint8Array(readFileSync(path));
  if (!font.source.member) return bytes;
  const member = font.source.member;
  const files = unzipSync(bytes, { filter: (f) => f.name === member });
  if (!files[member]) throw new Error(`${font.id}: zip has no member ${member}`);
  return files[member];
}
