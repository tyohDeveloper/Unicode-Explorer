/**
 * VIEW: the About dialog — what this artifact embeds (fonts, versions, licenses)
 * and which sidecar font packs are present. Static version lines are stamped
 * into index.html at build time; this module fills the dynamic parts.
 */
import unifontOfl from "../fonts/standard/licenses/Unifont-OFL-1.1.txt?raw";
import lastResortOfl from "../fonts/standard/licenses/LastResort-LICENSE.txt?raw";
import adobeBlankOfl from "../fonts/standard/licenses/AdobeBlank2-LICENSE.txt?raw";
import fairfaxOfl from "../fonts/standard/licenses/FairfaxHD-OFL-1.1.txt?raw";
import charisOfl from "../fonts/standard/licenses/Charis-OFL-1.1.txt?raw";
import type { FontPackLoader } from "./fonts/fontPacks.js";
import { standardFonts, type StandardFont } from "./fonts/standardFonts.js";
import { makeElement } from "./makeElement.js";

const LICENSE_TEXTS: Record<string, string> = { unifont: unifontOfl, unifont_upper: unifontOfl, "last-resort": lastResortOfl, "adobe-blank-2": adobeBlankOfl, "fairfax-hd-latin-ext-g": fairfaxOfl, "charis-latin": charisOfl };
const ROLE_NOTE: Record<string, string> = { coverage: "glyph coverage", placeholder: "placeholder for unverified glyphs", detection: "glyph detection only (never displayed)" };

function fontRow(font: StandardFont): HTMLTableRowElement {
  return makeElement("tr", {}, [
    makeElement("td", { text: font.family }),
    makeElement("td", { text: font.version }),
    makeElement("td", {}, [makeElement("a", { href: font.license_url, target: "_blank", rel: "noopener", text: font.license })]),
    makeElement("td", { text: ROLE_NOTE[font.role] ?? font.role }),
    makeElement("td", { class: "num", text: font.role === "coverage" ? (font.assigned_visible_cmap_count ?? 0).toLocaleString("en-US") : "" }),
  ]);
}

function fontsTable(): HTMLTableElement {
  const head = makeElement("thead", {}, [makeElement("tr", {}, ["Font", "Version", "License", "Role", "Visible glyphs"].map((t) => makeElement("th", { text: t })))]);
  return makeElement("table", { class: "about-table", "data-testid": "table-about-fonts" }, [head, makeElement("tbody", {}, standardFonts().all.map(fontRow))]);
}

function packsList(packs: FontPackLoader): HTMLElement {
  const catalogue = packs.catalogue();
  if (!catalogue) return makeElement("p", { "data-testid": "text-about-packs", text: "No font packs found next to this file. The Complete edition adds packs for CJK Extensions B\u2013J, Tangut, Cuneiform, Anatolian Hieroglyphs and Bamum; they load only when one of their blocks is selected." });
  const states = new Map(packs.statuses().map((s) => [s.id, s.state]));
  return makeElement("ul", { "data-testid": "text-about-packs" }, catalogue.map((pack) => makeElement("li", { text: `${pack.label} \u2014 ${(pack.bytes / 1048576).toFixed(1)} MB \u00B7 ${states.get(pack.id) ?? "not needed yet"}` })));
}

function licenses(): HTMLElement {
  const seen = new Set<string>();
  const items = standardFonts().all.filter((f) => { const key = LICENSE_TEXTS[f.id]; if (!key || seen.has(key)) return false; seen.add(key); return true; });
  return makeElement("div", {}, items.map((f) => makeElement("details", {}, [makeElement("summary", { text: `${f.family.replace(/ Upper$/, "")} \u2014 ${f.license}` }), makeElement("pre", { class: "license-text", text: LICENSE_TEXTS[f.id] })])));
}

function fill(dialog: HTMLDialogElement, packs: FontPackLoader): void {
  const body = dialog.querySelector<HTMLElement>("#about-dynamic");
  if (!body) return;
  const standard = standardFonts();
  const share = standard.of ? ((standard.guaranteed / standard.of) * 100).toFixed(1) : "0";
  body.replaceChildren(
    makeElement("p", { text: `Embedded fonts guarantee a glyph for ${standard.guaranteed.toLocaleString("en-US")} of ${standard.of.toLocaleString("en-US")} visible assigned characters (${share}%). Device fonts and font packs add to that; the status bar reports what this device verifies.` }),
    fontsTable(),
    makeElement("h3", { text: "Font packs" }), packsList(packs),
    makeElement("h3", { text: "Font licenses" }), licenses(),
  );
}

export function wireAbout(button: HTMLElement, dialog: HTMLDialogElement, packs: FontPackLoader): void {
  button.addEventListener("click", () => { fill(dialog, packs); dialog.showModal(); });
  dialog.querySelector("#about-close")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
}
