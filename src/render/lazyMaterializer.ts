/**
 * CONTROLLER: materialise placeholder elements when they come within a margin
 * of the scroll viewport (PRF-01). Each placeholder is built once; the
 * keyboard handler can force one early with materializeNow(). disconnect()
 * drops all pending work when the output is re-rendered.
 */
export interface LazyMaterializer {
  observe(placeholder: Element, build: () => void): void;
  materializeNow(placeholder: Element): boolean;
  disconnect(): void;
}

export function createLazyMaterializer(root: Element | null, margin = "1500px 0px"): LazyMaterializer {
  const pending = new Map<Element, () => void>();
  const run = (el: Element): boolean => {
    const build = pending.get(el);
    if (!build) return false;
    pending.delete(el);
    observer.unobserve(el);
    build();
    return true;
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) run(entry.target);
  }, { root, rootMargin: margin });
  return {
    observe(placeholder, build) { pending.set(placeholder, build); observer.observe(placeholder); },
    materializeNow: run,
    disconnect() { observer.disconnect(); pending.clear(); },
  };
}
