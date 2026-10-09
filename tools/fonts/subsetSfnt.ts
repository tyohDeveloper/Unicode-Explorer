/**
 * Subset an SFNT to code-point ranges with fontTools (pyftsubset), keeping
 * every OpenType layout feature and the glyphs they reach, so shaping is
 * unchanged for the retained characters (PLAN.md D-20). fontTools is pinned
 * in tools/fonts/requirements.txt; output is byte-identical across runs.
 * harfbuzzjs (via subset-font) was tried first and truncated the glyf table
 * for subsets of ~20,000 glyphs (2026-10-08).
 *
 * Every subset also keeps U+00A0 and U+25CC DOTTED CIRCLE when the font has
 * them (D-26, Phase 10 R-0): the app draws marks on U+25CC, browsers draw a
 * cluster from one font, and HarfBuzz uses U+25CC for broken clusters.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLUSTER_SUPPORT: readonly (readonly [string, string])[] = [["00A0", "00A0"], ["25CC", "25CC"]];

export function subsetSfnt(sfnt: Uint8Array, ranges: readonly (readonly [string, string])[]): Uint8Array {
  const dir = mkdtempSync(join(tmpdir(), "ue-subset-"));
  try {
    writeFileSync(join(dir, "in.ttf"), sfnt);
    const unicodes = [...ranges, ...CLUSTER_SUPPORT].map(([a, b]) => `U+${a}-${b}`).join(",");
    const args = ["-m", "fontTools.subset", join(dir, "in.ttf"), `--unicodes=${unicodes}`, "--layout-features=*", "--glyph-names", "--notdef-outline", "--name-IDs=*", "--name-languages=*", `--output-file=${join(dir, "out.ttf")}`];
    execFileSync(process.env.PYTHON ?? "python3", args, { stdio: ["ignore", "ignore", "pipe"] });
    return new Uint8Array(readFileSync(join(dir, "out.ttf")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
