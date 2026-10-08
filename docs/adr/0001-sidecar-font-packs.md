# ADR-0001: Sidecar font packs with soft failure

Status: **implemented in app 2.0.0.0** (2026-10-08); accepted 2026-10-08 (owner decision).
Supersedes the packaging in PLAN.md D-2 and D-3; the font set and the licensing are unchanged
except that the placeholder font is the full Last Resort build (PLAN.md D-11).

## Context

Embedding every coverage font makes a 25–33 MiB HTML file. Most users never open the CJK
extension or historic-script blocks that need those fonts, and a 30 MiB download is a poor
default. The owner asked for the application to carry about 50% coverage itself and reach
99.9% by reference to files in the same directory, failing softly when they are absent.

## Decision

- `Unicode.html` embeds Unifont, Unifont Upper, Last Resort HE, and Adobe Blank 2 as `data:`
  URLs (Standard, about 2.4 MiB, self-contained).
- A sibling directory `unicode-fonts/` carries `manifest.js` (which packs exist, which blocks
  each serves, sizes) and one classic script per pack. Each pack script assigns a base64
  `data:font/woff2` URL to a well-known global; the app registers it through the `FontFace`
  API and adds it to `document.fonts`.
- The app injects `<script src="unicode-fonts/<pack>.js">` only when a selected block needs
  that pack. `onerror` on the manifest or a pack marks the pack unavailable and the status bar
  says so; rendering continues with Standard coverage and Last Resort placeholders.
- CSP: `script-src 'unsafe-inline' 'self'`. `'self'` matches sibling files both on `file://`
  and when hosted. `font-src data:` only; no raw font URLs.
- Release assets: `Unicode.html`; `Unicode-Explorer-Complete.zip` (HTML + all packs except
  Egyptian); `Unicode-Explorer-Complete-Hieroglyphs.zip` (all packs).

## Measured (Chromium 1217, standard flags, 2026-10-08)

| Variant | `file://` | HTTP | Missing file |
|---|---|---|---|
| Classic `<script src>` sibling, CSP `script-src 'self'` | loads | loads | `error` event fires |
| Raw `.woff2` sibling via CSS `url()`, CSP `font-src 'self'` | loads | loads | — |

Firefox treats each local file as its own origin and is known to refuse `@font-face` loads from
local files, while still executing sibling classic scripts; Safari was not tested. The script
carrier is therefore the portable choice.

## Alternatives rejected

- **Single-file Complete editions (25–33 MiB).** Correct and simplest, but a bad default
  download, and Git cannot carry them. May still be produced on request; not the primary asset.
- **Raw `.woff2` siblings referenced by CSS.** Smallest bytes and no JS, but blocked by Firefox
  on `file://` and would need `font-src 'self'`, widening the CSP to any same-origin font.
- **`fetch()` of sibling binaries.** Prohibited by the no-network rule and fails on `file://`.
- **One combined pack.** Forces the full 34 MiB load for any one rare block. Per-pack scripts
  load only what the selected blocks need.

## Consequences

- The artifact contract gains an optional, documented sibling directory. `verify-build` checks
  the Standard artifact alone works, and that the only non-inline script references are
  `unicode-fonts/*.js` loaded by the app at runtime.
- The no-network rule is restated: zero requests to any origin other than the artifact's own
  location; sibling packs are same-location requests and must fail softly.
- Base64 adds one third to pack bytes; accepted because packs are opt-in per block.

## Implementation notes (2.0.0.0)

- `tools/fonts/buildPacks.ts` writes `unicode-fonts/<pack>.js` (base64 WOFF2 under
  `window.UnicodeExplorerFontPackData[id]`), a per-edition `unicode-fonts/manifest.js`
  (`window.UnicodeExplorerFontPacks`) inside each zip, and a development catalogue listing every
  pack beside the packs in the checkout. Both directories are git-ignored; the zips are release
  assets built by `.github/workflows/release.yml` on an app tag.
- Runtime: `src/fonts/fontPacks.ts` injects `unicode-fonts/manifest.js` relative to the
  document at start-up; `error` means "no packs" and the status line stays empty. When the
  selection touches a pack's blocks, the pack script is injected, its fonts are registered with
  the FontFace API from decoded bytes, the font stack and glyph probe are refreshed, and the view
  re-renders. A missing pack reports "Font pack unavailable: …" and nothing else changes.
- Block attachment follows PLAN.md D-13. Playwright covers a real pack built from the vendored
  Last Resort font and a listed-but-absent pack (`tests/e2e/fixtures.ts`).
