/**
 * Build the compressed per-character property table for the details strip
 * (PLAN.md D-19, finding DAT-05): General_Category, Script and Age as
 * run-length tables with long value names, plus Decomposition_Mapping.
 * Hangul syllable decompositions are algorithmic and computed at run time.
 */
import { deflateSync, strToU8 } from "fflate";
import { encodeRuns } from "./encodeRuns.js";
import { mapToRanges } from "./mapToRanges.js";

export interface PropertySources {
  categoryMap: ReadonlyMap<number, string>;
  decompositionMap: ReadonlyMap<number, string>;
  scripts: readonly (readonly [number, number, string])[];
  ages: readonly (readonly [number, number, string])[];
  gcNames: ReadonlyMap<string, string>;
}

function decompositions(map: ReadonlyMap<number, string>): (number | string)[] {
  const out: (number | string)[] = [];
  let previous = 0;
  for (const cp of [...map.keys()].sort((a, b) => a - b)) { out.push(cp - previous, map.get(cp) as string); previous = cp; }
  return out;
}

export function buildProperties(src: PropertySources): { json: string; data: string } {
  const gc = encodeRuns(mapToRanges(src.categoryMap));
  const table = {
    gc: { ...gc, names: gc.values.map((v) => src.gcNames.get(v) ?? v) },
    sc: encodeRuns(src.scripts),
    age: encodeRuns(src.ages),
    dm: decompositions(src.decompositionMap),
  };
  const json = JSON.stringify(table);
  return { json, data: Buffer.from(deflateSync(strToU8(json), { level: 9, mem: 12 })).toString("base64") };
}
