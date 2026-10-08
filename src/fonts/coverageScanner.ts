/**
 * CONTROLLER: probe every visible character of the current output in idle
 * slices (CP2-01), building the coverage summary incrementally so the first
 * paint never waits for detection. Progress is reported at most once per
 * animation frame; done=true on the final report. cancel() on re-render.
 */
import { addToCoverage } from "../coverage/addToCoverage.js";
import type { CoverageSummary } from "../coverage/summarizeCoverage.js";
import type { CodePointItem } from "../selection/collectCodePoints.js";
import { runInIdleSlices } from "../render/idleSlices.js";

export interface CoverageScan { summary: CoverageSummary; cancel(): void }

export function startCoverageScan(items: readonly CodePointItem[], verified: (cp: number) => boolean, hidden: (cp: number) => boolean, onProgress: (summary: CoverageSummary, done: boolean) => void): CoverageScan {
  const summary: CoverageSummary = { verified: 0, unverified: 0, byBlock: new Map() };
  let index = 0;
  let frame = 0;
  const report = (done: boolean) => {
    if (done) { cancelAnimationFrame(frame); onProgress(summary, true); return; }
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; onProgress(summary, false); });
  };
  const cancel = runInIdleSlices(() => {
    for (let n = 0; n < 16 && index < items.length; n++, index++) {
      const item = items[index];
      if (!item.reserved && !hidden(item.cp)) addToCoverage(summary, item.block, verified(item.cp));
    }
    if (index < items.length) { report(false); return true; }
    report(true);
    return false;
  });
  return { summary, cancel: () => { cancel(); cancelAnimationFrame(frame); } };
}
