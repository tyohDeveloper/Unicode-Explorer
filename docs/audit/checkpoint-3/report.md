# Unicode Explorer: Audit Checkpoint 3 (Phases 5 and 6)

Checkpoint date: 2026-10-08. Compares the state at **app 2.2.1.0 / data 2.0.1.0** (tags
`2.2.1.0-app`, `2.0.1.0-data`) with [Checkpoint 2](../checkpoint-2/report.md) (2.0.0.0-app).
Every open, partial and deferred finding is re-examined against the tree and fresh measurements.
Closed findings are re-checked for regressions through the build chain, the regeneration check,
the CSP and a network-request trace.

## State at the checkpoint

| | Checkpoint 2 (2.0.0.0-app) | Checkpoint 3 (2.2.1.0-app) |
|---|---|---|
| Unicode | 17.0.0: 346 blocks, 159,375 visible characters | **18.0.0**: 353 blocks, 172,808 characters, 172,382 visible |
| Artifact | `Unicode.html` 2,795,352 bytes (gzip 1,985,453) | 2,940,385 bytes (gzip 2,054,061) |
| Source | 91 files, six roles, zero exceptions | 129 files, six roles, zero exceptions |
| Data | 5 UCD files; 6 generated tables | 9 UCD 18.0.0 files with SHA-256; 9 generated tables plus `Unicode.html` regeneration-checked |
| Fonts | Unifont 17.0.05, Last Resort 18.000; 7 packs | Unifont 18.0.01, Last Resort 18.000; 14 packs (5 style packs, D-14), none over 8 MiB (D-20) |
| Tests | 50 unit, 13 e2e | 76 unit, 22 e2e over `file://`; CI build, e2e and release green |
| Releases since | — | 2.1.0.0, 2.2.0.0, 2.2.1.0 (app); 1.2.0.0, 2.0.0.0, 2.0.1.0 (data). Zips: Complete 26.6 MB, Complete + Hieroglyphs 30.1 MB |

## What was measured

Sandbox Chromium 1248 (Linux, Playwright), released `Unicode.html` over `file://`. Scripts and
outputs are in [`evidence/`](evidence/).

| Measurement | Checkpoint 2 | Checkpoint 3 |
|---|---|---|
| Warm start-up to first render (5 runs) | ~530 ms | ~600 ms (CP3-04) |
| Drawn by the embedded fonts alone | 77,873 of 159,375 | **78,223 of 172,382**; 25 blocks with gaps (`evidence/embedded-only-gaps-by-block.json`) |
| Drawn by Last Resort behind Adobe Blank | 159,375 of 159,375 | 172,382 of 172,382 |
| Embedded-only probe, all characters | 1.2 s | 1.3 s |
| All blocks: first cells | 52 s (whole output) | 0.2–0.5 s (1,204 cells built, 607 chunks pending) |
| All blocks: detection complete | inside the 52 s freeze | 4.0 s in the background; longest main-thread task 61 ms |
| Re-render after a mode, font or filter change, all blocks | full rebuild | 200–340 ms including the 80 ms debounce |
| Verified with the sandbox's device fonts | 87,965 | 88,315 |
| Contrast on the panel: `--text-dim` / `--accent-text` | 4.25:1 accent | 6.00:1 / 6.42:1 (on background 6.59:1 / 7.05:1) |
| Network requests from the artifact | 0 | 0; page errors 0 |
| Edition coverage (`build:packs`) | 77,874 · 154,164 · 159,230 of 159,375 | **78,224 (45.4%) · 154,514 (89.6%) · 159,580 (92.6%)** of 172,382 |

The coverage percentages fell because Unicode 18 added 13,007 characters. 12,604 of them are in
Seal, Jurchen and Archaic Cuneiform Numerals, which no usable free font covers yet (CP3-01). The
absolute number of characters with glyphs rose in every edition.

## Verdict

Phases 5 and 6 closed every finding they were scheduled to close, with measurements. **No P1
finding remains open.** The output is now fast at full scale: all blocks paint in a fraction of a
second instead of 52 s. It is keyboard-operable, meets contrast, and is current with Unicode 18,
with character names checked against the UCD for all 172,808 characters. The remaining work is
small polish, plus coverage that depends on fonts nobody has published yet.

Three lessons from this stretch:

1. **Hosting constraints are part of delivery.** The 17.3 MB CJK pack never loaded from the
   hosted test build. The host redirects large files to another origin, and the CSP correctly
   refused them. It went unnoticed from 2.0.0.0 until Checkpoint 3 work looked at every pack over
   HTTP. The 8 MiB limit is now enforced by the build (D-20).
2. **A cache can lie during a version bump.** `fetch:fonts` pinned the 17.0.05 Unifont bytes to
   the 18.0.01 URL, and the vendored "update" was byte-identical. The release workflow would not
   have caught it, because the wrong hash was self-consistent. Unpinned sources now always
   download (CP3-06).
3. **The UCD data files beat the prose.** The Unicode 18 chapter on Seal gives a different name
   prefix from Table 4-8 and `DerivedName.txt`. Testing every name against `DerivedName.txt`
   makes the data files the single authority (CP3-07).

## Finding register

