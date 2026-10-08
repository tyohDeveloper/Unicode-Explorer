# Third-party licenses

Code in this repository is MIT (see [`LICENSE`](LICENSE)). The built artifact also ships the
following third-party material. Fonts keep their own licenses; MIT does not relicense them.

## Shipped in `Unicode.html` (Standard edition)

| Component | Version | License | Use | License text |
|---|---|---|---|---|
| [GNU Unifont](https://unifoundry.com/unifont/) and Unifont Upper | 18.0.01 | SIL Open Font License 1.1 (Unifont is dual-licensed GPL-2.0-or-later with font embedding exception / OFL-1.1; OFL elected) | Embedded glyph coverage for the Basic Multilingual Plane and parts of the supplementary planes | [`fonts/standard/licenses/Unifont-OFL-1.1.txt`](fonts/standard/licenses/Unifont-OFL-1.1.txt) (GPL text kept in `Unifont-LICENSE.txt` for reference) |
| [Last Resort](https://github.com/unicode-org/last-resort-font) (Unicode, Inc.) | 18.000, full build | SIL Open Font License 1.1 | Per-cell placeholder naming the block of an unverified character (Placeholders toggle) | [`fonts/standard/licenses/LastResort-LICENSE.txt`](fonts/standard/licenses/LastResort-LICENSE.txt) |
| [Adobe Blank 2](https://github.com/adobe-fonts/adobe-blank-2) | 1.045 | SIL Open Font License 1.1 | Terminal font of the glyph-detection stack; never displayed | [`fonts/standard/licenses/AdobeBlank2-LICENSE.txt`](fonts/standard/licenses/AdobeBlank2-LICENSE.txt) |

The About dialog inside the artifact shows these license texts. No third-party code ships in
the artifact; the character-name table is unpacked by the browser's built-in
`DecompressionStream`.

## Shipped in the font-pack zips (Complete editions)

| Font | Version | License | Edition | License text in zip (`unicode-fonts/LICENSES/`) |
|---|---|---|---|---|
| [Jigmo2, Jigmo3](https://kamichikoichi.github.io/jigmo/) (Kamichi Koichi) | 2025-09-12 | CC0 1.0 | Complete, Complete + Hieroglyphs | `Jigmo-NOTICE.txt`, `CC0-1.0.txt` |
| [Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif Tangut](https://notofonts.github.io/) | notofonts.github.io @ 47acfd38 | SIL Open Font License 1.1 | Complete, Complete + Hieroglyphs | `Noto-OFL-1.1.txt` |
| [UniHieroglyphica](https://github.com/thesaurus-linguae-aegyptiae/UniHieroglyphica) | 19.000 | SIL Open Font License 1.1 | Complete + Hieroglyphs | `UniHieroglyphica-OFL-1.1.txt` |

Fonts are converted to WOFF2 without other changes. Full provenance (URL, SHA-256 of the
upstream file and of the conversion, measured coverage) is in
[`fonts/manifest.json`](fonts/manifest.json).

## Shipped in the style packs (Complete editions, hosted test build)

| Font | Version | License | Packs | License text in zip |
|---|---|---|---|---|
| [Charis](https://software.sil.org/charis/) (SIL Global) | 7.000 | SIL Open Font License 1.1 | `serif`, `serif-styles` | `Charis-OFL-1.1.txt` |
| [Andika](https://software.sil.org/andika/) (SIL Global) | 7.000 | SIL Open Font License 1.1 | `sans`, `sans-styles` | `Andika-OFL-1.1.txt` |
| [Doulos SIL](https://software.sil.org/doulos/) | 7.000 | SIL Open Font License 1.1 | `serif` | `Doulos-OFL-1.1.txt` |
| [Noto](https://github.com/notofonts/noto-fonts) Serif, Sans, Naskh Arabic, script faces, Symbols, Symbols 2, Math | noto-fonts @ ffebf8c1 | SIL Open Font License 1.1 | all style packs | `Noto-OFL-1.1.txt` |

DejaVu and GNU FreeFont are not shipped (D-17). The CSS dialog may name them, with their
licences, as suggestions for other projects; that text distributes nothing.

## Build-time tools (not shipped)

Vite, esbuild, html-minifier-terser, fflate, TypeScript, Vitest, Playwright,
[fontkit](https://github.com/foliojs/fontkit) (MIT; reads character maps) and
[wawoff2](https://github.com/fontello/wawoff2) (MIT; Google's woff2 encoder compiled to
WebAssembly) run only in the toolchain.
