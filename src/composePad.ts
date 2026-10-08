/**
 * VIEW: the composition pad. Its text lives in the textarea (user content, not
 * domain state). Exposes insert() for the grid and table views.
 */
import { copyText } from "./clipboard/copyText.js";
import { flashLabel } from "./flashLabel.js";

export interface ComposePad { insert(text: string): void }

function setOpen(section: HTMLElement, icon: HTMLElement, open: boolean): void {
  section.classList.toggle("open", open);
  icon.textContent = open ? "\u25BC" : "\u25B6";
}

function insertAtCursor(pad: HTMLTextAreaElement, text: string): void {
  const start = pad.selectionStart ?? pad.value.length;
  const end = pad.selectionEnd ?? pad.value.length;
  pad.value = pad.value.slice(0, start) + text + pad.value.slice(end);
  pad.selectionStart = pad.selectionEnd = start + text.length;
  pad.focus();
}

interface PadElements { section: HTMLElement; header: HTMLElement; icon: HTMLElement; pad: HTMLTextAreaElement; clear: HTMLButtonElement; copy: HTMLButtonElement }

function padElements(root: Document): PadElements {
  const get = <T extends HTMLElement>(id: string) => root.getElementById(id) as T;
  return { section: get("compose-section"), header: get("compose-header"), icon: get("compose-toggle-icon"), pad: get("compose-pad"), clear: get("btn-compose-clear"), copy: get("btn-compose-copy") };
}

function wireButtons(el: PadElements): void {
  el.header.addEventListener("click", (ev) => {
    if ((ev.target as HTMLElement).closest("button")) return;
    setOpen(el.section, el.icon, !el.section.classList.contains("open"));
  });
  el.clear.addEventListener("click", () => { el.pad.value = ""; el.pad.focus(); });
  el.copy.addEventListener("click", async () => {
    if (!el.pad.value) { el.pad.focus(); return; }
    if (await copyText(el.pad.value)) flashLabel(el.copy, "Copied!");
  });
}

export function wireComposePad(root: Document): ComposePad {
  const el = padElements(root);
  wireButtons(el);
  return {
    insert(text) {
      if (!el.section.classList.contains("open")) setOpen(el.section, el.icon, true);
      insertAtCursor(el.pad, text);
    },
  };
}
