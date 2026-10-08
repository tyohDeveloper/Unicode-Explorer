/** VIEW: Grid+Name mode — glyph, code point, and name per cell. */
import { codePointToString } from "./codepoint/codePointToString.js";
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { formatHex } from "./codepoint/formatHex.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import { groupByBlock } from "./selection/groupByBlock.js";
import type { Block } from "./ucd/listBlocks.js";
import { makeBlockHeading } from "./renderBlockHeading.js";
import type { GridContext } from "./renderGrid.js";

function reservedCell(item: CodePointItem): HTMLDivElement {
  const cp = formatCodePoint(item.cp);
  return makeElement("div", { class: "gcn cell-reserved", title: `${cp}  (reserved / unassigned)` }, [
    makeElement("span", { class: "cp", text: cp }),
    makeElement("span", { class: "cname", text: "(reserved)" }),
  ]);
}

function namedCell(item: CodePointItem, ctx: GridContext): HTMLDivElement {
  const ch = codePointToString(item.cp);
  const name = ctx.nameOf(item.cp);
  const cell = makeElement("div", { class: "gcn", title: `${formatCodePoint(item.cp)}  ${name} \u2014 click to insert`, "data-testid": `button-grid-cell-${formatHex(item.cp)}`, "data-cp": formatHex(item.cp) }, [
    makeElement("span", { class: "glyph", text: ch }),
    makeElement("span", { class: "cp", text: formatCodePoint(item.cp) }),
    makeElement("span", { class: "cname", text: name }),
  ]);
  cell.addEventListener("click", () => ctx.insert(ch));
  return cell;
}

export function renderGridName(output: HTMLElement, blocks: readonly Block[], items: readonly CodePointItem[], ctx: GridContext): void {
  const byBlock = groupByBlock(items);
  for (const block of blocks) {
    const list = byBlock.get(block.name);
    if (!list?.length) continue;
    output.append(makeBlockHeading(block));
    const grid = makeElement("div", { class: "char-grid-name" });
    for (const item of list) grid.append(item.reserved ? reservedCell(item) : namedCell(item, ctx));
    output.append(grid);
  }
}
