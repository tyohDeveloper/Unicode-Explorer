/** VIEW: "Copy output" — the visible characters of the current render, space-separated. */
import { copyText } from "./clipboard/copyText.js";
import { flashLabel } from "./flashLabel.js";
import type { DisplayMode } from "./state/settings.js";

const SELECTORS: Record<DisplayMode, string> = {
  grid: "#output .gc:not(.cell-reserved)",
  "grid-cp": "#output .gcc .glyph",
  "grid-name": "#output .gcn .glyph",
  table: "#output td.td-ch.clickable",
  plain: "#plain-text-out",
};

export function outputText(output: HTMLElement, mode: DisplayMode): string {
  if (mode === "plain") return output.querySelector(SELECTORS.plain)?.textContent?.trim() ?? "";
  return [...output.querySelectorAll(SELECTORS[mode])].map((el) => el.textContent?.trim() ?? "").filter(Boolean).join(" ");
}

export function wireCopyOutput(button: HTMLButtonElement, output: HTMLElement, status: HTMLElement, getMode: () => DisplayMode): void {
  button.addEventListener("click", async () => {
    const text = outputText(output, getMode());
    if (!text) { status.textContent = "Nothing to copy \u2014 select some blocks first."; return; }
    if (await copyText(text)) flashLabel(button, "Copied!");
  });
}
