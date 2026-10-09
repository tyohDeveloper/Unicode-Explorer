import { formatCodePoint } from "../codepoint/formatCodePoint.js";
import type { Properties } from "./decodeProperties.js";
import { hangulDecomposition } from "./hangulDecomposition.js";
import { lookupRun } from "./lookupRun.js";

export interface DescribeInput {
  cp: number;
  props: Properties;
  nameOf(cp: number): string;
  aliases: readonly string[];
  block: string | null;
  rendered: boolean | null;
  /** D-22: the drawing font, when the probe can name it. */
  drawnBy?: { family: string; design: "outline" | "bitmap" | "unknown"; source: "embedded" | "pack" | "installed" } | null;
}

export type DetailField = [label: string, value: string];

function decomposition(i: DescribeInput): string {
  const raw = i.props.decomposition.get(i.cp);
  const hangul = hangulDecomposition(i.cp);
  if (!raw && !hangul) return "none";
  const type = raw?.match(/^<([^>]+)>/)?.[1] ?? "canonical";
  const cps = hangul ?? (raw ?? "").replace(/^<[^>]+>\s*/, "").split(" ").map((h) => parseInt(h, 16));
  return `${type}: ${cps.map((c) => `${formatCodePoint(c)} ${i.nameOf(c)}`).join(" + ")}`;
}

function category(i: DescribeInput): string {
  const k = lookupRun(i.props.gc, i.cp);
  return k < 0 ? "Cn Unassigned" : `${i.props.gc.values[k]} ${i.props.gc.names[k]}`;
}

function glyph(i: DescribeInput): string {
  if (!i.rendered) return "no font found: block placeholder";
  const d = i.drawnBy;
  if (!d) return "drawn by a system fallback font (not identifiable, D-12)";
  const design = d.design === "unknown" ? "" : `${d.design}, `;
  return `${d.family} (${design}${d.source === "installed" ? "installed on this device" : d.source === "pack" ? "font pack" : "embedded"})`;
}

/** Label/value pairs for the details strip (PLAN.md D-19, finding DAT-05). Age is the version that added the character. */
export function describeCharacter(i: DescribeInput): DetailField[] {
  const sc = lookupRun(i.props.sc, i.cp);
  const age = lookupRun(i.props.age, i.cp);
  const fields: DetailField[] = [
    ["Name", i.nameOf(i.cp)],
    ["Block", i.block ?? "none"],
    ["Category", category(i)],
    ["Script", sc < 0 ? "Unknown" : i.props.sc.values[sc]],
    ["Age", age < 0 ? "unassigned" : `Unicode ${i.props.age.values[age]}`],
    ["Decomposition", decomposition(i)],
  ];
  if (i.aliases.length) fields.splice(1, 0, ["Aliases", i.aliases.join(", ")]);
  if (i.rendered !== null) fields.push(["Glyph", glyph(i)]);
  return fields;
}
