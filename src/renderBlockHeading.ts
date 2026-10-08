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

export function makeBlockHeading(block: Block, coverage?: BlockCoverage): HTMLSpanElement {
  const note = coverageNote(coverage);
  const heading = makeElement("span", { class: "block-sep-heading", text: blockHeadingText(block) });
  if (note) heading.append(makeElement("span", { class: coverage!.unverified ? "block-coverage has-unverified" : "block-coverage", text: ` \u00B7 ${note}`, title: "Characters a listed font renders on this device; unverified ones may still appear through system fallback" }));
  return heading;
}
