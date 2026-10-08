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
| D-1 | **Standard** edition is the default artifact. It embeds GNU Unifont, Unifont Upper, and Last Resort HE. | Guarantees every visible Basic Multilingual Plane character (77,874 code points, 48.9% of all visible Unicode 17 characters) and eliminates anonymous boxes, at about 2.4 MiB. |
| D-2 | **Complete** edition is a release asset, not the default (packaging superseded by D-10). It adds Jigmo2, Jigmo3, Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, and Noto Serif Tangut. | 154,164 code points (96.7%), about 24.7 MiB. Too large for routine use or Git history; right as a tagged download. |
| D-3 | **Complete + Hieroglyphs** edition is a second release asset (packaging superseded by D-10). It is Complete plus UniHieroglyphica. | 159,230 code points (99.9%), about 32.9 MiB. UniHieroglyphica covers the whole Egyptian repertoire, basic block and Extended-A (5,066 characters), in one OFL font. |
| D-4 | No Egyptian-hieroglyph font ships in Standard or Complete, and no hieroglyph-specific feature is built. Candidate fonts (NewGardiner, Noto Sans Egyptian Hieroglyphs) are recorded in `fonts/manifest.json` as side assets for possible later inclusion. | Owner decision, 2026-10-08. |
| D-5 | Phases run in the order below. Phase 1 (governance) and Phase 2 (build integrity) precede any change to application behaviour. | Low risk first; every later phase runs through the checks Phase 2 adds. |
| D-7 | No hosting at present. Replit (or an equivalent) may return later; when it does, use the history-and-prehistory pattern (`vite dev`/`vite preview` on `0.0.0.0:5000`), not an Express server. The server and Replit configuration are removed in Phase 2. | Owner note, 2026-10-08. Resolves Q-6. |
| D-8 | Four-part numbers are driven by the size of semantic change but carry no meaning themselves. Meaning lives in `CHANGELOG.md`, annotated tags, comments, and the README. `scripts/release.mjs` refuses to tag a version that has no CHANGELOG section and writes that section into the tag message. | Owner note, 2026-10-08. Resolves Q-9: the two derived copies differ only in wording; no wiki change required beyond adopting the four-part text. |
| D-9 | The built `Unicode.html` stays committed at the repository root, verified against source by a regeneration check in CI. Release assets are attached in addition. | Resolves Q-5. Keeps the "open the file from GitHub" path working while CI guarantees the copy is honest. |
| D-10 | **Sidecar font packs with soft failure** ([ADR-0001](adr/0001-sidecar-font-packs.md)). `Unicode.html` stays Standard and self-contained. Complete fonts ship as a sibling `unicode-fonts/` directory of classic-script packs loaded on demand per selected block; absent packs degrade to Standard with a status note. Release assets become `Unicode.html`, `Unicode-Explorer-Complete.zip`, and `Unicode-Explorer-Complete-Hieroglyphs.zip`. Supersedes the single-file packaging of D-2 and D-3; fonts and licenses unchanged. | Owner decision, 2026-10-08, after the Chromium `file://` and HTTP measurements in the ADR. |
| D-6 | Last Resort is never placed in the global font stack. It is applied per cell, by detection, to characters the device and embedded fonts cannot render. | A font covering every code point anywhere in a `font-family` list stops the browser from reaching device fonts that are not named. Per-cell application keeps device fallback and still shows a block placeholder. |

### Open

| ID | Decision | Recommendation |
|---|---|---|
| Q-4 | Upgrade to Unicode 18 before or after the module migration | After Phase 2, so the upgrade runs through regeneration and verification checks. |
| Q-7 | Data-track versioning | One data track covering the Unicode Character Database snapshot and the font manifest. Tag the current Unicode 17 build `1.0.0.0-data`; the Unicode 18 upgrade is `2.0.0.0-data`. |
| Q-8 | Jigmo (the Basic Multilingual Plane file, 7.1 MiB) in Complete | Exclude. Unifont already covers those code points, and most devices have outline CJK fonts for the BMP. Revisit if detection shows BMP CJK falling through to Unifont on target devices. |

## Editions

All three editions build from the same source. Standard fonts embed in the HTML as
`data:font/woff2;base64` with measured `unicode-range` descriptors; Complete fonts ship as
sidecar packs under `unicode-fonts/` (D-10). Measured against the 159,375 visible assigned
Unicode 17 characters. "Font bytes" are WOFF2 sizes; packs carry one third more as base64.

| Edition | Fonts | Guaranteed glyphs | Font bytes (WOFF2) | HTML estimate |
|---|---|---:|---:|---:|
| Standard (default) | Unifont 17.0.05, Unifont Upper 17.0.05, Last Resort HE 18.000 embedded | 77,874 (48.9%) + placeholders | 1,621,300 | `Unicode.html` ~2.4 MiB |
| Complete | Standard + packs: Jigmo2, Jigmo3 (2025-09-12), Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif Tangut | 154,164 (96.7%) | 19,152,512 | zip; packs ~23 MiB, loaded per block |
| Complete + Hieroglyphs | Complete + UniHieroglyphica 19.000 pack | 159,230 (99.9%) | 25,537,076 | zip; packs ~32 MiB, loaded per block |

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

### Phase 5: Scale and accessibility

Findings: PRF-01, PRF-02, ACC-01 to ACC-04, UX-01, UX-02.

- Windowed rendering of fixed-size cells; one delegated click handler; tooltips on hover.
- Keyboard grid with roving focus; focusable mode and font selectors; `aria-expanded`
  category headers; live status region; contrast fixes; minimum label size.

Acceptance: selecting all blocks renders in under 100 ms of main-thread time; keyboard-only
traversal reaches every control; contrast ≥ 4.5:1 for text.

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
