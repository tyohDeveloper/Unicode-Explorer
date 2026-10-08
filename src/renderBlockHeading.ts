/** VIEW: the "BLOCK NAME (U+XXXX – U+YYYY)" separator used by grid modes. */
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { makeElement } from "./makeElement.js";
import type { Block } from "./ucd/listBlocks.js";

export function blockHeadingText(block: Block): string {
  return `${block.name}  (${formatCodePoint(block.start)} \u2013 ${formatCodePoint(block.end)})`;
}

export function makeBlockHeading(block: Block): HTMLSpanElement {
  return makeElement("span", { class: "block-sep-heading", text: blockHeadingText(block) });
}
