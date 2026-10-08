/**
 * CONTROLLER: glyph detection. A canvas measures each character with the
 * output font stack terminated by Adobe Blank 2, a font that maps every code
 * point to an empty glyph. Ink means a listed font (device, pack, or embedded)
 * rendered it; no ink means none did, so the browser would fall through to
 * system fallback or a box. The probe cannot see system fallback, which is why
 * the answer is "verified" or "unverified", never "missing" (PLAN.md Phase 4).
 * Results are cached per stack; a stack change empties the cache.
 */
export interface GlyphProbe {
  verified(cp: number, text: string): boolean;
  setStack(stack: string): void;
}

const PROBE_SIZE = 32;

/** Ink, or an advance: Adobe Blank 2 glyphs have neither, so either proves a listed font supplied the glyph (spaces have no ink). */
function rendered(m: TextMetrics): boolean {
  return m.width > 0.01 || m.actualBoundingBoxLeft + m.actualBoundingBoxRight > 0.01 || m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0.01;
}

export function createGlyphProbe(blankFamily: string): GlyphProbe {
  const context = document.createElement("canvas").getContext("2d", { willReadFrequently: false });
  const cache = new Map<number, boolean>();
  let font = "";
  return {
    setStack(stack: string): void {
      const next = `${PROBE_SIZE}px ${stack},"${blankFamily}"`;
      if (next === font) return;
      font = next;
      cache.clear();
    },
    verified(cp: number, text: string): boolean {
      if (!context) return true;
      const hit = cache.get(cp);
      if (hit !== undefined) return hit;
      context.font = font;
      const result = rendered(context.measureText(text));
      cache.set(cp, result);
      return result;
    },
  };
}
