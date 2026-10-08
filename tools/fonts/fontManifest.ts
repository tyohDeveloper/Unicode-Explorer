/** Types and reader for fonts/manifest.json (the font source of truth; schema unicode-explorer-font-manifest/1). */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export interface FontSource { url: string; format: string; member?: string; sha256: string | null; bytes: number | null; note?: string }

export interface FontEntry {
  id: string;
  family: string;
  css_family: string;
  version: string;
  license: string;
  license_url: string;
  source: FontSource;
  vendored?: string;
  woff2_sha256?: string;
  woff2_bytes?: number;
  cmap_code_points?: number;
  assigned_visible_cmap_count?: number;
  role: "coverage" | "placeholder" | "detection";
}

export interface PackEntry { id: string; label: string; fonts: string[]; categories: string[]; license_files: string[]; blocks: string[]; editions: string[]; bytes?: number }

export interface Edition { id: string; default: boolean; fonts: string[]; packs?: string[]; guaranteed_visible_code_points?: number; of?: number; embedded_font_bytes?: number; delivery: string }

export interface FontManifest {
  schema: string;
  generated: string;
  unicode_reference: string;
  editions: Edition[];
  packs: PackEntry[];
  fonts: FontEntry[];
  candidates: FontEntry[];
  [key: string]: unknown;
}

export function readFontManifest(repoRoot: string): FontManifest {
  return JSON.parse(readFileSync(resolve(repoRoot, "fonts/manifest.json"), "utf-8")) as FontManifest;
}

export function writeFontManifest(repoRoot: string, manifest: FontManifest): void {
  writeFileSync(resolve(repoRoot, "fonts/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}

export function fontById(manifest: FontManifest, id: string): FontEntry {
  const font = manifest.fonts.find((f) => f.id === id);
  if (!font) throw new Error(`fonts/manifest.json: no font with id ${id}`);
  return font;
}
