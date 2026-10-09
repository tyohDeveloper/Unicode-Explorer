# Unicode Explorer: Audit Checkpoint 4 (Phases 7 and 8)

Checkpoint date: 2026-10-09. Compares **app 2.3.1.0 / data 2.0.6.0** (tags `2.3.1.0-app`,
`2.0.6.0-data`, `checkpoint-4`) with [Checkpoint 3](../checkpoint-3/report.md) (2.2.1.0-app).
Every open, partial, accepted and deferred finding is re-examined against the tree and fresh
measurements. Closed findings are re-checked for regressions through the build chain, the
regeneration check, the CSP and a network-request trace. Two findings raised here (CP4-01 and
CP4-02) were fixed before the tag, in 2.3.1.0. They are reported as found, with the fix.

## State at the checkpoint

| | Checkpoint 3 (2.2.1.0-app) | Checkpoint 4 (2.3.1.0-app) |
|---|---|---|
| Unicode | 18.0.0: 353 blocks, 172,382 visible characters | unchanged |
| Artifact | `Unicode.html` 2,940,385 bytes (gzip 2,054,061) | 3,242,803 bytes (gzip 2,283,961) |
| Source | 129 files, six roles, zero exceptions | 132 files, six roles, zero exceptions |
| Generated, regeneration-checked | 9 tables plus `Unicode.html` | 10 tables (adds `src/data/embedded-fonts.json`) plus `Unicode.html` |
| Embedded fonts | Unifont 18.0.01 and Upper, Last Resort, Adobe Blank 2 | adds a **Charis Latin subset** (D-24, 209 KB) and a **Fairfax HD Latin Extended-G subset** (11.5 KB) |
| Packs | 14 (5 style), none over 8 MiB | 27: adds **13 outline packs** of 159 Noto fonts (D-23), largest 1.9 MB |
| Tests | 76 unit, 22 e2e | 90 unit, 26 e2e over `file://`; CI build, e2e and release green |
| Releases since | — | app 2.2.2.0 to 2.3.1.0 (six); data 2.0.2.0 to 2.0.6.0 (five). Zips: Complete 31.2 MB, Complete + Hieroglyphs 34.7 MB |

## What was measured

Sandbox Chromium 1248 (Linux, Playwright), `Unicode.html` over `file://`. The script and raw
outputs are in [`evidence/`](evidence/): `measure-checkpoint-4.cjs`, `measurements.json`
(2.3.0.0) and `measurements-2.3.1.0.json`.

| Measurement | Checkpoint 3 | Checkpoint 4 |
|---|---|---|
| Warm start-up to first render (5 runs) | ~600 ms | 562–623 ms (first, cold run 797 ms) |
| Drawn by the embedded fonts alone | 78,223 of 172,382 | 78,274: **1,854 outline** (Charis), 76,420 bitmap (Unifont 55,700, Unifont Upper 20,669, Fairfax HD 51) |
| Standard, all blocks: first cells / detection complete | 0.2–0.5 s / 4.0 s | 0.38 s / 4.3 s |
| Complete, all blocks: first cells / detection complete | not measured | 2.2.5.0: 1.29 s / 11.7 s; **2.3.0.0: 1.65 s / 12.3 s** (CP4-03) |
| Verified with the sandbox's device fonts, Standard | 88,315 | 88,366 at 2.3.0.0; **88,806 at 2.3.1.0** (CP4-01) |
| Verified, Complete with all packs | not measured | 155,635 (unchanged by the outline packs, as intended) |
| Network requests / page errors | 0 / 0 | 0 / 0 in both editions |
| Edition coverage (`build:packs`) | 78,224 · 154,514 · 159,580 | 78,275 · 154,565 · 159,631 of 172,382 |
| CSS dialog, public web fonts | not measured (157,704 at 2.2.3.0) | 158,883; the 748 only Unifont 18 covers get a self-host template (D-21) |
| Bitmap-drawn when no device font helps, Complete | not measured (70,027 at 2.2.5.0) | **44,131**: 42,318 CJK/Hangul (Q-15), about 1,800 Unifont- or Fairfax-only |
| Release job duration | 5.6–6.0 min (2.2.4.0, 2.2.5.0) | 7 min 51 s (CP4-08) |

## Verdict

