import { isInSortedRanges } from "../codepoint/isInSortedRanges.js";

export interface SelfHostFont { family: string; key: string; file: string; download: string; format: string; version: string; license: string; license_url: string }
export interface SelfHostInput { uncovered: readonly number[]; fonts: readonly SelfHostFont[]; ranges: Readonly<Record<string, readonly (readonly number[])[]>> }

const hex = (cp: number) => cp.toString(16).toUpperCase().padStart(4, "0");

function unicodeRange(cps: readonly number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < cps.length; i++) {
    let j = i;
    while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
    parts.push(i === j ? `U+${hex(cps[i])}` : `U+${hex(cps[i])}-${hex(cps[j])}`);
    i = j;
  }
  return parts.join(", ");
}

function rule(f: SelfHostFont, cps: readonly number[]): string[] {
  return [
    ` * @font-face {`,
    ` *   font-family: "${f.family}";`,
    ` *   src: url("/fonts/${f.file}") format("${f.format}");`,
    ` *   font-display: swap;`,
    ` *   unicode-range: ${unicodeRange(cps)};`,
    ` * }`,
  ];
}

/**
 * Q-14 option B: characters no public web font covers, as a commented
 * self-host template for fonts that are free to use but have no CORS-enabled
 * host (GNU Unifont 18). Never points at this app's files (D-16). Empty when
 * nothing is left or the self-host fonts do not cover what is left.
 */
export function selfHostCss(i: SelfHostInput): string {
  const taken = new Set<number>();
  const per = i.fonts.map((f) => {
    const cps = i.uncovered.filter((cp) => !taken.has(cp) && isInSortedRanges(cp, i.ranges[f.key] ?? []));
    for (const cp of cps) taken.add(cp);
    return { f, cps };
  }).filter((x) => x.cps.length);
  if (!per.length) return "";
  const total = taken.size;
  return [
    `/* ${i.uncovered.length.toLocaleString("en-US")} selected characters have no public web font. GNU ${per[0].f.family} ${per[0].f.version} covers ${total.toLocaleString("en-US")} of them,`,
    ` * but no public host serves it with CORS, so host it yourself. It is a bitmap-style font: glyphs are drawn as pixel squares.`,
    ` * Licence: ${per[0].f.license} <${per[0].f.license_url}>. Download, put next to your CSS as /fonts/…, and uncomment:`,
    ...per.flatMap(({ f, cps }) => [` *`, ` * Download: ${f.download}`, ...rule(f, cps)]),
    ` *`,
    ` * Then add "${per[0].f.family}" before the generic family in the .unicode-text rule. */`,
    "",
  ].join("\n");
}
