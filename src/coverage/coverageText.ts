import type { CoverageSummary } from "./summarizeCoverage.js";

/** "1,234 characters · 1,180 verified · 54 unverified" for the status bar. */
export function coverageText(characters: number, summary: CoverageSummary): string {
  const n = (v: number) => v.toLocaleString("en-US");
  const parts = [`${n(characters)} character${characters === 1 ? "" : "s"}`];
  if (summary.verified + summary.unverified > 0) {
    parts.push(`${n(summary.verified)} verified`);
    if (summary.unverified > 0) parts.push(`${n(summary.unverified)} unverified`);
  }
  return parts.join(" \u00B7 ");
}
