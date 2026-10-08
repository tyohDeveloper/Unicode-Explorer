/** CONTROLLER: trailing-edge debounce so rapid checkbox clicks render once (80 ms, as in v1). */
export function createRenderScheduler(render: () => void, delayMs = 80): () => void {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (handle !== null) clearTimeout(handle);
    handle = setTimeout(() => { handle = null; render(); }, delayMs);
  };
}
