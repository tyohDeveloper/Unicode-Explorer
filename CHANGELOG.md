# Changelog

App releases. The data track (Unicode Character Database snapshot plus font manifest) is
versioned independently; see `docs/PLAN.md` Q-7.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are four-part,
`MAJOR.MAJORFIX.MINORFIX.SPELLING`, and are **not** semver — see
[`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) §12.

## [Unreleased]

## [2.2.2.0] — 2026-10-08

Phase 7 of `docs/PLAN.md`.

### Fixed

- **Built-in font lists** (GLY-03): Latin, Greek and Cyrillic families now come before CJK
  families in every Serif, Sans, Mono, Cursive, Fantasy and FangSong list, and the CJK names are
  real region-suffixed families (`Noto Serif CJK SC`…). In the Standard edition, Latin no longer
  picks up a CJK font's Latin, and CJK ideographs reach installed CJK fonts instead of the
  embedded Unifont bitmaps.
- The CSS dialog's size comment says the size is before HTTP compression (CP3-08).

### Added

- `npm run report:gaps`: missing-glyph report per edition and block
  (`docs/coverage/missing-glyphs.md`), compared against the previous snapshot on each run.

## [2.2.1.0] — 2026-10-08

### Fixed

- **Large font packs on web hosts** (D-20): the 17.3 MB CJK Extension B–F pack could not load
  from the hosted test build, whose host redirects large files to another origin that the CSP
  blocks. It is now three packs (Extension B parts 1 and 2, and Extensions C–F, I with the
  Compatibility Supplement; 5.4–6.3 MB each), registered as one family with `unicode-range`s.
  The Egyptian pack drops the font's private-use glyphs: 8.5 → 4.5 MB. No pack exceeds 8 MiB,
  and the build enforces it. Coverage is unchanged.

## [2.2.0.0] — 2026-10-08

Unicode 18.0 (Phase 6 of `docs/PLAN.md`); data 2.0.0.0. `Unicode.html` is 2,940,287 bytes
(gzip 2,054,019).

### Added

- **Unicode 18.0.0**: 353 blocks and 172,808 characters, including Seal (11,328), Jurchen and
  Jurchen Radicals, Archaic Cuneiform Numerals, Bengali Supplement, Musical Symbols Supplement and
  Miscellaneous Symbols and Arrows Extended (DAT-01).
- **Character details** strip (D-19, DAT-05): name, aliases, block, General Category, Script,
  Age, decomposition and the detection result for the character under the pointer or keyboard
  focus. Announced politely for keyboard focus only.

### Changed

- Character names for prefix ranges (`SMALL SEAL CHARACTER-3D000`, `JURCHEN CHARACTER-18E00`,
  CJK, Tangut, Khitan, Nushu, Egyptian Extended-A, CJK compatibility) are derived from
  `DerivedName.txt` instead of an authored table (D-18, DAT-03).
- GNU Unifont and Unifont Upper 18.0.01. Coverage of the 172,382 visible characters: Standard
  78,224 (45.4%), Complete 154,514 (89.6%), Complete + Hieroglyphs 159,580 (92.6%); the new Seal
  and Jurchen scripts have no free font yet and show Last Resort placeholders.

### Fixed

- `fetch:fonts` no longer pins a cached old file to a new, unpinned source URL.

## [2.1.0.0] — 2026-10-08

Scale and accessibility (Phase 5 of `docs/PLAN.md`), plus style packs and the CSS dialog.
`Unicode.html` is 2,914,679 bytes (gzip 2,027,955).

### Added

- **Serif and Sans style packs** (D-14): the Unicode Font Kit's serif stack (Charis 7.000,
  Noto Serif, Doulos SIL, Noto Naskh Arabic, Noto Serif Hebrew/Devanagari/Bengali/Thai) and
  sans stack (Andika 7.000, Noto Sans and its script faces), plus a shared Noto Symbols,
  Symbols 2 and Math pack, load when Serif or Sans is chosen and go first in the stack. In the
  Complete editions and the hosted build; OFL fonts only (D-17).
- **Bold, Italic and No synthesis** toggles (D-15; `bold=1`, `italic=1`, `nosynth=1`). Genuine
  bold, italic and bold-italic faces load with `serif-styles`/`sans-styles` only when a toggle is
  on; other scripts get the browser's synthesised styles unless No synthesis is on.
- **CSS for selection** dialog (D-16): copyable CSS for another programmer's app. The web-font
  form chooses fonts from pinned, CORS-enabled public URLs for the selected blocks and reports
  coverage and download size; the no-download form names fonts found on this device.
- **Search** by formal alias (all 481 from `NameAliases.txt`: NBSP, ZWJ, corrections…), code
  point (`U+2603`, `0x2603`, `2603`) or the character itself (DAT-04).
- **Keyboard access**: "Skip to characters" first tab stop; mode and font selectors focusable
  (ACC-01); the output is one tab stop with arrow keys, Home/End per block, Enter/Space to
  insert (ACC-02); inserting no longer moves focus to the composition pad (UX-01).
- **Emoji presentation** select (Default/Text/Colour; `e=`), and cells that grow to the
  glyph's width (GLY-06).
- `docs/tasks/README.md` indexing the 70 historical task files (ARC-07).

### Changed

- **All blocks in about 0.2 s** instead of 52 s (PRF-01): headings and sized placeholders paint
  first and 512-character chunks are built as they near the viewport; one delegated handler
  replaces per-cell listeners; re-rendering costs only headings and visible chunks (PRF-02).
- **Detection runs in the background** in idle slices and fills block headings and the status
  bar as it goes ("checking glyphs…"); full scan 3.9 s with identical results (CP2-01). The
  probe tests the embedded fonts first, then only the families that render samples of the
  character's block, and absent device families are pruned from the font stack.
- Accent text colour #5aabff and dimmed text #a0a0ae: 6.0–6.4:1 on the panel (ACC-03).
- "Copy output" copies every character of the output, not only those currently built.
- Table headers are buttons with `aria-sort`; "Ch" is no longer a sort key (UX-02).

## [2.0.0.0] — 2026-10-08
## [2.0.0.0] — 2026-10-08

Glyph coverage (Phase 4 of `docs/PLAN.md`): the first edition that carries its own fonts. The
Standard `Unicode.html` is 2,795,352 bytes (gzip 1,985,453); 1.77 MB of that is fonts.

### Added

- **Embedded fonts.** GNU Unifont 17.0.05 and Unifont Upper (OFL) give every visible Basic
  Multilingual Plane character and 77,874 characters overall a glyph on any device; Last Resort
  18.000 (OFL) supplies a block-naming placeholder; Adobe Blank 2 (OFL) is the detection font.
  Each is a `data:` URL with a measured `unicode-range`; license texts ship in the About dialog.
- **Glyph detection and coverage readout.** A canvas probe checks each character against the
  font list in use. The status bar and block headings report verified and unverified counts;
  unverified cells are outlined. A **Placeholders** toggle (`p=1` in the hash) draws Last Resort
  symbols for them (audit GLY-01, GLY-02, GLY-05).
- **Sidecar font packs** (ADR-0001): `unicode-fonts/manifest.js` plus one classic script per
  pack, loaded only when a selected block needs one, with a status line and soft failure when the
  directory is absent. Two release assets: `unicode-explorer-complete-<version>.zip` (Jigmo2,
  Jigmo3, Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif
  Tangut; 154,164 characters, 96.7%) and `unicode-explorer-complete-hieroglyphs-<version>.zip`
  (adds UniHieroglyphica; 159,230, 99.9%), built and attached by the new `release` workflow.
- **Device fonts named per script.** 137 families (Windows, Apple, Noto) follow the style stack
  so detection credits them and the browser prefers them to the embedded bitmaps (GLY-03, part).
- **Combining marks** are drawn on a dotted circle (U+25CC) and still insert bare (GLY-04).
- **Labelled boxes** for non-visible characters when "Include non-visible" is on: the Unicode
  abbreviation (NUL, SHY, ZWJ, VS16…) or a kind label (CTRL, FMT, PUA, SURR, SEP, IGN, NCHR) (GLY-04).
  GLY-06 (fixed cell size, emoji presentation) remains open for Phase 5; an earlier version of
  this entry listed it as closed (see `docs/audit/checkpoint-2/report.md`).
- **CJK locale selector** (Auto, zh-Hans, zh-Hant, zh-HK, ja, ko, vi) sets `lang` on the output
  for locale-specific ideograph forms; `l=` in the hash.
- **About dialog**: versions, embedded fonts with version, license and visible-glyph counts,
  font-pack status, license texts.
- Tooling: `npm run fetch:fonts` (download, pin SHA-256, extract, convert to WOFF2 with wawoff2,
  measure with fontkit), `npm run build:packs` (packs, catalogues, zips, measured coverage
  written back to `fonts/manifest.json`), `generate:fonts-css` inside `build:bundle`.

### Changed

- **Visibility is derived from Unicode properties** (General_Category, Default_Ignorable_Code_Point,
  Prepended_Concatenation_Mark, noncharacters) generated from the vendored UCD; the
  hand-maintained range list is gone. Soft hyphen, CGJ, Hangul fillers, Mongolian vowel
  separator, line/paragraph separators, Egyptian format controls and musical format characters
  are now hidden by default; prepended concatenation marks (U+0600…) stay visible (DAT-02).
- Changing the glyph font re-renders the output so detection follows the new stack.
- The placeholder font is the full Last Resort build, not the "HE" build the audit chose: the HE
  cmap (format 13) yields no glyphs in Chromium (PLAN D-11).
- `verify:build` now rejects external *resource* loads (`src`, stylesheet `href`, CSS `url()`,
  `@import`) rather than any URL-shaped text, so license notices and links may appear.
- Early Dynastic Cuneiform moved from "Other Scripts & Supplements" to "Ancient & Historic
  Scripts" in the sidebar.

### Known limits

- Detection cannot observe system font fallback. An unverified character may still render
  correctly on your device; it is reported, not replaced, unless Placeholders is on (PLAN D-12).
- 145 Tangut characters added in Unicode 17 have no glyph in any shipped or candidate font.
- Script-aware `local()` composition of style stacks is deferred (PLAN Q-10).

## [1.2.0.0] — 2026-10-08

Module migration (Phase 3 of `docs/PLAN.md`). Behaviour matches 1.1.0.0 except where noted;
every Phase 2 end-to-end test still passes. Size 365,040 bytes (gzip 239,926) versus 408,006
(275,829).

### Added

- URL-fragment state: selected blocks (by start code point), display mode, font, size, the
  non-visible toggle, and the name filter round-trip through `location.hash`, so a bookmark keeps
  them. Nothing is stored on the device.
- Test IDs on every interactive element, keyed by domain value (`checkbox-sidebar-block-0041`,
  `button-grid-cell-1F600`, `button-sidebar-category-cyrillic`, `button-table-sort-name`).
- Category headers carry `role="button"` and `aria-expanded`; the status bar is a live region.
- `npm run generate:data`; `npm run dev` / `npm run preview` (Vite on `0.0.0.0:5000`).

### Changed

- Source is TypeScript ES modules under `src/` by layer (PURE-CORE, PURE, STATE, CONTROLLER,
  VIEW), built by Vite and `vite-plugin-singlefile`, minified by esbuild and
  `html-minifier-terser`. The concatenated `unicode-src/` scripts and the custom assembler are
  gone.
- The character-name table is raw DEFLATE unpacked by the browser's `DecompressionStream`;
  the LZString runtime library is no longer shipped. Requires Chrome/Edge 103+, Firefox 113+,
  Safari 16.4+.
- Every table that was a literal in code is now data: `data/block-categories.json`,
  `data/algorithmic-names.json`, `data/hangul-jamo.json`, `data/non-visible-ranges.json`,
  `data/category-labels.json`, `data/font-stacks.json`. `src/data/*.json` is generated from
  the UCD and regeneration-checked in CI.
- Table "Name" sorting uses code-unit order instead of the device locale, so the order is the
  same everywhere (audit UX-02).
- Font selector buttons are built from data at start-up.
- `check:standards` now also enforces purity (§1.4), one export per PURE file (§3.2), and no
  barrel files (§3.9); all five pre-standards exceptions are retired.

### Removed

- `lz-string` from the artifact; `terser` and the pnpm leftovers from the toolchain.

## [1.1.0.0] — 2026-10-08

Hardening release. The application behaves as in 1.0.0.0; the artifact, build, and repository
change around it. Size 408,006 bytes (gzip 275,829) versus 406,485 (276,347).

### Added

- Content-Security-Policy meta: `default-src 'none'`, `connect-src 'none'`, fonts and images
  from `data:` only, inline script and style only, sibling scripts (`'self'`) for the planned
  font packs (ADR-0001).
- 28 `data-testid` attributes on static controls, listed in `scripts/testid-manifest.json`.
- Build-time version stamping: header shows the app version; a `generator` meta carries app and
  data versions; the Unicode version and block count come from the data, not the template.
- Build chain `npm run build` = typecheck → standards lint → unit tests → bundle → verify, plus
  `verify:regenerated`, Playwright smoke tests over `file://`, and GitHub Actions running both.
- Vendored Unicode 17.0.0 data with SHA-256 verification; the build no longer touches the network
  and fails instead of writing a degraded file.
- `scripts/release.mjs` for the `app` and `data` tracks; `data/CHANGELOG.md` for the data track.

- `docs/PLAN.md`: plan of record with decisions, open questions, edition definitions, and six
  phases; `docs/adr/0001-sidecar-font-packs.md`.
- `docs/audit/checkpoint-1/`: audit report, 37-finding register, and evidence scripts
  (baseline commit `e7ad733`).
- `docs/ARCHITECTURE.md`, `AGENTS.md`, `LICENSE` (MIT), `THIRD_PARTY_LICENSES.md`,
  `fonts/manifest.json`, `.architecture-exceptions.json`.

### Changed

- `docs/CODING-STANDARDS.md`: re-propagated v2.2 text with §0 mapped to `unicode-src/` and
  four-part versioning in §12.
- `replit.md` reduced to a pointer at `AGENTS.md`.

- Script and style bodies are CDATA-wrapped and the markup is strict-XML well-formed (polyglot
  contract); boolean attributes in long form.
- Single npm package (`package-lock.json`) replacing the pnpm workspace.

### Removed

- Unused Replit scaffold: mockup sandbox, OpenAPI client and schema generation, Drizzle
  database package, third-party agent skills, the Express server, and Replit configuration.
  Hosting is unassigned for now (PLAN.md D-7).

## [1.0.0.0] — 2026-08-16

Baseline. Unicode 17.0, 346 blocks, five display modes, composition pad, name filter, eight font
stacks, 397 KiB single file. Tagged `v1.0.0.0`.
