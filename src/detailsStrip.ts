/**
 * VIEW: character details strip (PLAN.md D-19, finding DAT-05). Follows
 * keyboard focus and mouse hover in the output; clicking still inserts. The
 * property table is decoded on first use. A polite live region announces the
 * focused character only (hover does not chatter).
 */
import { codePointToString } from "./codepoint/codePointToString.js";
import { formatCodePoint } from "./codepoint/formatCodePoint.js";
import { makeElement } from "./makeElement.js";
import { describeCharacter, type DescribeInput } from "./properties/describeCharacter.js";
import { loadProperties } from "./properties/loadProperties.js";
import { aliasesOf } from "./ucd/aliasesOf.js";
import { blockOf } from "./ucd/blockOf.js";

export interface DetailsSource { nameOf(cp: number): string; drawnBy?(cp: number, text: string): DescribeInput["drawnBy"] }

function cellOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>("[data-cp]") : null;
}

function renderedState(cell: HTMLElement): boolean | null {
  if (cell.classList.contains("cell-hidden") || cell.tagName === "TR") return null;
  return !cell.classList.contains("unverified");
}

async function show(strip: HTMLElement, cell: HTMLElement, src: DetailsSource, announce: boolean): Promise<void> {
  const cp = parseInt(cell.dataset.cp ?? "", 16);
  const props = await loadProperties();
  if (strip.dataset.shown === cell.dataset.cp) return;
  const rendered = renderedState(cell);
  const drawnBy = rendered ? src.drawnBy?.(cp, codePointToString(cp)) ?? null : null;
  const fields = describeCharacter({ cp, props, nameOf: src.nameOf, aliases: aliasesOf(cp), block: blockOf(cp)?.name ?? null, rendered, drawnBy });
  const glyph = makeElement("span", { class: "details-glyph", "aria-hidden": "true", text: cell.querySelector(".glyph")?.textContent ?? codePointToString(cp) });
  const list = makeElement("dl", { class: "details-list" }, fields.flatMap(([k, v]) => [makeElement("dt", { text: k }), makeElement("dd", { text: v, "data-testid": `text-details-${k.toLowerCase()}` })]));
  strip.dataset.shown = cell.dataset.cp ?? "";
  strip.setAttribute("aria-live", announce ? "polite" : "off");
  strip.replaceChildren(glyph, makeElement("span", { class: "details-cp", "data-testid": "text-details-cp", text: formatCodePoint(cp) }), list);
}

export function wireDetailsStrip(output: HTMLElement, strip: HTMLElement, src: DetailsSource): void {
  output.addEventListener("focusin", (e) => { const cell = cellOf(e.target); if (cell) void show(strip, cell, src, true); });
  output.addEventListener("pointerover", (e) => { const cell = cellOf(e.target); if (cell) void show(strip, cell, src, false); });
}
