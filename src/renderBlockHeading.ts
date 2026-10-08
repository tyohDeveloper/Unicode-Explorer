/** VIEW: the "BLOCK NAME (U+XXXX – U+YYYY) · n/m verified" separator used by grid modes. */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { makeElement } from "./makeElement.js";
import type { Block } from "./ucd/listBlocks.js";

export interface BlockCoverage { verified: number; unverified: number }

export function blockHeadingText(block: Block): string {
  return `${block.name}  (${formatCodePoint(block.start)} \u2013 ${formatCodePoint(block.end)})`;
}

export function coverageNote(coverage: BlockCoverage | undefined): string {
  if (!coverage || coverage.verified + coverage.unverified === 0) return "";
  const total = coverage.verified + coverage.unverified;
  return coverage.unverified === 0 ? `${total} verified` : `${coverage.verified}/${total} verified`;
}

/** Update a heading's coverage span; the background scan calls this as it progresses. */
export function setCoverageNote(span: HTMLElement, coverage: BlockCoverage | undefined): void {
  const note = coverageNote(coverage);
  span.textContent = note ? ` \u00B7 ${note}` : "";
  span.classList.toggle("has-unverified", !!coverage && coverage.unverified > 0);
}

export function coverageSpan(): HTMLSpanElement {
  return makeElement("span", { class: "block-coverage", title: "Characters a listed font renders on this device; unverified ones may still appear through system fallback" });
}

export function makeBlockHeading(block: Block, spans: Map<string, HTMLElement>): HTMLElement {
  const span = coverageSpan();
  spans.set(block.name, span);
  return makeElement("h2", { class: "block-sep-heading", text: blockHeadingText(block) }, [span]);
}
