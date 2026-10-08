import { writeFileSync } from "node:fs";
import { zipSync, type Zippable } from "fflate";

/** Deterministic zip: fixed timestamps, deflate level 6 (base64 payloads shrink ~25%). */
export function writeZip(path: string, files: Record<string, Uint8Array>): number {
  const entries: Zippable = {};
  for (const [name, data] of Object.entries(files)) entries[name] = [data, { level: 6, mtime: new Date("2026-01-01T00:00:00Z") }];
  const zip = zipSync(entries);
  writeFileSync(path, zip);
  return zip.length;
}
