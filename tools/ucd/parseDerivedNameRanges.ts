/**
 * Read the `XXXX..YYYY ; PREFIX-*` lines of DerivedName.txt: the code point
 * ranges whose names are a prefix plus the code point (The Unicode Standard
 * §4.8, rule NR2; PLAN.md D-18). Hangul syllables (NR1) are listed by name in
 * the file and handled by data/hangul-jamo.json.
 */
export interface DerivedNameRange { start: string; end: string; prefix: string }

export function parseDerivedNameRanges(text: string): DerivedNameRange[] {
  const ranges: DerivedNameRange[] = [];
  for (const line of text.split("\n")) {
    const m = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*(.+-)\*\s*$/.exec(line.trim());
    if (m) ranges.push({ start: m[1], end: m[2] ?? m[1], prefix: m[3] });
  }
  return ranges;
}
