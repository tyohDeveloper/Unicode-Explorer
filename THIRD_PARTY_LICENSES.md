# Third-party licenses

Code in this repository is MIT (see [`LICENSE`](LICENSE)). The built artifact also ships the
following third-party material. Fonts keep their own licenses; MIT does not relicense them.

## Shipped in `Unicode.html` today

None. Since 1.2.0.0 the artifact contains only first-party code; the character-name table is
unpacked by the browser's built-in `DecompressionStream`. Build-time tools (Vite, esbuild,
html-minifier-terser, fflate, TypeScript) add nothing to the artifact.

## Fonts (embedded from Phase 4; see `fonts/manifest.json`)

| Font | License | Edition |
|---|---|---|
| GNU Unifont, Unifont Upper | SIL Open Font License 1.1 (dual-licensed; OFL elected) | Standard, Complete, Complete + Hieroglyphs |
| Last Resort HE (Unicode, Inc.) | SIL Open Font License 1.1 | Standard, Complete, Complete + Hieroglyphs |
| Jigmo2, Jigmo3 | CC0 1.0 | Complete, Complete + Hieroglyphs |
| Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif Tangut | SIL Open Font License 1.1 | Complete, Complete + Hieroglyphs |
| UniHieroglyphica | SIL Open Font License 1.1 | Complete + Hieroglyphs |
| Adobe Blank 2 | SIL Open Font License 1.1 | All editions (glyph detection only; renders nothing) |

Each edition artifact embeds the full license text of every font it contains.
