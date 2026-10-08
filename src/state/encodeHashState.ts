import { formatHex } from "../codepoint/formatHex.js";
import type { Settings } from "./settings.js";
import { initialSettings } from "./settings.js";

/**
 * URL fragment for bookmarkable state (ARCHITECTURE §3). Only values that
 * differ from the defaults are written; blocks are their start code points in hex.
 * Example: #b=0000,0370&m=table&f=serif&s=24&nv=1&q=snow&p=1&l=ja
 */
export function encodeHashState(s: Settings): string {
  const parts: string[] = [];
  if (s.blocks.length) parts.push(`b=${s.blocks.map(formatHex).join(",")}`);
  if (s.mode !== initialSettings.mode) parts.push(`m=${s.mode}`);
  if (s.font !== initialSettings.font) parts.push(`f=${encodeURIComponent(s.font)}`);
  if (s.size !== initialSettings.size) parts.push(`s=${s.size}`);
  if (s.nonVisible) parts.push("nv=1");
  if (s.nameFilter) parts.push(`q=${encodeURIComponent(s.nameFilter)}`);
  if (s.placeholders) parts.push("p=1");
  if (s.lang) parts.push(`l=${encodeURIComponent(s.lang)}`);
  if (s.presentation) parts.push(`e=${s.presentation}`);
  if (s.bold) parts.push("bold=1");
  if (s.italic) parts.push("italic=1");
  if (s.noSynthesis) parts.push("nosynth=1");
  return parts.join("&");
}
