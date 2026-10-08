# Third-party licenses

Code in this repository is MIT (see [`LICENSE`](LICENSE)). The built artifact also ships the
following third-party material. Fonts keep their own licenses; MIT does not relicense them.

## Shipped in `Unicode.html` today

| Component | Version | License | Use |
|---|---|---|---|
| [lz-string](https://github.com/pieroxy/lz-string) by Pieroxy | 1.5.0 | MIT | Decompresses the embedded character-name table at page load. Slated for removal in Phase 3 (`docs/PLAN.md`) in favour of the browser's `DecompressionStream`. |

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
