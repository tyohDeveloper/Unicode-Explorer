/**
 * Within each block, find runs of code points that UnicodeData.txt does not
 * assign. Surrogates, private use, planes 15–16, and noncharacters are skipped
 * (the runtime classifies those by category, not as "reserved").
 */
function isSkipped(cp: number): boolean {
  if (cp >= 0xd800 && cp <= 0xdfff) return true;
  if (cp >= 0xe000 && cp <= 0xf8ff) return true;
  if (cp >= 0xf0000) return true;
  if (cp >= 0xfdd0 && cp <= 0xfdef) return true;
  return (cp & 0xffff) === 0xfffe || (cp & 0xffff) === 0xffff;
}

export function buildUnassignedRanges(
  blockRanges: [number, number][],
  assigned: Set<number>,
): [number, number][] {
  const result: [number, number][] = [];
  for (const [bStart, bEnd] of blockRanges) {
    let runStart = -1;
    const endRun = (at: number) => { if (runStart >= 0) { result.push([runStart, at]); runStart = -1; } };
    for (let cp = bStart; cp <= bEnd; cp++) {
      if (isSkipped(cp)) { endRun(cp - 1); continue; }
      const unassigned = !assigned.has(cp);
      if (unassigned && runStart < 0) runStart = cp;
      else if (!unassigned) endRun(cp - 1);
    }
    endRun(bEnd);
  }
  return result;
}
