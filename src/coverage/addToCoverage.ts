import type { CoverageSummary } from "./summarizeCoverage.js";

/** Count one probed character into a running summary (the incremental form of summarizeCoverage). */
export function addToCoverage(summary: CoverageSummary, block: string, verified: boolean): void {
  const entry = summary.byBlock.get(block) ?? { verified: 0, unverified: 0 };
  if (verified) { entry.verified++; summary.verified++; } else { entry.unverified++; summary.unverified++; }
  summary.byBlock.set(block, entry);
}
