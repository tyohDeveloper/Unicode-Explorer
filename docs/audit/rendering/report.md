# Unicode Explorer: Rendering and Style Correctness (Phase 10)

**Status: closed 2026-10-10.** One finding remains open, RND-08 (emoji sequences), tracked as
[#23](https://github.com/tyohDeveloper/Unicode-Explorer/issues/23) and PLAN Q-19.

Audit date: 2026-10-09. Covers **app 2.3.3.0 / data 2.0.8.0** against 2.3.1.1 (the build before
Phase 10). Earlier audits measured whether each character draws. This one measures whether it
draws **correctly**:

- marks attached to their base;
- shipped fonts shaping like their originals;
- real text in each script drawn by one font;
- emoji sequences and Hangul composition;
- real versus synthesized bold and italic.

Plan: [`../../PLAN.md`](../../PLAN.md) §Phase 10; issue
[#22](https://github.com/tyohDeveloper/Unicode-Explorer/issues/22).

## Method

Two devices, both Chromium 1248 on Linux through Playwright over `file://`:

- **Minimal device:** fontconfig sees one Latin font (Liberation Sans Narrow Bold Italic, hence
  the slanted Latin rows in the sample sheets). This is the main
  fixture, because installed fonts hide what the app's own fonts do.
- **Rich device:** the sandbox's full font set, including Noto, Noto CJK and Noto Color Emoji.

Scripts and raw outputs are in [`evidence/`](evidence/):

| Item | Script | Output |
|---|---|---|
| R-1 shaping parity | `tools/fonts/verify_shaping.py` (`npm run verify:shaping`, in the release workflow) | `shaping-parity.json` |
| R-2 marks census | `marks-census.cjs` | `marks-census-{minimal,rich}-{standard,complete}.json` |
| R-3 script samples | `script-samples.cjs` over `data/script-samples.json` | `samples-*.json`, `samples-*.png` |
| R-4/R-5 sequences | `sequences.cjs` | `sequences-*.json` |
| R-6 style faces | inline fontTools count | `style-faces.json` |
| Totals and timings | `../checkpoint-4/evidence/measure-checkpoint-4.cjs` | `measurements-{rich,minimal}.json` |

## Results

| Measure | 2.3.1.1 | 2.3.3.0 |
|---|---|---|
| Marks drawn on U+25CC by one font, minimal device, Complete | not measured; Chakma U+11127 and 113 supplementary-plane marks drew as boxes | **2,321 of 2,580; 0 split**. The other 259 are variation selectors and other invisible characters, which the app shows as labelled boxes |
| Shipped fonts shaping like their full sources | not measured | **213 fonts, 24,731 strings, 0 mismatches**; 1 Duployan string exceeds HarfBuzz's limits in both fonts |
| Script samples drawn by one font, minimal device, Complete | not measured; Arabic drawn by Noto Sans Math | 37 of 40; the rest are Latin words mixing the device font with Charis, and polytonic Greek |
| Embedded fonts, outline / bitmap glyphs | 1,854 / 76,420 | **2,211** / 76,063 |
| Verified, minimal device: Standard · Complete | not measured · 154,564 (included boxed marks) | 78,274 · 154,564 (all genuinely drawn) |
| Verified, rich device: Standard · Complete | 88,806 · 155,635 | 88,806 · 155,635 |
| Warm start-up (5 runs) | ~600 ms (2.3.1.0) | 584–628 ms |
| All-blocks scan, Complete: minimal · rich | 7.7–8.7 s · 12.3–12.8 s | 8.3 s · 12.5 s |
| Network requests, page errors | 0, 0 | 0, 0 |

Emoji and Hangul (R-4, R-5):

| Sequence | Minimal device | Rich device |
|---|---|---|
| ZWJ, flags, keycaps, skin tones | Fall apart into components (Unifont); no emoji font | One glyph each (Noto Color Emoji) |
| ❤ with VS16 / VS15 | Unifont (Standard), Noto Sans Symbols 2 (Complete) | Color emoji / text font, as asked |
| Hangul syllable 한; modern jamo ᄒ+ᅡ+ᆫ | One glyph each, Unifont included | One glyph each (Noto Sans CJK) |
| Old-Hangul extended jamo ꥠ+ힰ | Two glyphs | Two glyphs |

Genuine style faces in the style packs (R-6), among the characters each style pack covers:

| Style | Regular | Bold | Italic | Bold italic |
|---|---:|---:|---:|---:|
| Serif (Charis, Noto Serif, script faces, symbols) | 10,174 | 4,804 (47%) | 3,190 (31%) | 3,190 (31%) |
| Sans (Andika, Noto Sans, script faces, symbols) | 10,208 | 5,533 (54%) | 3,190 (31%) | 3,190 (31%) |

Italic exists only where the fonts' scripts use it: Latin, Greek and Cyrillic. "Show synthesis"
(D-15) shows which characters lack a real face.

## Findings

| ID | Sev. | Finding | Disposition |
|---|---|---|---|
| RND-01 | P1 | Subset fonts (Charis Latin, all 159 outline fonts) lost U+25CC. Marks on the circle drew from another font: Chakma U+11127 as two boxes, U+0941 and U+0301 in bitmap Unifont | Closed in 2.3.2.0: subsets keep U+0020, U+00A0 and U+25CC (D-26) |
| RND-02 | P2 | Glyph detection tested a mark alone, so it counted boxed marks as verified | Closed in 2.3.2.0: a mark is verified only when one listed font draws it with U+25CC, in two tiers (no slowdown) |
| RND-03 | P2 | Unifont Upper has no U+25CC: 113 marks in Garay, Tulu-Tigalari, Gurung Khema, Arabic Extended-C and others drew as boxes | Closed in 2.3.2.0: U+25CC borrowed from Unifont (D-27, reproducible since 2.3.2.1) |
| RND-04 | P3 | Subsets dropped the space glyph and decomposition targets: 9 strings shaped differently (U+034F, Khmer U+17B4/17B5, Todhri dotted letters) | Closed in 2.3.3.0: subsets keep U+0020 and canonical decompositions; `verify:shaping` in the release workflow |
| RND-05 | P2 | 29 blocks were claimed by several outline fonts, and the earliest won. Noto Sans Math drew ordinary Arabic text in Complete | Closed in 2.3.3.0: one owner per block; other fonts keep only characters the owner lacks |
| RND-06 | P3 | In Complete, Latin combining marks came from Noto Sans Mono, because packs preceded the embedded Charis | Closed in 2.3.3.0: embedded outline fonts precede the packs (D-28) |
| RND-07 | P3 | Charis has no polytonic Greek. Ἑ is bitmap in Standard and Noto Sans Mono in Complete | Partly fixed: the Charis subset now adds basic Greek and Cyrillic (+355 characters, +48 KB). Polytonic accepted |
| RND-08 | P3 | Without an emoji font, ZWJ sequences, flags, keycaps and skin tones fall apart | Open as Q-19 (#23). Measured candidate: monochrome Noto Emoji, 1.0 MB WOFF2, 1,489 code points, 4 of 6 test sequences joined. Recommended: accept, as for CJK (D-25), and add the pack if bare-device emoji matter |
| RND-09 | P3 | Old-Hangul extended jamo don't compose, even with Noto Sans CJK SC | Accepted: needs a Korean font with old-Hangul shaping |
| RND-10 | P3 | Some marks take width on U+25CC (Sutton SignWriting 127; some Indic vowel signs) | Accepted: font design, the same with the full installed fonts |
| RND-11 | P3 | On a minimal device, a Latin word mixes the device font with Charis where the device font lacks letters | Accepted: inherent to fallback; the Serif and Sans style packs give one family in Complete |
| RND-12 | P3 | One Noto Sans Duployan test string exceeds HarfBuzz's operation limit in both fonts | Accepted: recorded as skipped by `verify:shaping` |
| RND-13 | P3 | The release workflow failed twice (2.3.2.0, 2.3.2.1): the borrowed-glyph conversion embedded a timestamp, and manifest totals weren't re-measured | Closed in 2.3.2.2: reproducible conversion, and `release.mjs` re-runs `build:packs` |

## Verdict

The phase found one P1 and three P2 defects, all introduced by subsetting and pack order in
Phases 7–8, and all invisible to every earlier measure. They are fixed. Each shipped font now
shapes exactly like its original. Every mark the app shows on the dotted circle draws from one
font. The scan and start-up are no slower. The remaining open item is emoji sequences on
devices without an emoji font (RND-08).

Lessons:

1. **Subsetting is a correctness risk, not just a size choice.** Whole-block subsets lost the
   characters that make clusters work: the dotted circle, the space, decomposition targets. A
   machine check against the full font (`verify:shaping`) now guards every release.
2. **Test on a bare device.** Every defect here was hidden by the sandbox's installed Noto fonts.
3. **Overlap needs an owner.** Greedy font selection is fine for counting coverage, but text
   needs one font per block.

## Recommendations

1. **RND-08 (Q-19):** measured. Monochrome Noto Emoji is 1.0 MB WOFF2 and joins 4 of 6 test
   sequences. Decide between accepting (recommended) and adding it as a Complete pack.
2. Keep the minimal-device fixture as a regular check. Turn the marks census and script samples
   into e2e tests that run with a one-font fontconfig in CI.
3. Fold these measurements into the next audit checkpoint's standard set.
