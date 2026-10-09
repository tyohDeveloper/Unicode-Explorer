/**
 * CONTROLLER: glyph detection. A canvas measures each character with a font
 * list terminated by Adobe Blank 2, which maps every code point to an empty
 * glyph: ink or an advance means a listed font rendered it ("verified"),
 * nothing means none did. The probe cannot see system fallback (PLAN D-12).
 *
 * Tiered for speed (CP2-01): first the embedded fonts alone; then only the
 * candidate families that render at least one sample of the character's
 * block. Fonts that serve none of a block's samples are skipped for that
 * block, which can only under-report. Results are cached per stack.
 */
import { sampleBlock } from "../coverage/sampleBlock.js";
import { blockOf } from "../ucd/blockOf.js";
import { isGenericFamily } from "./isGenericFamily.js";

export interface GlyphProbe {
  verified(cp: number, text: string): boolean;
  /** Candidate families in stack order, and the embedded coverage families. */
  setStack(candidates: readonly string[], embedded: readonly string[]): void;
  /** True when the family is installed (or embedded/registered): it draws a space, which Adobe Blank does not. */
  familyPresent(family: string): boolean;
  /** Candidate families that render at least one sample of the code point's block (the CSS dialog's no-download form). */
  servingFamilies(cp: number): readonly string[];
  /** Whether the given families (and nothing else) render the text. */
  rendersWith(families: readonly string[], text: string): boolean;
  /** The first family in stack order that draws the text (D-22), or null when none named does. */
  drawnBy(cp: number, text: string): string | null;
}

const PROBE_SIZE = 32;
const SAMPLES = 24;

function rendered(m: TextMetrics): boolean {
  return m.width > 0.01 || m.actualBoundingBoxLeft + m.actualBoundingBoxRight > 0.01 || m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0.01;
}

const css = (name: string) => (isGenericFamily(name) ? name : `"${name.replace(/"/g, "")}"`);

interface ProbeState {
  context: CanvasRenderingContext2D | null;
  blank: string;
  cache: Map<number, boolean>;
  presence: Map<string, boolean>;
  blockFonts: Map<number, string>;
  blockFamilies: Map<number, string[]>;
  candidates: readonly string[];
  embeddedFont: string;
  embedded: string[];
  key: string;
}

function draws(st: ProbeState, font: string, text: string): boolean {
  st.context!.font = font;
  return rendered(st.context!.measureText(text));
}

function fontFor(st: ProbeState, families: readonly string[]): string {
  return `${PROBE_SIZE}px ${[...families.map(css), `"${st.blank}"`].join(",")}`;
}

/** Font list for the character's block: candidates that render at least one block sample ("" when none do). */
function blockFont(st: ProbeState, cp: number): string | null {
  const block = blockOf(cp);
  if (!block) return null;
  let font = st.blockFonts.get(block.start);
  if (font === undefined) {
    const samples = sampleBlock(block, SAMPLES).map((s) => String.fromCodePoint(s));
    const serving = st.candidates.filter((f) => samples.some((s) => draws(st, fontFor(st, [f]), s)));
    font = serving.length ? fontFor(st, serving) : "";
    st.blockFonts.set(block.start, font);
    st.blockFamilies.set(block.start, serving);
  }
  return font || null;
}

function familyPresent(st: ProbeState, family: string): boolean {
  if (!st.context) return true;
  let present = st.presence.get(family);
  if (present === undefined) { present = draws(st, fontFor(st, [family]), " \u00A0"); st.presence.set(family, present); }
  return present;
}

function setStack(st: ProbeState, next: readonly string[], embedded: readonly string[]): void {
  const key = `${next.join("|")}#${embedded.join("|")}`;
  if (key === st.key) return;
  st.key = key;
  st.candidates = next.filter((f) => !embedded.includes(f));
  st.embeddedFont = fontFor(st, embedded);
  st.embedded = [...embedded];
  st.cache.clear();
  st.blockFonts.clear();
  st.blockFamilies.clear();
}

/** Block-serving families first (they precede the embedded fonts in the stack), then each embedded font. */
function drawnBy(st: ProbeState, cp: number, text: string): string | null {
  if (!st.context) return null;
  blockFont(st, cp);
  const block = blockOf(cp);
  const serving = (block && st.blockFamilies.get(block.start)) || [];
  return [...serving, ...st.embedded].find((f) => draws(st, fontFor(st, [f]), text)) ?? null;
}

function verified(st: ProbeState, cp: number, text: string): boolean {
  if (!st.context) return true;
  const hit = st.cache.get(cp);
  if (hit !== undefined) return hit;
  let result = draws(st, st.embeddedFont, text);
  if (!result) { const font = blockFont(st, cp); result = font !== null && draws(st, font, text); }
  st.cache.set(cp, result);
  return result;
}

export function createGlyphProbe(blankFamily: string): GlyphProbe {
  const st: ProbeState = { context: document.createElement("canvas").getContext("2d"), blank: blankFamily, cache: new Map(), presence: new Map(), blockFonts: new Map(), blockFamilies: new Map(), candidates: [], embeddedFont: "", embedded: [], key: "" };
  return {
    familyPresent: (family) => familyPresent(st, family),
    setStack: (next, embedded) => setStack(st, next, embedded),
    verified: (cp, text) => verified(st, cp, text),
    servingFamilies: (cp) => { blockFont(st, cp); const b = blockOf(cp); return (b && st.blockFamilies.get(b.start)) || []; },
    drawnBy: (cp, text) => drawnBy(st, cp, text),
    rendersWith: (families, text) => !!st.context && families.length > 0 && draws(st, fontFor(st, families), text),
  };
}
