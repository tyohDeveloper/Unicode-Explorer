# Data changelog

The data track covers the vendored Unicode Character Database snapshot and `fonts/manifest.json`.
It is versioned independently of the app (`docs/PLAN.md` Q-7; four-part, not semver). Tags are
`<version>-data`.

## [2.0.0.0] — 2026-10-08

Unicode 18.0.0 (MAJOR: new Unicode version).

### Changed

- `data/ucd/18.0.0/` replaces `data/ucd/17.0.0/`, adding `DerivedName.txt`, `Scripts.txt`,
  `DerivedAge.txt` and `PropertyValueAliases.txt` to the vendored files (SHA-256 manifest).
- `data/block-categories.json`: the 7 new blocks.
- `src/data/names.json` stores only names outside the `DerivedName.txt` prefix ranges
  (35,351 names, 279.6 KB).
- `fonts/manifest.json`: Unifont 18.0.01, all fonts re-measured against Unicode 18; LXGW Seal
  (alpha) recorded as a candidate. `data/web-fonts.json` re-measured.

### Added

- `src/data/algorithmic-names.json` generated from `DerivedName.txt` (D-18); the authored
  `data/algorithmic-names.json` is removed.
- `src/data/properties.json`: General Category, Script, Age and decompositions for the details
  strip (D-19), 42 KB compressed.

## [1.2.0.0] — 2026-10-08

### Added

- `src/data/aliases.json`: every formal name alias in `NameAliases.txt` (481 aliases on 388
  code points), generated and regeneration-checked; feeds search.
- `fonts/manifest.json`: 41 style faces (Charis, Andika, Doulos SIL, Noto Serif/Sans and script
  faces, Noto Symbols/Symbols 2/Math) with pinned upstream URLs and SHA-256 from the Unicode
  Font Kit's remote profile and WOFF2 measurements; five style packs (`serif`, `sans`,
  `symbols`, `serif-styles`, `sans-styles`; `kind: "style"`); `policy.style_packs`.
- `data/web-fonts.json`: 67 public font faces for the CSS dialog with licences, sizes, pinned
  URLs, the kit's serif and sans priority orders, and compressed coverage ranges for 33 regular
  faces measured against the 159,375 visible assigned characters.
- `fonts/licenses/`: Charis, Andika and Doulos SIL OFL texts.

## [1.1.0.0] — 2026-10-08

### Added

- Unicode 17.0.0: `DerivedCoreProperties.txt`, `PropList.txt` and `NameAliases.txt` vendored
  under `data/ucd/17.0.0/` with SHA-256 entries. They generate `src/data/visibility.json`
  (52 hidden runs, 143,842 code points), `src/data/marks.json` (327 combining-mark ranges) and
  `src/data/abbreviations.json` (349 abbreviations).
- `fonts/manifest.json`: pinned upstream SHA-256 and byte counts for every shipped font;
  WOFF2 hashes of the reproducible conversions; `css_family`, `vendored` and zip `member`
  fields; `packs` (seven packs with computed block attachment, `pack_rule`); measured edition
  coverage (77,874 / 154,164 / 159,230 of 159,375). Last Resort switches to the full 18.000
  build (the HE build moves to `candidates`; PLAN D-11).
- `fonts/standard/`: vendored WOFF2 of Unifont, Unifont Upper, Last Resort and Adobe Blank 2
  with license texts; `fonts/licenses/`: license texts for the pack fonts.
- Authored tables: `data/device-fonts.json` (137 device families by platform),
  `data/cjk-locales.json`; `hidden_kind_labels` in `data/category-labels.json`.

### Changed

- Early Dynastic Cuneiform is categorised under "Ancient & Historic Scripts".

### Removed

- `data/non-visible-ranges.json` (replaced by generated `src/data/visibility.json`).

## [1.0.0.0] — 2026-10-08

### Added

- Unicode 17.0.0: `UnicodeData.txt` and `Blocks.txt` vendored under `data/ucd/17.0.0/` with a
  SHA-256 manifest. 346 blocks; 299,382 assigned code points; 40,470 individually named
  characters. The build reads these files offline and fails closed on any mismatch.
- `fonts/manifest.json`: Standard, Complete, and Complete + Hieroglyphs edition definitions with
  provenance, licenses, and measured coverage against 159,375 visible assigned characters.
