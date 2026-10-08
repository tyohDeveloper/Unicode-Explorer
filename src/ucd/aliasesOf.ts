import aliases from "../data/aliases.json";
import { formatHex } from "../codepoint/formatHex.js";

const map = aliases.map as Record<string, string[]>;
const none: readonly string[] = [];

/** Formal name aliases of a code point (NameAliases.txt, all types). */
export function aliasesOf(cp: number): readonly string[] {
  return map[formatHex(cp)] ?? none;
}
