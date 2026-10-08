import type { DisplayMode, Settings } from "./settings.js";
import { DISPLAY_MODES } from "./settings.js";

function parseBlocks(value: string): number[] {
  return value.split(",").map((h) => parseInt(h, 16)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 0x10ffff);
}

/** Inverse of encodeHashState; unknown keys and malformed values are ignored. */
export function decodeHashState(hash: string): Partial<Settings> {
  const out: Partial<Settings> = {};
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const b = params.get("b");
  if (b !== null) out.blocks = parseBlocks(b);
  const m = params.get("m");
  if (m && (DISPLAY_MODES as readonly string[]).includes(m)) out.mode = m as DisplayMode;
  const f = params.get("f");
  if (f) out.font = f;
  const s = Number(params.get("s"));
  if (params.has("s") && Number.isFinite(s)) out.size = s;
  if (params.get("nv") === "1") out.nonVisible = true;
  const q = params.get("q");
  if (q) out.nameFilter = q;
  return out;
}