Phases 7 and 8 closed what they set out to close. Latin Extended-G and Hebrew are complete
(#14, CP3-03). Every missing character is tracked with an issue and a dated font watch. The
CSS dialog gives other programmers a route for the last 748. The bitmap look the owner noticed
at U+1DF12 is fixed where free outline fonts exist: 1,854 characters in Standard, 24,229 more
in the Complete editions. **No P1 finding is open.** The one P2 raised here (CP4-01) was fixed
before the tag.

Three lessons:

1. **Counting glyphs hid which kind of glyph.** Every coverage measure so far asked whether a
   character draws, not how. The owner found the bitmap problem by looking. The manifest now
   records each font's `design`, the details strip shows it, and the planner measures it.
2. **Fallback order matters more than font count.** The embedded fonts sit ahead of the
   browser's own fallback, so an installed font the app doesn't name is invisible to it. On a
   machine with Noto Sans CJK, 中 was drawn by Unifont in the default mode (CP4-01). The
   new strip made it visible in one hover.
3. **The size baseline catches what review misses.** Importing the whole font manifest would
   have added about 150 KB of JSON to `Unicode.html` once the outline packs grew it to 280 KB.
   The baseline diff flagged it, and the app now reads a generated table of the six embedded
   fonts.

## Finding register

[`finding-register.csv`](finding-register.csv) adds `status_cp4`, `closed_in_cp4` and
`evidence_cp4` to every earlier finding, and adds eight new ones.

| Status | Count | Findings |
|---|---:|---|
| Closed | 49 | Every Checkpoint 1 finding, including GLY-03 (2.2.2.0); CP2-01, -02, -05, -06; CP3-02, -03, -05, -06, -08, -09; CP4-01, CP4-02 |
| Partial | 1 | CP4-05: data versioned late in 2.0.6.0; a release guard is still to write |
| Open | 7 | CP2-04 (Tangut 147, upstream), CP2-07 (cosmetic), CP3-01 (Seal, Jurchen, Archaic Cuneiform Numerals, upstream), CP3-07 (erratum, owner), CP4-03, CP4-06, CP4-07 |
| Accepted | 4 | CP2-03 (D-12), CP3-04 (parked as optional #17), CP4-04, CP4-08 |

New at this checkpoint:

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| CP4-01 | P2 | In System mode, CJK and Hangul fell to Unifont even with a CJK font installed: no Linux CJK names, and no Microsoft YaHei, JhengHei or Malgun Gothic | Closed in 2.3.1.0 (`data/device-fonts.json`) |
| CP4-02 | P3 | The details strip called generic families installed fonts | Closed in 2.3.1.0 |
| CP4-03 | P3 | Complete, all blocks: first cells +0.36 s and scan +5% from the 13 outline packs | Open |
| CP4-04 | P3 | Outline and bitmap glyphs still mix within blocks; Standard draws 76,420 in bitmap without device fonts | Accepted (size); CJK outline is Q-15 |
| CP4-05 | P3 | 2.3.0.0 changed `fonts/manifest.json` without a data-track bump | Partial: versioned in 2.0.6.0; guard pending |
| CP4-06 | P3 | `plan:outline` needs a local Noto directory, so the plan isn't reproducible from the repo alone | Open |
| CP4-07 | P3 | Three Noto snapshots pinned (47acfd38, 578d18e1, noto-fonts ffebf8c1) | Open; consolidate at the font watch |
| CP4-08 | P3 | Release job about 6 → 7.9 min from about 170 pinned font downloads | Accepted |

## Recommendations

In priority order:

1. **Release guard** (CP4-05): `scripts/release.mjs` refuses an app tag when `data/` or
   `fonts/manifest.json` changed since the last data tag without a new data version. Small, and
   it prevents a repeat.
2. **Reproducible outline plan** (CP4-06): a `--fetch` mode for `plan:outline` that downloads
   the Regular TTFs listed at the pinned notofonts.github.io commit, so CI can re-plan.
3. **Performance review, parked** (CP4-03 with #17): load packs for off-screen blocks after
   first paint, and defer the presence test. Both are small gains with moderate complexity.
   They are good candidates for the later review the owner plans.
4. **Q-15 stays deferred.** With CP4-01 fixed, installed CJK fonts are used on Windows, macOS
   and Linux. The 16 MB outline CJK pack would help only machines with no CJK font at all.
5. **Font watch, 8 January 2027** (scheduled): CP3-01 and CP2-04 candidates, plus consolidating
   the Noto pins (CP4-07).
6. **Submit the Seal erratum** (CP3-07): owner action.

## Sources

- Measurements: [`evidence/measure-checkpoint-4.cjs`](evidence/measure-checkpoint-4.cjs),
  outputs [`evidence/measurements.json`](evidence/measurements.json) and
  [`evidence/measurements-2.3.1.0.json`](evidence/measurements-2.3.1.0.json).
- Phase 8 plan and status: [`../../PLAN.md`](../../PLAN.md) §Phase 8; issues
  [#16](https://github.com/tyohDeveloper/Unicode-Explorer/issues/16),
  [#18](https://github.com/tyohDeveloper/Unicode-Explorer/issues/18).
- Missing glyphs: [`../../coverage/missing-glyphs.md`](../../coverage/missing-glyphs.md).
- Noto fonts: [notofonts.github.io at 578d18e1](https://github.com/notofonts/notofonts.github.io/tree/578d18e1cfce41c8cc93d0a0f514cac3a1affb2e).
- Charis: [SIL font-charis at 9e118e41](https://github.com/silnrsi/font-charis/tree/9e118e417d2a1a5607605f3f04e24d323f398bd8).
