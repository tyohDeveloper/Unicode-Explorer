/**
 * CONTROLLER: sidecar font packs (ADR-0001). The catalogue script
 * unicode-fonts/manifest.js and each pack script are classic scripts injected
 * as siblings of the document, so they load from file:// as well as http(s).
 * A missing file fires `error` and the pack is marked unavailable; nothing
 * else changes. Loaded fonts are registered through the FontFace API.
 */
import type { PackCatalogueEntry } from "./packsForBlocks.js";
import { packsForBlocks } from "./packsForBlocks.js";
import { packsForStyle } from "./packsForStyle.js";
import type { PackStatus } from "./packStatusText.js";

interface PackFont { family: string; format: string; data: string; weight?: number; style?: string; range?: string }
interface Catalogue { packs: PackCatalogueEntry[] }
declare global { interface Window { UnicodeExplorerFontPacks?: Catalogue; UnicodeExplorerFontPackData?: Record<string, { fonts: PackFont[] }> } }

export interface FontPackLoader {
  /** Resolves once the catalogue has loaded or been found absent. */
  ready: Promise<void>;
  catalogue(): PackCatalogueEntry[] | null;
  ensureForBlocks(selected: readonly number[]): void;
  /** Load the style packs for a font button; `styled` adds the bold/italic faces (Q-11). */
  ensureForStyle(fontId: string, styled: boolean): void;
  families(): string[];
  /** Families of loaded style packs for a font button id ("serif", "sans-serif"), in stack order (D-14). */
  styleFamilies(fontId: string): string[];
  statuses(): PackStatus[];
}

function injectScript(file: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = new URL(`unicode-fonts/${file}`, location.href).href;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error(`${file} did not load`)), { once: true });
    document.head.append(script);
  });
}

function loadedFamilies(packs: PackCatalogueEntry[] | null, states: Map<string, PackStatus["state"]>, keep: (p: PackCatalogueEntry) => boolean): string[] {
  return [...new Set((packs ?? []).filter((p) => states.get(p.id) === "loaded" && keep(p)).flatMap((p) => p.families))];
}

const blockFamilies = (packs: PackCatalogueEntry[] | null, states: Map<string, PackStatus["state"]>) => loadedFamilies(packs, states, (p) => p.kind !== "style");
const styleFamilies = (packs: PackCatalogueEntry[] | null, states: Map<string, PackStatus["state"]>, fontId: string) => loadedFamilies(packs, states, (p) => p.kind === "style" && (p.styles ?? []).includes(fontId));

function base64ToBuffer(data: string): ArrayBuffer {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function registerPack(id: string): Promise<string[]> {
  const payload = window.UnicodeExplorerFontPackData?.[id];
  if (!payload) throw new Error(`${id}: no pack data`);
  const faces = payload.fonts.map((f) => new FontFace(f.family, base64ToBuffer(f.data), { ...(f.weight ? { weight: String(f.weight), style: f.style ?? "normal" } : {}), ...(f.range ? { unicodeRange: f.range } : {}) }));
  delete window.UnicodeExplorerFontPackData?.[id];
  for (const face of faces) document.fonts.add(face);
  await Promise.all(faces.map((face) => face.load()));
  return faces.map((face) => face.family);
}

export function createFontPackLoader(onChange: () => void): FontPackLoader {
  let packs: PackCatalogueEntry[] | null = null;
  const states = new Map<string, PackStatus["state"]>();
  const ready = injectScript("manifest.js").then(() => { packs = window.UnicodeExplorerFontPacks?.packs ?? null; }, () => { packs = null; });
  const load = async (pack: PackCatalogueEntry) => {
    states.set(pack.id, "loading");
    onChange();
    try { await registerPack(await injectScript(pack.file).then(() => pack.id)); states.set(pack.id, "loaded"); }
    catch { states.set(pack.id, "failed"); }
    onChange();
  };
  return {
    ready,
    catalogue: () => packs,
    ensureForBlocks: (selected) => { for (const pack of packsForBlocks(packs ?? [], selected)) if (!states.has(pack.id)) void load(pack); },
    ensureForStyle: (fontId, styled) => { for (const pack of packsForStyle(packs ?? [], fontId, styled)) if (!states.has(pack.id)) void load(pack); },
    families: () => blockFamilies(packs, states),
    styleFamilies: (fontId) => styleFamilies(packs, states, fontId),
    statuses: () => (packs ?? []).filter((p) => states.has(p.id)).map((p) => ({ id: p.id, label: p.label, state: states.get(p.id)!, bytes: p.bytes })),
  };
}
