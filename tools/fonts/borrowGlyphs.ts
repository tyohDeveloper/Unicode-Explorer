/** Copy glyphs from a donor font into a font that lacks them (tools/fonts/borrow_glyphs.py, D-27). */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "borrow_glyphs.py");

export function borrowGlyphs(target: Uint8Array, donor: Uint8Array, codePoints: readonly string[]): Uint8Array {
  const dir = mkdtempSync(join(tmpdir(), "ue-borrow-"));
  try {
    writeFileSync(join(dir, "target.otf"), target);
    writeFileSync(join(dir, "donor.otf"), donor);
    execFileSync(process.env.PYTHON ?? "python3", [script, join(dir, "target.otf"), join(dir, "donor.otf"), join(dir, "out.otf"), codePoints.join(",")], { stdio: ["ignore", "ignore", "pipe"] });
    return new Uint8Array(readFileSync(join(dir, "out.otf")));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
