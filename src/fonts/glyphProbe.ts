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
 *
 * Combining marks are shown on U+25CC (displayForm), and browsers draw a
 * cluster from one font, so a mark counts as verified only when one listed
 * family has both the mark and the dotted circle (Phase 10, R-0).
 */
import { sampleBlock } from "../coverage/sampleBlock.js";
import { blockOf } from "../ucd/blockOf.js";
import { isCombiningMark } from "../ucd/isCombiningMark.js";
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
  /** Per family: does it draw U+25CC (R-0)? Fonts don't change within a stack. */
  circle: Map<string, boolean>;
  /** Per block: a font list of only the families that have U+25CC, for one-measure mark checks. */
  circleFonts: Map<number, string>;
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
  st.circle.clear();
  st.circleFonts.clear();
}

/** Block-serving families first (they precede the embedded fonts in the stack), then each embedded font. */
function drawnBy(st: ProbeState, cp: number, text: string): string | null {
  if (!st.context) return null;
  return orderedFamilies(st, cp).find((f) => drawsCluster(st, f, cp, text)) ?? null;
}

const DOTTED_CIRCLE = "\u25CC";

/** Families that could draw the character, in stack order: block-serving candidates, then each embedded font. */
function orderedFamilies(st: ProbeState, cp: number): string[] {
  blockFont(st, cp);
  const block = blockOf(cp);
  return [...((block && st.blockFamilies.get(block.start)) || []), ...st.embedded];
}

/** One family draws the text, and for a combining mark also the dotted circle it sits on. */
function drawsCluster(st: ProbeState, family: string, cp: number, text: string): boolean {
  if (isCombiningMark(cp) && !hasCircle(st, family)) return false;
  return draws(st, fontFor(st, [family]), text);
}

function hasCircle(st: ProbeState, family: string): boolean {
  let circle = st.circle.get(family);
  if (circle === undefined) { circle = draws(st, fontFor(st, [family]), DOTTED_CIRCLE); st.circle.set(family, circle); }
  return circle;
}

/** A mark is drawn as a cluster when a family that has U+25CC also draws the mark: one measurement per mark. */
function markVerified(st: ProbeState, cp: number, text: string): boolean {
  // Tier 1, like the main probe: embedded families with U+25CC, without sampling the block's candidates.
  let embedded = st.circleFonts.get(-1);
  if (embedded === undefined) { const fams = st.embedded.filter((f) => hasCircle(st, f)); embedded = fams.length ? fontFor(st, fams) : ""; st.circleFonts.set(-1, embedded); }
  if (embedded !== "" && draws(st, embedded, text)) return true;
  const start = blockOf(cp)?.start ?? -2;
  let font = st.circleFonts.get(start);
  if (font === undefined) {
    const families = orderedFamilies(st, cp).filter((f) => hasCircle(st, f));
    font = families.length ? fontFor(st, families) : "";
    st.circleFonts.set(start, font);
  }
  return font !== "" && draws(st, font, text);
}

function verified(st: ProbeState, cp: number, text: string): boolean {
  if (!st.context) return true;
  const hit = st.cache.get(cp);
  if (hit !== undefined) return hit;
  let result: boolean;
  if (isCombiningMark(cp)) result = markVerified(st, cp, text);
  else {
    result = draws(st, st.embeddedFont, text);
    if (!result) { const font = blockFont(st, cp); result = font !== null && draws(st, font, text); }
  }
  st.cache.set(cp, result);
  return result;
}

export function createGlyphProbe(blankFamily: string): GlyphProbe {
  const st: ProbeState = { context: document.createElement("canvas").getContext("2d"), blank: blankFamily, cache: new Map(), presence: new Map(), blockFonts: new Map(), blockFamilies: new Map(), candidates: [], embeddedFont: "", embedded: [], circle: new Map(), circleFonts: new Map(), key: "" };
  return {
    familyPresent: (family) => familyPresent(st, family),
    setStack: (next, embedded) => setStack(st, next, embedded),
    verified: (cp, text) => verified(st, cp, text),
    servingFamilies: (cp) => { blockFont(st, cp); const b = blockOf(cp); return (b && st.blockFamilies.get(b.start)) || []; },
    drawnBy: (cp, text) => drawnBy(st, cp, text),
    rendersWith: (families, text) => !!st.context && families.length > 0 && draws(st, fontFor(st, families), text),
  };
}
