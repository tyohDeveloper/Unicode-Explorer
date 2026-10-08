/**
 * Text of the sidecar scripts (ADR-0001). Classic scripts, so they load from
 * file:// as siblings of Unicode.html. A pack publishes its fonts under
 * window.UnicodeExplorerFontPackData[id]; the manifest publishes the catalogue
 * under window.UnicodeExplorerFontPacks. Both are plain data: no code runs.
 */
export interface PackFontPayload { family: string; format: "woff2" | "woff"; bytes: Uint8Array }

export interface PackCatalogueEntry {
  id: string;
  label: string;
  file: string;
  bytes: number;
  families: string[];
  blocks: string[];
  fonts: { family: string; version: string; license: string; license_url: string }[];
}

export interface PackCatalogue { schema: string; app: string; unicode: string; edition: string; packs: PackCatalogueEntry[] }

export function packScript(id: string, fonts: readonly PackFontPayload[]): string {
  const payload = fonts.map((f) => ({ family: f.family, format: f.format, data: Buffer.from(f.bytes).toString("base64") }));
  return `window.UnicodeExplorerFontPackData=window.UnicodeExplorerFontPackData||{};window.UnicodeExplorerFontPackData[${JSON.stringify(id)}]=${JSON.stringify({ id, fonts: payload })};\n`;
}

export function packsManifestScript(catalogue: PackCatalogue): string {
  return `window.UnicodeExplorerFontPacks=${JSON.stringify(catalogue)};\n`;
}
