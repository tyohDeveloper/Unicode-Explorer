/** VIEW: Plain mode — a selectable text flow of the assigned characters, space-separated. */
import { codePointToString } from "./codepoint/codePointToString.js";
import { makeElement } from "./makeElement.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";

export function plainText(items: readonly CodePointItem[]): string {
  return items.filter((i) => !i.reserved).map((i) => codePointToString(i.cp)).join(" ");
}

export function renderPlain(output: HTMLElement, items: readonly CodePointItem[]): void {
  output.append(makeElement("div", { id: "plain-text-out", "data-testid": "text-output-plain", text: plainText(items) }));
}
