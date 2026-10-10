/**
 * Subset an SFNT to code-point ranges with fontTools (pyftsubset), keeping
 * every OpenType layout feature and the glyphs they reach, so shaping is
 * unchanged for the retained characters (PLAN.md D-20). fontTools is pinned
 * in tools/fonts/requirements.txt; output is byte-identical across runs.
 * harfbuzzjs (via subset-font) was tried first and truncated the glyf table
 * for subsets of ~20,000 glyphs (2026-10-08).
 *
 * Every subset also keeps U+0020, U+00A0 and U+25CC DOTTED CIRCLE when the
 * font has them (D-26, Phase 10 R-0/R-1): the app draws marks on U+25CC,
 * browsers draw a cluster from one font, HarfBuzz uses U+25CC for broken
 * clusters and the space glyph for default-ignorable characters. It also keeps
 * the canonical decomposition of every retained character, so HarfBuzz's
 * normalisation can choose the same glyphs as with the full font (R-1).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLUSTER_SUPPORT: readonly (readonly [string, string])[] = [["0020", "0020"], ["00A0", "00A0"], ["25CC", "25CC"]];
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let decompositions: Map<number, number[]> | null = null;

/** Canonical decompositions from the vendored UnicodeData.txt (no compatibility <tag> mappings). */
function canonical(): Map<number, number[]> {
  if (decompositions) return decompositions;
  const { unicode } = JSON.parse(readFileSync(resolve(repoRoot, "data/version.json"), "utf-8")) as { unicode: string };
  decompositions = new Map();
  for (const line of readFileSync(resolve(repoRoot, `data/ucd/${unicode}/UnicodeData.txt`), "utf-8").split("\n")) {
    const f = line.split(";");
    if (f[5] && !f[5].startsWith("<")) decompositions.set(parseInt(f[0], 16), f[5].split(" ").map((h) => parseInt(h, 16)));
  }
  return decompositions;
}

/** Components of the retained characters' decompositions, recursively, as single-code-point ranges. */
function decompositionRanges(ranges: readonly (readonly [string, string])[]): [string, string][] {
  const map = canonical(), out = new Set<number>(), todo: number[] = [];
  for (const [a, b] of ranges) for (let cp = parseInt(a, 16); cp <= parseInt(b, 16); cp++) if (map.has(cp)) todo.push(cp);
  while (todo.length) for (const c of map.get(todo.pop()!) ?? []) if (!out.has(c)) { out.add(c); todo.push(c); }
  return [...out].map((cp) => { const h = cp.toString(16).toUpperCase().padStart(4, "0"); return [h, h]; });
}

export function subsetSfnt(sfnt: Uint8Array, ranges: readonly (readonly [string, string])[]): Uint8Array {
  const dir = mkdtempSync(join(tmpdir(), "ue-subset-"));
  try {
    writeFileSync(join(dir, "in.ttf"), sfnt);
    const unicodes = [...ranges, ...CLUSTER_SUPPORT, ...decompositionRanges(ranges)].map(([a, b]) => `U+${a}-${b}`).join(",");
    const args = ["-m", "fontTools.subset", join(dir, "in.ttf"), `--unicodes=${unicodes}`, "--layout-features=*", "--glyph-names", "--notdef-outline", "--name-IDs=*", "--name-languages=*", `--output-file=${join(dir, "out.ttf")}`];
    execFileSync(process.env.PYTHON ?? "python3", args, { stdio: ["ignore", "ignore", "pipe"] });
    return new Uint8Array(readFileSync(join(dir, "out.ttf")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
