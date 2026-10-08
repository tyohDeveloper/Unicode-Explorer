/**
 * VIEW: "CSS for this selection" (PLAN Q-13). Writes CSS another programmer can
 * paste into their own app for similar coverage: a web-font form built from
 * pinned public URLs in data/web-fonts.json (device-independent, measured from
 * cmaps), and a no-download form naming fonts this device has (device-specific).
 * Text only: nothing is fetched.
 */
import webFonts from "../data/web-fonts.json";
import { codePointToString } from "./codepoint/codePointToString.js";
import type { GlyphProbe } from "./fonts/glyphProbe.js";
import { makeElement } from "./makeElement.js";
import { runInIdleSlices } from "./render/idleSlices.js";
import type { CodePointItem } from "./selection/collectCodePoints.js";
import type { Settings } from "./state/settings.js";
import { isNonVisible } from "./ucd/isNonVisible.js";
import { blockOf } from "./ucd/blockOf.js";
import { listBlocks } from "./ucd/listBlocks.js";
import { blockSpansFor } from "./webfonts/blockSpansFor.js";
import { chooseWebFonts } from "./webfonts/chooseWebFonts.js";
import { deviceFontCss } from "./webfonts/deviceFontCss.js";
import { loadWebFontRanges } from "./webfonts/loadWebFontRanges.js";
import { webFontCss, type WebFontFace } from "./webfonts/webFontCss.js";
import { copyText } from "./clipboard/copyText.js";
import { flashLabel } from "./flashLabel.js";

export interface CssDialogSource { items(): readonly CodePointItem[]; settings(): Settings; probe: GlyphProbe }

interface Parts { dialog: HTMLDialogElement; web: HTMLTextAreaElement; device: HTMLTextAreaElement; serif: HTMLInputElement; summary: HTMLElement }

const appVersion = () => document.querySelector("[data-testid=text-header-version]")?.textContent?.replace(/^v/, "") ?? "";

function selection(src: CssDialogSource): { cps: number[]; blocks: { name: string; start: number; end: number }[] } {
  const cps = src.items().filter((i) => !i.reserved && !isNonVisible(i.cp)).map((i) => i.cp);
  const selected = new Set(src.settings().blocks);
  return { cps, blocks: listBlocks().filter((b) => selected.has(b.start)) };
}

async function fillWeb(parts: Parts, src: CssDialogSource): Promise<void> {
  const { cps, blocks } = selection(src);
  const ranges = await loadWebFontRanges();
  const serif = parts.serif.checked;
  const regularBytes = Object.fromEntries(webFonts.fonts.filter((f) => f.face === "Regular").map((f) => [f.family, f.bytes]));
  const choice = chooseWebFonts(serif ? webFonts.order.serif : webFonts.order.sans, ranges, cps, regularBytes);
  const spans = Object.fromEntries(choice.chosen.map((c) => [c.family, blockSpansFor(ranges[c.family], blocks, cps)]));
  parts.web.value = webFontCss({ app: appVersion(), blocks: blocks.map((b) => b.name), choice, faces: webFonts.fonts as WebFontFace[], spans, generic: serif ? "serif" : "sans-serif" });
  parts.summary.textContent = `Web fonts: ${choice.covered.toLocaleString("en-US")} of ${choice.total.toLocaleString("en-US")} visible characters with ${choice.chosen.length} famil${choice.chosen.length === 1 ? "y" : "ies"}.`;
}

function deviceFamilies(src: CssDialogSource, blocks: readonly { start: number }[]): Map<number, readonly string[]> {
  const byBlock = new Map<number, readonly string[]>();
  for (const b of blocks) byBlock.set(b.start, src.probe.servingFamilies(b.start).filter((f) => !f.startsWith("UE ")));
  return byBlock;
}

function fillDevice(parts: Parts, src: CssDialogSource): () => void {
  const { cps, blocks } = selection(src);
  const byBlock = deviceFamilies(src, blocks);
  const families = [...new Set([...byBlock.values()].flat())];
  const generic = parts.serif.checked ? "serif" : "sans-serif";
  const write = (verified: number, done: boolean) => { parts.device.value = deviceFontCss({ app: appVersion(), families, verified, total: cps.length, done, generic }); };
  let index = 0, verified = 0;
  write(0, false);
  return runInIdleSlices(() => {
    for (let n = 0; n < 32 && index < cps.length; n++, index++) {
      const fams = byBlock.get(blockOf(cps[index])?.start ?? -1) ?? [];
      if (src.probe.rendersWith(fams, codePointToString(cps[index]))) verified++;
    }
    if (index < cps.length) return true;
    write(verified, true);
    return false;
  });
}

function textBlock(id: string, label: string, testid: string): { area: HTMLTextAreaElement; section: HTMLElement } {
  const area = makeElement("textarea", { id, readonly: "readonly", rows: "12", spellcheck: "false", class: "css-out", "data-testid": `text-css-${testid}` });
  const copy = makeElement("button", { type: "button", class: "btn-sm", "data-testid": `button-css-copy-${testid}`, text: "Copy" });
  copy.addEventListener("click", async () => { if (await copyText(area.value)) flashLabel(copy, "Copied!"); });
  return { area, section: makeElement("section", {}, [makeElement("div", { class: "css-head" }, [makeElement("label", { for: id, text: label }), copy]), area]) };
}

function buildDialog(): Parts {
  const dialog = document.getElementById("css-dialog") as HTMLDialogElement;
  const web = textBlock("css-web", "Web fonts (same result on any device)", "web");
  const device = textBlock("css-device", "No downloads (fonts on this device only)", "device");
  const serif = makeElement("input", { type: "radio", name: "css-order", value: "serif", id: "css-serif", "data-testid": "radio-css-serif" });
  const sans = makeElement("input", { type: "radio", name: "css-order", value: "sans", id: "css-sans", "data-testid": "radio-css-sans" });
  const summary = makeElement("p", { class: "css-summary", "data-testid": "text-css-summary" });
  const order = makeElement("div", { class: "css-order" }, [makeElement("span", { text: "Priority:" }), makeElement("label", {}, [serif, " Serif"]), makeElement("label", {}, [sans, " Sans"])]);
  dialog.querySelector("#css-body")?.append(order, summary, web.section, device.section);
  return { dialog, web: web.area, device: device.area, serif, summary };
}

export function wireCssDialog(button: HTMLElement, src: CssDialogSource): void {
  const parts = buildDialog();
  let cancel = () => undefined as void;
  const refresh = () => { cancel(); void fillWeb(parts, src); cancel = fillDevice(parts, src); };
  for (const radio of parts.dialog.querySelectorAll<HTMLInputElement>("input[name=css-order]")) radio.addEventListener("change", refresh);
  button.addEventListener("click", () => {
    parts.serif.checked = src.settings().font !== "sans-serif";
    (parts.dialog.querySelector("#css-sans") as HTMLInputElement).checked = !parts.serif.checked;
    parts.dialog.showModal();
    refresh();
  });
  parts.dialog.querySelector("#css-close")?.addEventListener("click", () => { cancel(); parts.dialog.close(); });
}
