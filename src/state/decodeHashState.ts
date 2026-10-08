import type { DisplayMode, Settings } from "./settings.js";
import { DISPLAY_MODES, PRESENTATIONS, type Presentation } from "./settings.js";

function parseBlocks(value: string): number[] {
  return value.split(",").map((h) => parseInt(h, 16)).filter((n) => Number.isInteger(n) && n >= 0 && n <= 0x10ffff);
}

const FLAGS = { p: "placeholders", bold: "bold", italic: "italic", nosynth: "noSynthesis" } as const;

/** Boolean settings written as key=1. */
function decodeFlags(params: URLSearchParams): Partial<Settings> {
  const out: Partial<Settings> = {};
  for (const [key, field] of Object.entries(FLAGS)) if (params.get(key) === "1") out[field] = true;
  return out;
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
  Object.assign(out, decodeFlags(params));
  const l = params.get("l");
  if (l && /^[A-Za-z0-9-]{2,12}$/.test(l)) out.lang = l;
  const e = params.get("e");
  if (e && (PRESENTATIONS as readonly string[]).includes(e)) out.presentation = e as Presentation;
  return out;
}