[`finding-register.csv`](finding-register.csv) adds `status_cp3`, `closed_in_cp3` and
`evidence_cp3` to every earlier finding, and adds nine new ones.

| Status | Count | Findings |
|---|---:|---|
| Closed | 43 | All Checkpoint 1 findings except GLY-03; CP2-01, CP2-02, CP2-05, CP2-06; CP3-05, CP3-06, CP3-09 |
| Partial | 1 | GLY-03: fixed in the Complete editions by the style packs (D-14); the Standard edition's built-in stacks still list CJK families first and name the nonexistent `Noto Serif CJK` |
| Open | 7 | CP2-04 (145 Tangut, upstream), CP2-07 (cosmetic), CP3-01 (Seal, Jurchen, Archaic Cuneiform Numerals, upstream), CP3-02 (Unifont Upper 18 lost 51 Latin Extended-G), CP3-04 (start-up), CP3-07 (Unicode erratum, upstream), CP3-08 (size label) |
| Accepted | 2 | CP2-03 (detection cannot see system fallback, D-12), CP3-03 (no web font for U+05C8, U+05C9 yet) |

New at this checkpoint:

| ID | Severity | Finding | Disposition |
|---|---|---|---|
| CP3-01 | P2 | 12,604 Unicode 18 characters (Seal, Jurchen, Archaic Cuneiform Numerals) have no usable font; 98% of the remaining Complete + Hieroglyphs gap | Open; re-measure LXGW Seal and Kaiyuan Small Seal on each release |
| CP3-02 | P3 | Unifont Upper 18.0.01 dropped 51 Latin Extended-G and 2 Tangut Supplement glyphs | Open; report upstream, optionally restore from 17.0.05 |
| CP3-03 | P3 | No public web font has Hebrew U+05C8/U+05C9 yet | Accepted; the CSS dialog reports it |
| CP3-04 | P3 | Start-up +70 ms since 2.0.0.0 from tables parsed eagerly | Open |
| CP3-05 | P2 | Hosted build could not load the 17.3 MB pack | Closed in 2.2.1.0 (D-20) |
| CP3-06 | P2 | `fetch:fonts` pinned a cached old font to a new URL | Closed in 2.2.0.0 |
| CP3-07 | P3 | Unicode 18 chapter 18 Seal name prefix contradicts Table 4-8 and `DerivedName.txt` | Open (report upstream) |
| CP3-08 | P3 | CSS dialog's size comment does not say it is before HTTP compression | Open |
| CP3-09 | P3 | harfbuzzjs truncated large subsets; fontTools used instead | Closed in 2.2.1.0 (recorded) |

## Recommendations for Phase 7

In priority order:

1. **Fix the Standard edition's built-in stacks** (GLY-03): Latin, Greek and Cyrillic families
   before the CJK ones in `data/font-stacks.json`, and region-suffixed names (`Noto Serif CJK SC`,
   etc.) in place of the nonexistent `Noto Serif CJK`. A data-only change, with an e2e test that
   checks a Latin cell's computed family order.
2. **Restore the 53 lost Unifont glyphs** (CP3-02): report the regression to the Unifont
   maintainer. Until it is fixed upstream, embed a few-kilobyte subset of Unifont Upper 17.0.05
   containing only those assigned characters, labelled in `fonts/manifest.json`, using the D-20
   subsetting tool.
3. **Parse the web-font and alias tables on first use** (CP3-04), and label the CSS dialog's
   size as before HTTP compression (CP3-08).
4. **Watch for Seal, Jurchen and Tangut fonts** (CP3-01, CP2-04): a monthly check of LXGW Seal,
   Kaiyuan Small Seal and the Noto Tangut releases, re-measured against the D-13 rule.
5. **Report the Seal naming erratum** to the Unicode Consortium (CP3-07).

Q-10 (`local()`-composed script-aware stacks) stays deferred: the style packs and the CSS dialog
cover its purpose for the Complete editions and for other programmers.

## Sources

- Measurements: [`evidence/measure-checkpoint-3.js`](evidence/measure-checkpoint-3.js), run
  2026-10-08 against `2.2.1.0-app`; earlier releases' `Unicode.html` from their tags for the
  start-up comparison.
- Decisions: [`../../PLAN.md`](../../PLAN.md) D-14 to D-20.
- Releases: <https://github.com/tyohDeveloper/Unicode-Explorer/releases/tag/2.2.1.0-app>,
  <https://github.com/tyohDeveloper/Unicode-Explorer/releases/tag/2.2.0.0-app>,
  <https://github.com/tyohDeveloper/Unicode-Explorer/releases/tag/2.1.0.0-app>.
- Unicode 18.0.0: <https://www.unicode.org/versions/Unicode18.0.0/>; name rules in chapter 4,
  Table 4-8: <https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-4/>; Seal in
  chapter 18: <https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-18/>.
- Unifont 18.0.01: <https://unifoundry.com/unifont/>. LXGW Seal:
  <https://github.com/lxgw/LxgwSeal>. Kaiyuan Small Seal:
  <https://github.com/frankslin/kaiyuan-small-seal-font>. Noto Serif Tangut:
  <https://github.com/notofonts/tangut/releases>.
