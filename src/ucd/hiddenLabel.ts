import abbreviations from "../data/abbreviations.json";
import labels from "../../data/category-labels.json";
import { formatHex } from "../codepoint/formatHex.js";
import { hiddenKind } from "./hiddenKind.js";

const byHex = abbreviations.map as Record<string, string>;
const byKind = labels.hidden_kind_labels as Record<string, string>;

/**
 * Short label drawn in place of a non-visible character: its Unicode
 * abbreviation (SHY, ZWJ, VS16) when one exists, else a label for its kind
 * (CTRL, FMT, PUA…). Null for visible characters.
 */
export function hiddenLabel(cp: number): string | null {
  const kind = hiddenKind(cp);
  if (!kind) return null;
  return byHex[formatHex(cp)] ?? byKind[kind] ?? kind.toUpperCase();
}
