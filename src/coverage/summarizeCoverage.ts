import type { CodePointItem } from "../selection/collectCodePoints.js";

export interface CoverageSummary { verified: number; unverified: number; byBlock: Map<string, { verified: number; unverified: number }> }

/**
 * Count, overall and per block, the visible characters a listed font renders
 * ("verified") versus those none does ("unverified": the device may still
 * draw them through system fallback, or show a box). Reserved and non-visible
 * items are not counted.
 */
export function summarizeCoverage(items: readonly CodePointItem[], verified: (cp: number) => boolean, hidden: (cp: number) => boolean): CoverageSummary {
  const summary: CoverageSummary = { verified: 0, unverified: 0, byBlock: new Map() };
  for (const item of items) {
    if (item.reserved || hidden(item.cp)) continue;
    const block = summary.byBlock.get(item.block) ?? { verified: 0, unverified: 0 };
    if (verified(item.cp)) { block.verified++; summary.verified++; } else { block.unverified++; summary.unverified++; }
    summary.byBlock.set(item.block, block);
  }
  return summary;
}
