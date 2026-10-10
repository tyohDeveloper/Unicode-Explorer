# Implementation plan

Checkpointed 2026-10-08 against baseline commit `e7ad733`, before Phase 1 began.
Source of the findings: [`audit/checkpoint-1/`](audit/checkpoint-1/). Finding IDs below
(`GLY-01`, `ARC-03`, …) refer to that register.

This file is the plan of record. When a decision here changes, change it here first, in its
own commit, before the code that depends on it.

## Goal

Display as many Unicode glyphs as feasible from one offline HTML file, and bring the
repository under the same standards, build chain, and release discipline as
[history-and-prehistory](https://github.com/tyohDeveloper/history-and-prehistory).

## Decisions

### Decided

| ID | Decision | Rationale |
|---|---|---|
| D-1 | **Standard** edition is the default artifact. It embeds GNU Unifont, Unifont Upper, Last Resort (full build, see D-11) and Adobe Blank 2. | Guarantees every visible Basic Multilingual Plane character (77,874 code points, 48.9% of all visible Unicode 17 characters) and offers a labelled placeholder for the rest, at 2.8 MB (1.77 MB of fonts). |
| D-2 | **Complete** edition is a release asset, not the default (packaging superseded by D-10). It adds Jigmo2, Jigmo3, Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, and Noto Serif Tangut. | 154,164 code points (96.7%), about 24.7 MiB. Too large for routine use or Git history; right as a tagged download. |
| D-3 | **Complete + Hieroglyphs** edition is a second release asset (packaging superseded by D-10). It is Complete plus UniHieroglyphica. | 159,230 code points (99.9%), about 32.9 MiB. UniHieroglyphica covers the whole Egyptian repertoire, basic block and Extended-A (5,066 characters), in one OFL font. |
| D-4 | No Egyptian-hieroglyph font ships in Standard or Complete, and no hieroglyph-specific feature is built. Candidate fonts (NewGardiner, Noto Sans Egyptian Hieroglyphs) are recorded in `fonts/manifest.json` as side assets for possible later inclusion. | Owner decision, 2026-10-08. |
| D-5 | Phases run in the order below. Phase 1 (governance) and Phase 2 (build integrity) precede any change to application behaviour. | Low risk first; every later phase runs through the checks Phase 2 adds. |
| D-7 | No hosting at present. Replit (or an equivalent) may return later; when it does, use the history-and-prehistory pattern (`vite dev`/`vite preview` on `0.0.0.0:5000`), not an Express server. The server and Replit configuration are removed in Phase 2. | Owner note, 2026-10-08. Resolves Q-6. |
| D-8 | Four-part numbers are driven by the size of semantic change but carry no meaning themselves. Meaning lives in `CHANGELOG.md`, annotated tags, comments, and the README. `scripts/release.mjs` refuses to tag a version that has no CHANGELOG section and writes that section into the tag message. | Owner note, 2026-10-08. Resolves Q-9: the two derived copies differ only in wording; no wiki change required beyond adopting the four-part text. |
| D-9 | The built `Unicode.html` stays committed at the repository root, verified against source by a regeneration check in CI. Release assets are attached in addition. | Resolves Q-5. Keeps the "open the file from GitHub" path working while CI guarantees the copy is honest. |
| D-10 | **Sidecar font packs with soft failure** ([ADR-0001](adr/0001-sidecar-font-packs.md)). `Unicode.html` stays Standard and self-contained. Complete fonts ship as a sibling `unicode-fonts/` directory of classic-script packs loaded on demand per selected block; absent packs degrade to Standard with a status note. Release assets become `Unicode.html`, `Unicode-Explorer-Complete.zip`, and `Unicode-Explorer-Complete-Hieroglyphs.zip`. Supersedes the single-file packaging of D-2 and D-3; fonts and licenses unchanged. | Owner decision, 2026-10-08, after the Chromium `file://` and HTTP measurements in the ADR. |
| D-6 | Last Resort is never placed in the global font stack. It is applied per cell, by detection, to characters the device and embedded fonts cannot render. | A font covering every code point anywhere in a `font-family` list stops the browser from reaching device fonts that are not named. Per-cell application keeps device fallback and still shows a block placeholder. |
| D-11 | The placeholder font is the **full** Last Resort 18.000 build (242 KB as WOFF2), not the "HE" build the audit chose (136 KB). | Measured 2026-10-08 in Chromium: the HE build's cmap format 13 subtable yields no glyphs as a web font, even for BMP characters, so placeholders would silently be the browser's own box. The full build uses a format 12 cmap and renders every code point. HE stays in `fonts/manifest.json` under `candidates`. |
| D-12 | Detection reports **verified** (a listed font renders the character) or **unverified** (no listed font does), never "missing". Unverified cells are outlined; Last Resort placeholders are an opt-in toggle (`p=1` in the hash), off by default. | The probe can only see fonts named in the stack: a stack terminated by Adobe Blank 2 never reaches system fallback, and Chromium's tofu metrics vary by code point (measured), so no heuristic can tell "the device found a font we did not name" from "nothing rendered". Forcing a placeholder on an unverified cell could therefore hide a real glyph. Naming known device fonts per script (`data/device-fonts.json`) shrinks the unverified set honestly. |
| D-14 | **Style packs** for the Serif and Sans buttons: the Unicode Font Kit's `unicode-serif` (Charis 7.000 → Noto Serif → Doulos SIL → script Noto serif faces → FreeSerif → DejaVu Serif) and `unicode-sans` (Andika 7.000 → Noto Sans → script Noto sans faces → FreeSans → DejaVu Sans) stacks ship as two sidecar packs, loaded when the button is chosen, placed ahead of the device style stack (deliberate, known faces first) and before the embedded Unifont pair. Regular faces only by default (~1–1.5 MB per pack); `Unicode.html` does not grow. Without the packs the buttons behave as in 2.0.0.0. | Owner decision, 2026-10-08. Until now Serif and Sans differed only where the device had fonts; everything else fell to the same pixel font (GLY-03). Same mechanism, tooling and licences (OFL) as ADR-0001. |
| D-15 | **Bold and Italic** are two toggles (`bold=1`, `italic=1`), not a weight scale; a third, **No synthesis** (`nosynth=1`), sets `font-synthesis: none`. Genuine bold, italic and bold-italic faces ship as `serif-styles` and `sans-styles` packs, loaded only when a toggle is on. Weights are out of scope. | Owner decision 2026-10-08 (was Q-11, Q-12). Weight changes no coverage; synthesis is what real pages get, and the switch shows where it happens. |
| D-16 | **CSS for this selection** writes CSS for other programmers' apps: a web-font form from pinned, CORS-enabled public URLs (`data/web-fonts.json`, measured from cmaps, so the same on every device) and a no-download form naming only fonts found on this device. It never refers to this app's `unicode-fonts/` files and never fetches. Fonts are chosen in the Unicode Font Kit's serif or sans priority order, keeping a family only if it adds coverage; families of 1 MB or more whose characters other families cover are dropped. | Owner decision 2026-10-08 (was Q-13). |
| D-18 | Algorithmic-name ranges and prefixes are generated from `DerivedName.txt` (DAT-03); the authored table is removed. | Phase 6 checkpoint 2026-10-08. |
| D-19 | Character details (DAT-05) as a strip that follows focus and hover (option A of three). | Recommended at the Phase 6 checkpoint 2026-10-08; owner may revise. |
| D-20 | No sidecar pack exceeds 8 MiB. Larger fonts are split by code-point ranges (`subset` in `fonts/manifest.json`) with fontTools `pyftsubset`, keeping all layout features, and each piece registers with a `unicode-range`. CJK Ext B–F (17.3 MB) became Ext B part 1 (5.8 MB), part 2 (6.3 MB) and C–F, I + Compatibility Supplement (5.4 MB); Egyptian, restricted to its three blocks, fell from 8.5 to 4.5 MB (the font's private-use glyphs are dropped). harfbuzzjs (subset-font) was rejected: it truncated the glyph table for ~20,000-glyph subsets. | Owner accepted the recommendation 2026-10-08. The hosted test build redirects files over ~10 MB to another origin, and the CSP (`script-src 'self'`) correctly blocks the redirected script; smaller packs also mean smaller downloads. Coverage unchanged; subset Egyptian renders pixel-identically to the full font on format-control sequences. |
| D-21 | Characters that only GNU Unifont 18 covers get a **commented self-host template** in the CSS dialog: one `@font-face` per Unifont file with the exact `unicode-range`, the unifoundry.com download link, the licence, and a note that Unifont is bitmap-style. Nothing points at this project's files (D-16 unchanged). | Owner chose option B of Q-14, 2026-10-09. |
| D-22 | The details strip says which font draws a glyph and whether it is outline or bitmap. | Phase 8 checkpoint, 2026-10-09. |
| D-23 | Complete editions carry outline packs chosen by measured gain over the bitmap-drawn set, subset to whole blocks and grouped by category (≤ 8 MiB each). | Phase 8 checkpoint, 2026-10-09. |
| D-24 | Standard embeds a Charis subset for the Latin/IPA/phonetic blocks ahead of Unifont (~280 KB). | Phase 8 checkpoint, 2026-10-09; owner accepted the recommended path. |
| D-26 | Every subset font keeps U+00A0 and U+25CC when the font has them (`tools/fonts/subsetSfnt.ts`): marks are drawn on U+25CC and browsers draw a cluster from one font. | Phase 10 R-0, 2026-10-09. |
| D-27 | A font may borrow glyphs it lacks from another manifest font (`borrow`, `tools/fonts/borrow_glyphs.py`). Unifont Upper borrows U+25CC from Unifont; Unifont declares no Reserved Font Name, so the OFL permits the modified font to keep its name. | Phase 10 R-0, 2026-10-09. |
| D-28 | Stack order: style packs, style, device fonts, embedded outline fonts (Charis Latin), block packs, embedded bitmap fonts. Outline packs own whole blocks one font each; other fonts keep only characters the owner lacks. | Phase 10 R-2/R-3, 2026-10-09. |
| D-25 | CJK/Hangul glyphs come from installed fonts, named per platform in `data/device-fonts.json` (CP4-01); no outline CJK pack ships. Unifont stays the fallback only on devices with no CJK font (42,318 characters). Revisit if a size-acceptable outline CJK source appears or users report bitmap CJK. | Owner kept Q-15 deferred, 2026-10-09. |
| D-17 | Style packs carry only OFL fonts (Charis, Andika, Doulos SIL, Noto). DejaVu (Bitstream Vera licence) and GNU FreeFont (GPL-3.0 with font exception) are excluded under `licences_allowed`; the CSS dialog may still suggest them as text, labelled with their licences. Noto CJK is excluded for size. | Licence policy unchanged; recorded 2026-10-08. |
| D-13 | A pack attaches to the blocks in its declared categories whose visible assigned characters it covers at least a quarter of (`fonts/manifest.json` `pack_rule`). | Coverage, not novelty: an installed outline pack is preferred over the embedded bitmap fonts wherever it applies (CJK Extension D and I render from Jigmo when the pack is present). The category scope keeps a CJK font's stray ASCII glyphs from attaching a 17 MB pack to Basic Latin. |

### Open

| ID | Decision | Recommendation |
|---|---|---|
| Q-4 | Upgrade to Unicode 18 before or after the module migration | After Phase 2, so the upgrade runs through regeneration and verification checks. |
| Q-7 | Data-track versioning | One data track covering the Unicode Character Database snapshot and the font manifest. Tag the current Unicode 17 build `1.0.0.0-data`; the Unicode 18 upgrade is `2.0.0.0-data`. |
| Q-8 | Jigmo (the Basic Multilingual Plane file, 7.1 MiB) in Complete | Excluded in Phase 4 (only Jigmo2 and Jigmo3 are packed). Revisit if the coverage readout shows BMP CJK unverified on target devices. |
| Q-10 | Script-aware style stacks via `@font-face local()` + `unicode-range` composition (GLY-03, second half) | Deferred from Phase 4. Phase 4 names device fonts per script in `data/device-fonts.json` instead, which fixes detection credit and most fallback order; composing local() faces is a quality step for Phase 5 or later. |

## Editions

All three editions build from the same source. Standard fonts embed in the HTML as
`data:font/woff2;base64` with measured `unicode-range` descriptors; Complete fonts ship as
sidecar packs under `unicode-fonts/` (D-10). Measured against the 159,375 visible assigned
Unicode 17 characters. "Font bytes" are WOFF2 sizes; packs carry one third more as base64.

| Edition | Fonts | Guaranteed glyphs | Font bytes (WOFF2) | HTML estimate |
|---|---|---:|---:|---:|
| Standard (default) | Unifont 17.0.05, Unifont Upper 17.0.05, Last Resort 18.000 (full build), Adobe Blank 2 embedded | 77,874 (48.9%) + placeholders | 1,765,228 | `Unicode.html` 2,795,352 bytes (gzip 1,985,453) |
| Complete | Standard + packs: Jigmo2, Jigmo3 (2025-09-12), Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif Tangut | 154,164 (96.7%) | 19,191,092 | `unicode-explorer-complete-<app>.zip` 18.3 MB; packs 23.4 MB on disk, loaded per block |
| Complete + Hieroglyphs | Complete + UniHieroglyphica 19.000 pack | 159,230 (99.9%) | 25,577,428 | `unicode-explorer-complete-hieroglyphs-<app>.zip` 24.9 MB; packs 31.9 MB on disk |

Measured by `tools/fonts/buildPacks.ts` (2026-10-08) and recorded in `fonts/manifest.json`.

Remaining gap after Complete + Hieroglyphs: 145 Tangut characters added in Unicode 17 (115 in
Tangut Components Supplement, 22 in Tangut Supplement, 8 in Tangut) for which no font was
found. They show as Last Resort placeholders.

Every embedded font is under the SIL Open Font License or CC0. Code is MIT. The two stay
separate: `LICENSE` covers code; `fonts/manifest.json` and `THIRD_PARTY_LICENSES.md` cover
fonts. Full provenance (URL, version, SHA-256, license, measured coverage) is in
[`../fonts/manifest.json`](../fonts/manifest.json).

## Phases

Each phase starts with its plan checkpointed here, proceeds as small commits with terse
messages, and ends with the acceptance checks below passing.

### Phase 1: Governance

Findings: ARC-01, ARC-03, ARC-04, ARC-06, ARC-08, DOC-01.

- Re-propagate standards v2.2 with §0 mapped to this repository's real paths.
- Add `AGENTS.md`, `docs/ARCHITECTURE.md`, `README.md`, `LICENSE`, `CHANGELOG.md`.
- Record edition definitions and font provenance in `fonts/manifest.json`.
- Remove the unused Replit scaffold: mockup sandbox, OpenAPI client and schema generation,
  Drizzle/Postgres package, third-party agent skills. (The Express server was kept at the time
  and removed in Phase 2 once D-7 settled hosting.)
- Rewrite `replit.md` as a pointer to `AGENTS.md`.
- Record known standards exceptions in `.architecture-exceptions.json` with expiry at the
  end of Phase 3.

Acceptance: install, typecheck, and build pass; the rebuilt `Unicode.html` is byte-identical to
the baseline artifact (SHA-256 `50975b2609091ba74490c91ce6828bd9330e513240dd3c820082575e4c0c1679`).

Status 2026-10-08: delivered (commits `5e61669`..`058b20d`).

### Phase 2: Build integrity

Findings: BLD-01, BLD-02, BLD-03, BLD-04, SEC-01, SEC-03.

- Vendor the Unicode 17.0.0 UCD files the build needs under `data/ucd/17.0.0/` with a
  SHA-256 manifest; the build reads them offline and fails closed on any mismatch or
  missing file.
- `npm run build` = typecheck, standards lint, unit tests, bundle, minify, verify. Unit tests
  for name resolution (including algorithmic ranges and Hangul), visibility, reserved lookup,
  and the block list against the vendored UCD.
- `verify-build`: single file, no external URLs, no network or storage APIs, CSP present,
  fonts only as `data:` URLs, strict-XML parse, test-ID manifest coverage, gzip within 5% of
  the committed baseline.
- Playwright over `file://`: loads, zero non-`file:` requests, selects a block, copies.
- GitHub Actions: build and end-to-end jobs. Regeneration check for the committed artifact.
- `scripts/release.mjs` for the two version tracks (Q-7).

Acceptance: CI green on `main`; a deliberately broken UCD file fails the build.

Status 2026-10-08: delivered. Vendored UCD with hash verification; `npm run build` chain;
21 unit tests (every assigned code point's name checked against the UCD); verify-build with XML,
CSP, test-ID, and gzip checks; regeneration check; check-standards via TypeScript AST; 5 Playwright
tests over `file://`; GitHub Actions; `release.mjs`. Released as app 1.1.0.0 and data 1.0.0.0.
Also removed the Express server and Replit configuration (D-7) and flattened to one npm package.

### Phase 3: Module migration

Findings: ARC-02, BLD-05, BLD-06, SEC-02, ARC-05.

- Vite + `vite-plugin-singlefile` + TypeScript ES modules under the §0 target mapping.
  Extract misplaced logic before splitting files (standards §16.2).
- Replace LZString with `DecompressionStream("deflate-raw")` (measured: 273 KB embedded versus
  332 KB).
- Replace the regex minifiers with `html-minifier-terser`.
- URL-fragment state for selection, mode, font, and size.
- (Express server already removed in Phase 2 under D-7.)

Acceptance: behaviour parity with the Phase 2 end-to-end suite; gzip baseline recorded.

Status 2026-10-08: delivered. 59 source files across six layer roles, all passing the expanded
standards lint with zero exceptions; 33 unit tests and 7 end-to-end tests; artifact 365,040
bytes (gzip 239,926) versus 408,006 (275,829). Released as app 1.2.0.0. Also moved every code
literal table to `data/*.json` (closing EX-005 early) and added `role`/`aria-expanded` on
category headers.

### Phase 4: Glyph coverage

Findings: GLY-01 to GLY-06, DAT-02.

- Font fetch script (`tools/fetch-fonts.mjs`) that downloads manifest entries into a
  git-ignored cache and verifies SHA-256; converts TTF/OTF to WOFF2 where the upstream ships
  none; emits per-font `unicode-range` from the measured cmap intersected with assigned
  visible code points.
- Standard embedding in `Unicode.html`; pack generation (`unicode-fonts/manifest.js` plus one
  classic script per pack) and the two zip assets (D-10). On-demand pack loading keyed by
  selected block, with soft failure and a status note.
- Script-aware style stacks generated from a manifest, with `local()` sources.
- Glyph detection with Adobe Blank 2 as the terminal detection font; ink-box test for
  zero-advance marks; per-cell Last Resort application (D-6); per-block coverage readout.
- Combining marks on U+25CC; labelled dashed boxes for default-ignorable characters;
  visibility derived from Unicode properties at build time.
- CJK glyph-locale selector (`lang` on the output container).

Acceptance: measured coverage per edition matches the table above within the tolerance of
detection; Playwright asserts each edition loads its fonts with zero network requests.

Status 2026-10-08: delivered as app 2.0.0.0 / data 1.1.0.0, with two changes of plan recorded
as D-11 (full Last Resort build; the HE build renders nothing in Chromium), D-12 (detection
says verified/unverified, placeholders opt-in) and D-13 (pack attachment rule). Delivered:
`tools/fonts/` (fetch, pin, convert with wawoff2, measure with fontkit, embed, pack, zip);
Standard fonts vendored in `fonts/standard/` and reproducible from pinned upstream bytes;
`unicode-fonts/` packs and both zips built by `npm run build:packs` and attached by the
`release` workflow; on-demand loading per selected block with a status line and soft failure;
canvas glyph probe with Adobe Blank 2 (ink or advance), coverage per block and in the status
bar, placeholders toggle; marks on U+25CC; labelled boxes from `NameAliases.txt`
abbreviations or kind; visibility generated from General_Category, Default_Ignorable_Code_Point
and Prepended_Concatenation_Mark (DAT-02 closed; the hand list is gone); CJK locale selector;
About dialog with embedded font provenance and license texts; 137 device font families named
per script in `data/device-fonts.json`. Deferred: `local()`-composed script-aware stacks (Q-10).
Findings closed: GLY-01, GLY-02, GLY-04, GLY-05, DAT-02; GLY-03 partially (device fonts named;
stack order unchanged); GLY-06 stays open for Phase 5. Audited at
[Checkpoint 2](audit/checkpoint-2/report.md), which adds CP2-01 (probe cost scales with the
device-font list: all-blocks Grid is now 52 s) to Phase 5.

### Phase 5: Scale and accessibility

Findings: PRF-01, PRF-02, ACC-01 to ACC-03, UX-01, UX-02; from Checkpoint 2: CP2-01, GLY-06,
DAT-04, ARC-07 (ACC-04 closed in 1.2.0.0); GLY-03 via D-14; D-15, D-16.

- Style packs `serif` and `sans` from the Unicode Font Kit sources (D-14), in the Complete
  editions and the hosted test build; Bold/Italic toggles with on-demand styled faces (D-15);
  "CSS for this selection" dialog (D-16).

- Prune the probe stack at start-up: measure each `data/device-fonts.json` family once behind
  Adobe Blank and keep only the families present, so `--glyph-font` is short and detection costs
  about a second for everything (CP2-01).
- Windowed rendering of fixed-size cells; one delegated click handler; tooltips on hover; lazy
  per-block probing in idle chunks with cached coverage so headings fill in progressively.
- Keyboard grid with roving focus; focusable mode and font selectors (visually hidden, not
  `display:none`); keep focus in the grid on insert (UX-01); contrast fixes; minimum label size.
- Cells that grow to the glyph's width and a text/emoji presentation toggle (GLY-06); drop the
  duplicate "Ch" sort (UX-02); alias and code-point search from `src/data/abbreviations.json`
  (DAT-04); index `docs/tasks/` (ARC-07).

Acceptance: selecting all blocks renders in under 100 ms of main-thread time before the first
paint and detection finishes in the background; keyboard-only traversal reaches every control;
contrast ≥ 4.5:1 for text; Checkpoint 3 re-measures CP2-01 and PRF-01.

Status 2026-10-08: delivered as app 2.1.0.0 / data 1.2.0.0. Measured in sandbox Chromium: all
blocks show their first cells 216 ms after the click (80 ms of that is the render debounce;
52 s at 2.0.0.0), with about 1,200 of 159,375 cells built and 577 chunks pending; the
background scan finishes in 3.9 s (was 35 s inside the freeze) with identical counts; the
longest main-thread task is 57 ms. Keyboard: a skip button, focusable mode/font radios, one
tab stop for the output with arrow/Home/End navigation that builds pending chunks on demand,
Enter/Space insert without moving focus. Text contrast 6.0–6.4:1 on the panel. Search takes
names, all formal aliases, code points and literal characters. Cells grow to the glyph; emoji
presentation select. Style packs (D-14), Bold/Italic/No synthesis (D-15), CSS dialog (D-16).
Findings addressed: PRF-01, PRF-02 (re-render cost is now headings plus visible chunks),
ACC-01, ACC-02, ACC-03, UX-01, UX-02, GLY-06, DAT-04, ARC-07, CP2-01; GLY-03 via D-14.

### Phase 6: Unicode 18

Findings: DAT-01, DAT-03, DAT-05 (DAT-04 closed in 2.1.0.0). Checkpointed 2026-10-08 before the
build; Unicode 18.0.0 was released 2026-09-16 (172,808 characters, 7 new blocks).

Data (track `2.0.0.0-data`: new Unicode major):

- Vendor UCD 18.0.0 under `data/ucd/18.0.0/` with a SHA-256 manifest: the five files used today
  plus `DerivedName.txt`, `Scripts.txt`, `DerivedAge.txt` and `PropertyValueAliases.txt`.
- Block categories for the 7 new blocks in `data/block-categories.json`; the generator already
  fails on an uncategorised block.
- D-18 (DAT-03): algorithmic-name ranges come from the `PREFIX-*` lines of `DerivedName.txt`
  instead of the authored `data/algorithmic-names.json`, which is removed. Hangul stays NR1.
  A test checks every assigned code point's derived name against `DerivedName.txt`. Note:
  Table 4-8 and `DerivedName.txt` give `SMALL SEAL CHARACTER-`; the Seal section of chapter 18
  says `SEAL CHARACTER-`; the data files win.
- Per-character properties for D-19: General Category, Script, Age and decomposition as
  generated range/map tables, compressed like the name table; budget ≤ 60 KB in the artifact.

App (`2.2.0.0`):

- D-19 (DAT-05) character details. Options: (A) a details strip under the toolbar that follows
  keyboard focus and mouse hover, click still inserts; (B) a dialog opened by a details button
  or a modifier-click; (C) a tooltip. **Recommended: A** — no extra click, works with the
  Phase 5 keyboard model, and screen readers get it as a polite live region. Shows code point,
  name, aliases, block, General Category, Script, Age, decomposition (type and mapping, with
  names) and the cell's detection result.

Fonts:

- GNU Unifont and Unifont Upper 17.0.05 → 18.0.01 (Bengali Supplement, Musical Symbols
  Supplement, Miscellaneous Symbols and Arrows Extended, Latin Extended-G updates and more).
  Last Resort is already 18.000.
- Seal: LXGW Seal (OFL-1.1, alpha `v0.001-alpha.10.8`, 2026-10-08) as a Complete-edition
  `seal` pack if its measured coverage meets the D-13 rule; Kaiyuan Small Seal has no release
  yet. Jurchen and Archaic Cuneiform Numerals: no font with standard code points was found;
  Last Resort placeholders only, listed as gaps.
- Remeasure every font, pack, edition and `data/web-fonts.json` against Unicode 18.

Acceptance: 353 blocks; 172,808 characters counted from the UCD; every derived name matches
`DerivedName.txt`; regeneration check green; edition coverage remeasured and reported.

Status 2026-10-08: delivered as app 2.2.0.0 / data 2.0.0.0. 353 blocks; 172,808 characters
(312,389 assigned less 137,468 private use, 2,048 surrogates and 65 controls); all 172,808
names match `DerivedName.txt`; the name table shrank from 298.5 KB to 279.6 KB because prefix-range
names are no longer stored. Properties table 42 KB. Coverage of the 172,382 visible characters:
Standard 78,224 (45.4%), Complete 154,514 (89.6%), Complete + Hieroglyphs 159,580 (92.6%).
All blocks: first cells 206 ms, scan 4.5 s, longest task 61 ms.

Findings during the build:
- Unifont Upper 18.0.01 maps 1,329 fewer code points than 17.0.05: the 17.0.05 drafts for
  Jurchen (965) and Archaic Cuneiform Numerals (311) were withdrawn, and 51 Latin Extended-G and
  2 Tangut Supplement glyphs are gone. The drafts predate the final repertoire and are not
  restored.
- `tools/fonts/cacheFont.ts` trusted a cached file when a source was unpinned, which pinned the
  17.0.05 hash to the 18.0.01 URL on the first try. Fixed: an unpinned source always downloads.
- LXGW Seal alpha maps 511 of 11,328 Seal characters (4.5%), below the D-13 pack rule: recorded
  as a candidate in `fonts/manifest.json`, not shipped. No standard-code-point font was found for
  Jurchen or Archaic Cuneiform Numerals.
- Unicode 18 added U+05C8 and U+05C9 to Hebrew; no public web font in `data/web-fonts.json` has
  them yet, so the CSS dialog reports 183 of 185 for Basic Latin + Hebrew.

### Phase 7: Polish and upstream

From [Audit Checkpoint 3](audit/checkpoint-3/report.md). Findings: GLY-03, CP3-02, CP3-04,
CP3-08, CP3-01, CP2-04, CP3-07.

- Standard edition stacks (GLY-03): Latin, Greek and Cyrillic families before the CJK ones in
  `data/font-stacks.json`, and region-suffixed CJK names; e2e on a Latin cell's family order.
- Unifont regression (CP3-02): report upstream; meanwhile embed a subset of Unifont Upper 17.0.05
  holding only the 53 lost assigned characters, labelled in the manifest.
- Parse the web-font and alias tables on first use (CP3-04); label the CSS dialog size as before
  HTTP compression (CP3-08).
- Monthly font watch for Seal, Jurchen and Tangut (CP3-01, CP2-04); report the Seal naming
  erratum to Unicode (CP3-07).

Acceptance: Latin in Serif/Sans on Standard resolves to a Latin family first; Standard covers all
188 Latin Extended-G characters; warm start-up back to about 530 ms.

Status 2026-10-08: delivered as app 2.2.2.0 / data 2.0.2.0.

- GLY-03 fixed: every stack in `data/font-stacks.json` is Latin-first with region-suffixed CJK
  names, guarded by a data test that fails on the old file. Measured in the sandbox with the
  Standard edition: U+4E2D in Serif and Sans was drawn by embedded Unifont, because no listed CJK
  name matched an installed font; it is now drawn by Noto Serif CJK SC and Noto Sans CJK SC.
  Latin stays on Liberation Serif / Liberation Sans.
- CP3-02 reclassified: the 53 glyphs were Unicode 18 drafts withdrawn upstream, so nothing is
  restored. The Latin Extended-G acceptance item is dropped and tracked in #14.
- CP3-04 accepted: profiled. The 183 ms is the device-font presence test, the CP2-01 fix.
  Lazy table parsing measured no gain and was not kept.
- CP3-08 fixed: the CSS comment says "File size, before any HTTP compression".
- Font watch: `npm run report:gaps` writes `docs/coverage/missing-glyphs.{md,json}` (per
  edition, per block, code-point runs, Unicode version added; web-font gaps) and prints the
  change against the committed snapshot. Issues #10–#15 (label `font-gap`, milestone "Font
  watch 2027-01", due 2027-01-08), and a reminder for that date.
- CP3-07: an erratum report is drafted in `docs/upstream/unicode-18-seal-name-erratum.md`; it is
  submitted by the owner.
- Issue #15 (2.2.3.0 / data 2.0.3.0): all 226 Noto Regular faces at notofonts.github.io
  `578d18e1` (2026-10-09) measured against the web-font gap; 38 added to the CSS dialog
  (`data/web-font-extras.json`), +2,812 characters. Not added: Noto Fangsong KSS Rotated, whose
  Khitan glyphs are rotated for vertical layout (Noto Serif Khitan Small Script covers the same
  470); newer Noto Sans Symbols2 and Devanagari (+46), to avoid two versions of one family.
  1,876 web-only characters remain, mostly in blocks from Unicode 16–18 that Noto has not
  published yet. None of the 226 covers any of the 12,802 characters missing from every edition.
- 2.2.4.0 / data 2.0.4.0: Fairfax HD 2026.09.21 (Kreative Software, OFL), found while searching
  for the remaining web-only characters, maps all 51 Unicode 18 Latin Extended-G additions.
  An 11.5 KB subset is embedded after Unifont (#14 closed: 188 of 188 verified), and Fairfax HD
  plus Noto Emoji join the CSS dialog (+1,179; this also covers Hebrew U+05C8/05C9, closing CP3-03). The remaining 748 web-only characters in 29
  blocks (Tulu-Tigalari, Garay, Gurung Khema, Kirat Rai, Arabic Extended-C, Tai Yo, Tolong
  Siki, Beria Erfe, Musical Symbols Supplement, Ol Onal, Sidetic, …) are covered only by GNU
  Unifont 18. No public host serves Unifont 18 with CORS: unifoundry.com sends no CORS header;
  npm and GitHub mirrors stop at 13–15. Resolved by D-21 in 2.2.5.0: the dialog writes a
  commented self-host template for them.
- Owner observation 2026-10-09: U+1DF12 scales as a bitmap. Cause: in System mode, and in the
  Standard edition, it falls through to GNU Unifont (pixel squares). Charis, Andika and Doulos SIL
  have outline glyphs, but they load only as style packs for the Serif and Sans buttons in the
  Complete editions. Measured: of the 78,224 characters Unifont draws, 76,407 exist in an OFL
  or CC0 outline font (39,228 of them CJK or Hangul in the BMP); 1,817 are Unifont-only.
  Fairfax HD is pixel-style too. Tracked for Phase 8.

### Phase 8: Outline glyphs before bitmaps

Finding: issue #16 (owner observation: U+1DF12 scales as a bitmap). Checkpointed 2026-10-09
before the build. Measured with no device fonts helping: the Standard edition draws 78,275
visible characters with bitmap-style fonts (GNU Unifont, Fairfax HD); the Complete editions
draw 70,027; 67,201 of those exist in OFL or CC0 outline fonts, 42,318 of them CJK or Hangul.

- D-22, **"Drawn by" in the details strip**: the font family that draws the character,
  labelled outline or bitmap (`design: "bitmap"` in `fonts/manifest.json` for Unifont, Unifont
  Upper and Fairfax HD), or "system fallback (not identifiable)" (D-12). The probe tests the
  embedded and block-serving families in stack order.
- D-23, **outline packs in the Complete editions**: OFL outline fonts chosen by measured gain
  over the bitmap-drawn set (per-script Noto, Noto Symbols 2, Math, Music, Mono and others;
  about 159 fonts, 24,444 characters, ~7.5 MB before subsetting). Each font is subset (D-20) to
  the blocks where it adds glyphs, keeping whole blocks so shaping clusters stay in one font;
  fonts are grouped by block category into packs of at most 8 MiB. A pack attaches to the blocks
  it was chosen for; block packs already precede the embedded fonts in the stack.
- D-24, **Charis Latin subset embedded in Standard**: 26 Latin, IPA, phonetic, modifier,
  combining-mark and punctuation blocks, 209 KB WOFF2 (+~280 KB to `Unicode.html`), placed
  before Unifont. 1,853 characters, including U+1DF12, get outline glyphs when the device lacks them.
- Q-15, CJK and Hangul in outline (42,318 characters): a Noto Sans or Serif CJK subset is about
  16 MB, three or more packs. **Decided: deferred (D-25).** Desktop and mobile systems ship CJK
  fonts, so the bitmap fallback is rare there.

Status 2.3.0.0: D-22, D-23 and D-24 done. Without installed fonts, the Complete editions drew
68,360 characters with bitmap fonts after D-24. The outline packs replace 24,229 of them, which
leaves 44,131: 42,318 CJK/Hangul (Q-15) and about 1,800 that only Unifont or Fairfax HD cover.
U+1DF12 is drawn by Charis (CDP platform font); U+11103 and U+1D11E by pack fonts.

Audit Checkpoint 4 (2026-10-09, `docs/audit/checkpoint-4/report.md`) found that System mode
drew installed CJK and Hangul with Unifont, because the device-font list lacked their names
(CP4-01). Fixed in 2.3.1.0. The release guard (CP4-05) and `plan:outline --fetch` (CP4-06)
shipped in 2.3.1.1; CP2-07 is accepted browser behaviour (U+FFFC). Still open: the performance
review parked with #17 (CP4-03). Q-15 is deferred (D-25).

Acceptance: U+1DF12 is drawn by Charis in Standard (CDP platform font); the details strip names
the drawing font and says bitmap or outline; Complete bitmap-drawn count measured before and
after; no pack over 8 MiB; Audit Checkpoint 4 after the release.

### Phase 9 (future, not scheduled): Runtime font-source switch and CSS-panel behaviour

Planned 2026-10-09 at the owner's request; not started (#20). Revisit when CP4-03 is taken up.
The parts that only matter for a platform-specific app (the `online` source, its host, and
per-target defaults and storage) are in "Platform-specific apps" below. For the standalone
file the default stays `packs` where packs exist, saved in the URL fragment.

**Goal.** Start fast with the fonts inside the file, and let the user switch to the full font
set while the app runs. Measured at Checkpoint 4, all blocks take 0.38 s to first cells and
4.3 s to finish detection with the embedded fonts, against 1.65 s and 12.3 s with every pack
(CP4-03). Single-block start-up is the same in both, because packs already load per block.
The saving is in all-block views, memory and, for online fonts, download size.

**Font sources.** One new setting, `fontSource`, saved in the URL fragment like the others:

| Source | Fonts used | Available in |
|---|---|---|
| `embedded` | The fonts inside `Unicode.html` only; packs are not loaded even when present | Every edition and target |
| `packs` | Embedded fonts plus the sidecar packs, loaded per selected block (today's Complete behaviour) | Complete editions; native wrapper with bundled packs |
| `online` | Embedded fonts plus fonts fetched from the network at run time | Platform-specific apps and hosted builds only; never the standalone file. See "Platform-specific apps" |

**Mechanics.** On a switch the app:

1. Recomposes the stack (`composeFontStack` gains a source input).
2. Clears the probe caches (`setStack` already does).
3. Loads what the new source needs for the selected blocks.
4. Re-runs the background scan.
5. Redraws.

Packs that are already loaded stay registered but drop out of the stack, so switching back
is instant. Online faces are registered through the FontFace API with the measured
`unicode-range`s, loaded per selected block like packs, and awaited before detection. Any
font that fails to load is marked in the status line, and the app keeps drawing with the
embedded fonts, the same soft fail as a missing pack.

**Control.** A three-way "Fonts" selector in the controls bar ("Built-in", "Full (packs)",
"Full (online)"), with test ids in `scripts/testid-manifest.json`. Unavailable choices are
disabled with the reason as text: "No font packs beside this file", or "Online fonts are not
allowed in the standalone file". The About dialog's pack-status line shows the active source.

**CSS panel.** The generated CSS does not change with the source: it always uses public pinned
URLs and never this app's files (D-16), so another programmer gets the same answer in every
mode. New: one status line above the CSS saying what the app is drawing with now, and how that
compares for the selection:

- `online` (platform-specific apps only; Q-18): "The app is using these same web fonts" when the
  host is the public table.
- `embedded` / `packs`: "The app is drawing with its built-in fonts (or packs): N of M
  characters verified here; this CSS covers K." N is the probe's verified count; K comes from
  the web-font table.

The "Fonts on this device" form is unchanged in every mode.

**Standards.** The standalone target keeps zero runtime network (§17): its CSP stays
`font-src data:`, and `online` is compiled out. A native-wrapper or hosted build gets its own
CSP (`font-src data:` plus the chosen font host) and enables `online`. The build flag and the
target's rules go in `docs/CODING-STANDARDS.md` §17 before any online code lands.

**Work items:** the `fontSource` setting, reducer, hash key and tests; source-aware stack
composition (PURE) and tests; loader gating so `embedded` never injects pack scripts; online
FontFace registration behind the target flag; the selector with availability states and test
ids; the CSS-panel status line; re-scan on switch; About status.

**Acceptance:**

- Switching sources changes verified counts as expected on the e2e packs fixture: the test pack
  is unverified in `embedded` and verified in `packs`.
- `embedded` loads no pack script (network and script trace).
- The source survives a reload via the fragment.
- The standalone build contains no online code (grep plus CSP check).
- The CSS text is byte-identical across sources; only the status line differs.
- All-blocks timings are re-measured per source with `measure-checkpoint-4.cjs`.

**Size and version.** About 300–500 lines with tests. App MAJORFIX bump (a new user-facing
setting); no data change unless Q-18 option A adds a published-pack URL to the manifest.

### Phase 10: Rendering and style correctness

Checkpointed 2026-10-09 before the build. Runs before Phase 9. Every audit so far measured
whether a character draws; this phase measures whether it draws **correctly**: marks attached to
their base, complex-script shaping, emoji sequences, Hangul composition, and real versus
synthesized bold and italic. The project instructions keep these separate from code-point
coverage.

**Test environment.** A "minimal device" Chromium with one Latin font (fontconfig pointed at a
directory holding Liberation Sans) is the main fixture, because installed fonts hide pack
behaviour. The sandbox's full font set stays the "rich device" comparison.

**Found while planning (R-0).** The app shows each combining mark on U+25CC DOTTED CIRCLE.
Browsers choose one font for the whole cluster, so the circle and the mark must come from the
same font. 158 of the 159 outline fonts and the Charis Latin subset were cut down to their own
blocks and lost U+25CC. On the minimal device:

- Chakma U+11127 (Complete) renders as two empty boxes.
- Devanagari U+0941 and Latin U+0301 render with bitmap Unifont, although outline fonts have
  them.

The probe tests the mark alone, so it reports them as verified. Evidence:
`docs/audit/rendering/evidence/dotted-circle-before.png`.

Work items, in order:

- **R-0, keep U+25CC (and U+00A0) in every subset font** (outline packs, Charis Latin, block
  packs). HarfBuzz also uses U+25CC for broken clusters. Probe cells that show a mark as
  `◌+mark`, so detection matches what is drawn.
- **R-1, shaping parity for subset fonts:** shape a per-script corpus with the full and the
  subset font (HarfBuzz) and compare glyph IDs, clusters and advances. A `verify:shaping`
  check runs in CI over every subset font.
- **R-2, marks census:** for every combining mark, measure on both devices whether
  `◌+mark` draws from one font with zero added advance. Report by block.
- **R-3, script samples:** one short real-text sample per script (Arabic joining, Indic
  conjuncts, Thai, Myanmar, Khmer, Tibetan, Mongolian, Hebrew points). Check the sample is
  drawn by one font in each edition, and keep a rendered sheet as evidence.
- **R-4, emoji sequences:** ZWJ sequences, flags, keycaps, skin tones and VS15/VS16 in plain
  mode and the compose pad. Check each shows as one glyph where an emoji font exists, and that
  the presentation control (GLY-06) applies.
- **R-5, Hangul:** precomposed syllables against conjoining jamo L+V+T sequences, per edition.
- **R-6, style faces:** per style pack, count characters with genuine Bold, Italic and Bold
  Italic faces against those left to synthesis or upright (D-15).

Status 2.3.2.0: **R-0 done.** D-26 keeps U+25CC/U+00A0 in every subset, and D-27 gives Unifont
Upper the circle. The probe verifies a mark only when one listed family has both the mark and
U+25CC, in two tiers so the scan time is unchanged (minimal device, all blocks, Complete: 8.2 s).
On the minimal device, U+11127, U+0941 and U+0301 draw from one outline font with the circle,
and the 113 supplementary-plane marks only Unifont Upper covers (Garay, Tulu-Tigalari, Gurung
Khema and others) no longer show as two boxes. Verified counts are unchanged; before, those
marks were counted while drawn as boxes. Evidence: `docs/audit/rendering/evidence/`.

Status 2.3.3.0: **Phase 10 complete.** R-1 to R-6 were measured, and the report is
`docs/audit/rendering/report.md` (RND-01 to RND-13). Fixes:

- subsets keep U+0020 and canonical decompositions;
- `verify:shaping` runs in the release workflow;
- one owner per block in `plan:outline` (Noto Sans Math no longer draws Arabic);
- embedded outline fonts precede the packs (D-28);
- the Charis subset adds the Cyrillic blocks (and 23 Greek characters; see "Next build" for Greek).

**Phase 10 closed 2026-10-10** (issue #22). RND-08 (emoji sequences) is parked outside any
phase: see "Parked" (Q-19, #23).


Deliverables: `docs/audit/rendering/report.md` with findings `RND-*`, fixes for anything
broken, and the `verify:shaping` check. Acceptance: on the minimal device, U+11127, U+0941 and
U+0301 draw from one outline font with the circle; `verify:shaping` passes in CI; every
`RND-*` finding is closed, accepted or tracked.

## Next build (on hold)

Agreed 2026-10-10; not started. When the next build begins:

1. **Bare-device tests (do not forget).** Turn the Phase 10 evidence scripts into e2e tests
   that run in CI with a one-font fontconfig: `docs/audit/rendering/evidence/marks-census.cjs`
   (no mark split across fonts) and `script-samples.cjs` (each sample drawn by one font; Arabic
   from Noto Naskh Arabic, Latin marks from Charis). Tracked as #24.
2. **Polytonic Greek in Standard (measured 2026-10-10).** Charis has only 23 of the 368 visible
   Greek characters and none of Greek Extended, so 345 Greek characters fall to bitmap Unifont on
   devices without a Greek font. The 2.3.3.0 "Charis adds Greek and Cyrillic" change added almost
   only Cyrillic. Option: embed a Noto Serif subset of Greek and Coptic plus Greek Extended:
   27.8 KB WOFF2 (~36 KB in `Unicode.html`), covering 354 of 368, including all 233 polytonic
   characters. It would own both Greek blocks; the Greek blocks come out of the Charis subset so
   a word isn't split between two fonts. Noto Sans is 25.4 KB with the same coverage.
   **Recommended: Noto Serif**, to match Charis.
3. **Audit Checkpoint 5 as part of the build.** Re-measure on both devices (minimal and rich),
   fold the Phase 10 measures into the standard set, and re-examine every open finding.

## Parked (outside any phase)

Items deliberately not part of any phase definition. Revisit only on a trigger.

- **Q-19 / RND-08 / #23: emoji sequences without an emoji font.** Parked 2026-10-10.

  Many emoji are sequences of several code points that an emoji font joins into one picture:

  - ZWJ sequences, for example 👩‍💻 = U+1F469 U+200D U+1F4BB;
  - flags (two regional indicators);
  - keycaps (digit U+FE0F U+20E3);
  - skin tones (emoji + modifier).

  With an emoji font installed (Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji), all of
  them draw as one glyph in both editions. On a device without one, which in testing meant a
  one-font Linux fixture, they fall apart into their components drawn by Unifont: 👩‍💻 shows
  as a woman, an invisible joiner and a laptop. No embedded font or pack joins them. This
  affects plain mode, the compose pad and the CSS dialog's preview; single-code-point emoji
  cells are unaffected.

  Q-19, options:

  - (A) Add a pack with the monochrome Noto Emoji variable font (OFL, already pinned for the
    CSS dialog at google/fonts `51303ca9`). Measured: 1.0 MB WOFF2, 1,489 code points, and 4 of 6
    test sequences joined as one glyph (woman technologist, US flag, skin tone, family; the
    rainbow flag and keycap 1 did not). Outline, no colour, within the 8 MiB limit.
  - (B) A colour emoji font pack (Noto Color Emoji, COLRv1). Not measured; several megabytes;
    colour rendering support varies by browser.
  - (C) Accept. Every major desktop and mobile system ships a colour emoji font, as with CJK
    (D-25).

  **Recommended: C**, and A if bare-device emoji matter, for example for a platform-specific
  app (see "Platform-specific apps").

- **#25: whether to keep emoji-specific support at all.** Owner view (2026-10-10): emoji are the
  least important part of the app, because every environment that uses them has its own picker.
  The issue lists what emoji support consists of (presentation control, device emoji fonts, Noto
  Emoji in the CSS table, Q-19) and the options. Initial lean: decide per target, dropping
  emoji-only features from the web app while keeping the characters. Supersedes Q-19 if
  emoji-only features go.
- **#17 / CP4-03: start-up and all-blocks speed.** Parked as optional for a later review.

## Platform-specific apps (not scheduled)

Relevant only if and when a platform-specific app is built, for example an iOS app that hosts
this web app in a web view. Collected 2026-10-10 from the owner's iOS questions and Phase 9.

- **Packaging.** Bundle the Complete + Hieroglyphs folder (`Unicode.html` + `unicode-fonts/`,
  ~35 MB) in the app. Serve it through a custom URL scheme handler rather than `file://`, so
  the CSP's `'self'` works in WebKit. Packs load as classic scripts, so no other change is
  needed.
- **Checks before building:**
  - the minimum OS version (the name table needs `DecompressionStream`; believed iOS 16.4,
    unverified);
  - canvas glyph detection in WebKit;
  - App Store review of web-wrapper apps (guideline 4.2).
- **Rules first.** The target's rules (CSP with a font host, build flag that enables `online`,
  platform storage) go in `docs/CODING-STANDARDS.md` §17 before any code.
- **The `online` font source** (from Phase 9): embedded fonts plus fonts fetched at run time,
  registered through the FontFace API with measured `unicode-range`s and loaded per block,
  soft-failing to the embedded fonts.

**Open questions (options; recommendations in bold):**

- Q-16, default source.
  - (A) `packs` wherever packs exist, as today, with `embedded` as the opt-in fast mode.
  - (B) `embedded` everywhere, with full fonts opt-in.
  - (C) Per target: `packs` for the standalone Complete zips; `embedded` for a native or hosted
    build, with `online` one tap away.
  - **Recommend C.** It doesn't change what Complete users downloaded the packs for, and gives
    the iOS app the quick start the owner described.
- Q-17, the "switch" after the first switch.
  - (A) Per session only.
  - (B) **Saved in the URL fragment, like every other setting.**
  - (C) Platform storage in a native wrapper.
  - **Recommend B**, with C added only in the native target.
- Q-18, source of `online` fonts.
  - (A) **This project's own packs, published per release** (GitHub Pages or release assets):
    the same bytes and coverage as `packs` (159,631 in Complete + Hieroglyphs), versioned with
    the app. D-16 governs the CSS panel, not the app's own downloads.
  - (B) The public web-font table: 158,883 characters, no hosting, but different fonts from
    `packs`.
  - **Recommend A** for the app, while the CSS panel keeps using B.

- Q-19 option A (a monochrome Noto Emoji pack) becomes worth it if the app must show emoji
  sequences on devices without an emoji font.
- #25: emoji may matter more to a ChromeOS or iOS app than to the web app; decide there.

## Out of scope

- Hieroglyph-specific features (format controls, quadrat layout). See D-4.
- Hosting changes before Q-6 is decided.
- Any change to the standards text itself; amendments go to the wiki first.
