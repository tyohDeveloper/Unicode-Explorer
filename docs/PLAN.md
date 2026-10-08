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
DAT-04, ARC-07 (ACC-04 closed in 1.2.0.0).

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

### Phase 6: Unicode 18

Findings: DAT-01, DAT-03, DAT-04, DAT-05.

- Generate the block list and algorithmic-name ranges from the UCD plus a committed
  category-assignment file. Vendor UCD 18.0.0. Data release `2.0.0.0-data`.
- Name aliases, code-point and literal-character search, per-character properties (General
  Category, Script, Age).
- Remeasure coverage; add gap fonts for Seal and Jurchen as they become available.

Acceptance: 353 blocks; 172,808 characters; regeneration check green.

## Out of scope

- Hieroglyph-specific features (format controls, quadrat layout). See D-4.
- Hosting changes before Q-6 is decided.
- Any change to the standards text itself; amendments go to the wiki first.
