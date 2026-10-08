/**
 * Code points that are assigned in the build's Unicode version and visible
 * (not hidden by src/data/visibility.json). This is the denominator for every
 * coverage figure in fonts/manifest.json; see its measurement_note.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseUnicodeData } from "../ucd/parseUnicodeData.js";
import { readUcdFile } from "../ucd/readUcdFile.js";

export function visibleAssignedSet(repoRoot: string): Set<number> {
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  const { hidden } = JSON.parse(readFileSync(resolve(repoRoot, "src/data/visibility.json"), "utf-8")) as { hidden: [number, number, string][] };
  const { assigned } = parseUnicodeData(readUcdFile(repoRoot, unicode, "UnicodeData.txt"));
  for (const [start, end] of hidden) for (let cp = start; cp <= end; cp++) assigned.delete(cp);
  return assigned;
}
