/**
 * CONTROLLER: run `step` repeatedly in short slices so long work never blocks
 * input (requestIdleCallback where available, else a zero timeout). `step`
 * returns false when finished. The returned function cancels.
 */
type IdleWindow = Window & { requestIdleCallback?: (cb: (d: { timeRemaining(): number }) => void) => number; cancelIdleCallback?: (h: number) => void };

export function runInIdleSlices(step: () => boolean, budgetMs = 8): () => void {
  const w = window as IdleWindow;
  let cancelled = false;
  let handle = 0;
  const slice = (deadline?: { timeRemaining(): number }) => {
    if (cancelled) return;
    const end = performance.now() + Math.max(budgetMs, deadline ? Math.min(deadline.timeRemaining(), 40) : 0);
    while (performance.now() < end) if (!step()) return;
    schedule();
  };
  const schedule = () => { handle = w.requestIdleCallback ? w.requestIdleCallback(slice) : window.setTimeout(slice, 0); };
  schedule();
  return () => {
    cancelled = true;
    if (w.cancelIdleCallback) w.cancelIdleCallback(handle); else clearTimeout(handle);
  };
}
