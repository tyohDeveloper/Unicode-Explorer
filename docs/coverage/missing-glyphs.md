# Missing glyphs

Generated 2026-10-09 by `npm run report:gaps` for app 2.2.3.0, data 2.0.3.0, Unicode 18.0.0. Counts are visible assigned characters that no font in the edition maps (character-map measurement). Machine-readable: [missing-glyphs.json](missing-glyphs.json). Re-run after `npm run fetch:fonts` to see what new font releases close; the command prints the change against this snapshot.

| Edition | With a font | Missing | Coverage |
|---|---:|---:|---:|
| standard | 78,224 | 94,158 | 45.4% |
| complete | 154,514 | 17,868 | 89.6% |
| complete-hieroglyphs | 159,580 | 12,802 | 92.6% |
| Public web fonts (CSS dialog) | 157,704 | 14,678 | 91.5% |

## Missing from every edition

No shipped or packed font maps these. Each has a tracking issue.

| Block | Visible | Missing | Added in Unicode | Missing code points | Issue |
|---|---:|---:|---|---|---|
| Archaic Cuneiform Numerals (U+12550) | 311 | 311 | 18.0: 311 | 12550..12686 | [#12](https://github.com/tyohDeveloper/Unicode-Explorer/issues/12) |
| Tangut (U+17000) | 6,144 | 8 | 17.0: 8 | 187F8..187FF | [#13](https://github.com/tyohDeveloper/Unicode-Explorer/issues/13) |
| Tangut Supplement (U+18D00) | 33 | 24 | 17.0: 22, 18.0: 2 | 18D09..18D20 | [#13](https://github.com/tyohDeveloper/Unicode-Explorer/issues/13) |
| Tangut Components Supplement (U+18D80) | 115 | 115 | 17.0: 115 | 18D80..18DF2 | [#13](https://github.com/tyohDeveloper/Unicode-Explorer/issues/13) |
| Jurchen (U+18E00) | 914 | 914 | 18.0: 914 | 18E00..19191 | [#11](https://github.com/tyohDeveloper/Unicode-Explorer/issues/11) |
| Jurchen Radicals (U+191A0) | 51 | 51 | 18.0: 51 | 191A0..191D2 | [#11](https://github.com/tyohDeveloper/Unicode-Explorer/issues/11) |
| Latin Extended-G (U+1DF00) | 188 | 51 | 18.0: 51 | 1DFCD..1DFFF | [#14](https://github.com/tyohDeveloper/Unicode-Explorer/issues/14) |
| Seal (U+3D000) | 11,328 | 11,328 | 18.0: 11,328 | 3D000..3FC3F | [#10](https://github.com/tyohDeveloper/Unicode-Explorer/issues/10) |

## Covered only by the Complete packs

| Block | Visible | Missing in Standard | Missing in Complete |
|---|---:|---:|---:|
| Cuneiform | 922 | 922 | 0 |
| Cuneiform Numbers and Punctuation | 128 | 116 | 0 |
| Early Dynastic Cuneiform | 196 | 196 | 0 |
| Egyptian Hieroglyphs | 1,072 | 1,071 | 1,071 |
| Egyptian Hieroglyphs Extended-A | 3,995 | 3,995 | 3,995 |
| Anatolian Hieroglyphs | 583 | 583 | 0 |
| Bamum Supplement | 569 | 569 | 0 |
| Tangut Components | 768 | 512 | 0 |
| CJK Unified Ideographs Extension B | 42,720 | 37,332 | 0 |
| CJK Unified Ideographs Extension C | 4,160 | 4,049 | 0 |
| CJK Unified Ideographs Extension E | 5,774 | 5,581 | 0 |
| CJK Unified Ideographs Extension F | 7,473 | 7,426 | 0 |
| CJK Compatibility Ideographs Supplement | 542 | 540 | 0 |
| CJK Unified Ideographs Extension G | 4,939 | 4,297 | 0 |
| CJK Unified Ideographs Extension H | 4,192 | 4,170 | 0 |
| CJK Unified Ideographs Extension J | 4,298 | 3,852 | 0 |

## Not in any public web font (largest 25 blocks)

What the CSS dialog cannot offer another programmer.

| Block | Missing |
|---|---:|
| Seal | 11,328 of 11,328 |
| Jurchen | 914 of 914 |
| Symbols for Legacy Computing Supplement | 695 of 695 |
| Archaic Cuneiform Numerals | 311 of 311 |
| Latin Extended-G | 151 of 188 |
| Tangut Components Supplement | 115 of 115 |
| Tulu-Tigalari | 80 of 80 |
| Symbols and Pictographs Extended-A | 71 of 128 |
| Garay | 69 of 69 |
| Gurung Khema | 58 of 58 |
| Kirat Rai | 58 of 58 |
| Arabic Extended-C | 57 of 60 |
| Tai Yo | 55 of 55 |
| Tolong Siki | 54 of 54 |
| Miscellaneous Symbols Supplement | 53 of 53 |
| Jurchen Radicals | 51 of 51 |
| Beria Erfe | 50 of 50 |
| Musical Symbols Supplement | 50 of 50 |
| Ol Onal | 44 of 44 |
| Supplemental Symbols and Pictographs | 43 of 256 |
| Symbols for Legacy Computing | 38 of 250 |
| Miscellaneous Symbols and Arrows Extended | 29 of 29 |
| Sidetic | 26 of 26 |
| Tangut Supplement | 24 of 33 |
| Dives Akuru | 23 of 72 |

## Candidate fonts not shipped

- **NewGardiner** 3.09: Lighter Egyptian option: 4,498 of the 5,066 Egyptian characters at 1.1 MiB WOFF2 (non-core Extended-A signs are placeholders; a companion NewGardinerNonCore font exists). Kept aside per PLAN.md D-4.
- **Noto Sans Egyptian Hieroglyphs** Version 2.002: Basic Egyptian block only (1,071). Kept aside per PLAN.md D-4.
- **LastResort HE** 18.000: 136 KB as WOFF2 but its cmap format 13 subtable yields no glyphs in Chromium (measured 2026-10-08); revisit if browsers gain support.
- **LXGW Seal** 0.001-alpha.10.8: First free font for the Unicode 18 Seal block (OFL-1.1, alpha 2026-10-08). Measured 511 of 11,328 Seal characters (4.5%), below the D-13 pack rule (25% of a block), so not shipped; re-measure on each release.
