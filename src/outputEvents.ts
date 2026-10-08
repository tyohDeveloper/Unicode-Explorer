/**
 * VIEW: one delegated click and keyboard handler for every cell and row in
 * the output (PRF-01, ACC-02). Cells are tabindex=-1; the output region is the
 * single tab stop and forwards focus to the first cell. Arrows move, Home/End
 * jump within a block, Enter or Space inserts. Inserting never moves focus to
 * the composition pad (UX-01).
 */
import { codePointToString } from "./codepoint/codePointToString.js";
import type { LazyMaterializer } from "./render/lazyMaterializer.js";

const CELL = "[data-cp]";

function cellOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(CELL) : null;
}

function insertCell(cell: HTMLElement, insert: (text: string) => void): void {
  insert(codePointToString(parseInt(cell.dataset.cp ?? "", 16)));
}

type LazyGetter = () => LazyMaterializer | null;

/** Swap a pending placeholder for its cells; returns the element now at its position (or the placeholder if it could not be built). */
function resolvePending(node: Element, forward: boolean, lazy: LazyGetter): Element | null {
  const parent = node.parentElement;
  const anchor = forward ? node.previousElementSibling : node.nextElementSibling;
  if (!lazy()?.materializeNow(node) || !parent) return node;
  if (forward) return anchor ? anchor.nextElementSibling : parent.firstElementChild;
  return anchor ? anchor.previousElementSibling : parent.lastElementChild;
}

function settle(node: Element | null, forward: boolean, lazy: LazyGetter): Element | null {
  while (node?.classList.contains("chunk-pending")) {
    const next = resolvePending(node, forward, lazy);
    if (next === node) return node;
    node = next;
  }
  return node;
}

function descend(node: Element, forward: boolean, lazy: LazyGetter): HTMLElement | null {
  if (node.matches(CELL)) return node as HTMLElement;
  const child = settle(forward ? node.firstElementChild : node.lastElementChild, forward, lazy);
  if (child?.matches(CELL)) return child as HTMLElement;
  return (forward ? node.querySelector<HTMLElement>(CELL) : lastIn(node)) as HTMLElement | null;
}

/** Next/previous cell in document order, materialising pending chunks on the way. */
function stepCell(cell: HTMLElement, forward: boolean, lazy: LazyGetter): HTMLElement | null {
  let node: Element | null = cell;
  for (let guard = 0; guard < 4096 && node; guard++) {
    node = settle(forward ? (node.nextElementSibling ?? climb(node, forward)) : (node.previousElementSibling ?? climb(node, forward)), forward, lazy);
    if (!node || node.classList.contains("chunk-pending")) continue;
    const found = descend(node, forward, lazy);
    if (found) return found;
  }
  return null;
}

function climb(node: Element, forward: boolean): Element | null {
  let parent = node.parentElement;
  while (parent && parent.id !== "output") {
    const sibling = forward ? parent.nextElementSibling : parent.previousElementSibling;
    if (sibling) return sibling;
    parent = parent.parentElement;
  }
  return null;
}

function lastIn(node: Element): HTMLElement | null {
  const all = node.querySelectorAll<HTMLElement>(CELL);
  return all.length ? all[all.length - 1] : null;
}

/** Cell in the adjacent visual row nearest the current x (grids); rows step by one in tables. */
function verticalCell(cell: HTMLElement, down: boolean, lazy: LazyGetter): HTMLElement | null {
  if (cell.tagName === "TR") return stepCell(cell, down, lazy);
  const top = cell.offsetTop;
  const left = cell.getBoundingClientRect().left;
  let best: HTMLElement | null = null;
  let rowTop: number | null = null;
  for (let next = stepCell(cell, down, lazy), n = 0; next && n < 600; next = stepCell(next, down, lazy), n++) {
    const t = next.offsetTop;
    if (rowTop === null) { if (t === top && next.parentElement === cell.parentElement) continue; rowTop = t; }
    if (t !== rowTop) break;
    if (!best || Math.abs(next.getBoundingClientRect().left - left) < Math.abs(best.getBoundingClientRect().left - left)) best = next;
  }
  return best;
}

/** First or last cell of the current block, materialising the edge chunk if it is still pending. */
function edgeCell(cell: HTMLElement, last: boolean, lazy: LazyGetter): HTMLElement | null {
  const group = cell.closest(".char-grid, .char-grid-cp, .char-grid-name, table");
  return group ? descend(group, !last, lazy) : null;
}

function target(cell: HTMLElement, key: string, lazy: LazyGetter): HTMLElement | null {
  if (key === "ArrowRight") return stepCell(cell, true, lazy);
  if (key === "ArrowLeft") return stepCell(cell, false, lazy);
  if (key === "ArrowDown") return verticalCell(cell, true, lazy);
  if (key === "ArrowUp") return verticalCell(cell, false, lazy);
  if (key === "Home") return edgeCell(cell, false, lazy);
  if (key === "End") return edgeCell(cell, true, lazy);
  return null;
}

function onKey(ev: KeyboardEvent, insert: (text: string) => void, lazy: LazyGetter): void {
  const cell = cellOf(ev.target);
  if (!cell) return;
  if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); insertCell(cell, insert); return; }
  const next = target(cell, ev.key, lazy);
  if (!next) return;
  ev.preventDefault();
  next.focus();
}

/** "Skip to characters": the first tab stop, so keyboard users need not walk the 346-block sidebar. */
export function wireSkipButton(button: HTMLElement, output: HTMLElement): void {
  button.addEventListener("click", () => (output.querySelector<HTMLElement>(CELL) ?? output).focus());
}

export function wireOutputEvents(output: HTMLElement, insert: (text: string) => void, lazy: LazyGetter): void {
  output.addEventListener("click", (ev) => { const cell = cellOf(ev.target); if (cell) insertCell(cell, insert); });
  output.addEventListener("keydown", (ev) => onKey(ev, insert, lazy));
  output.addEventListener("focus", (ev) => {
    if (ev.target !== output || (ev.relatedTarget instanceof Node && output.contains(ev.relatedTarget))) return;
    output.querySelector<HTMLElement>(CELL)?.focus();
  });
}
