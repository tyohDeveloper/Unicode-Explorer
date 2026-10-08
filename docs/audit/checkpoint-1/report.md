# Unicode Explorer: Audit Checkpoint 1

Audit of [tyohDeveloper/Unicode-Explorer](https://github.com/tyohDeveloper/Unicode-Explorer), measured against the coding and architecture standards adopted in [tyohDeveloper/history-and-prehistory](https://github.com/tyohDeveloper/history-and-prehistory) and incorporating the Unicode glyph-coverage work from the Glyph-Rich Stylesheets and Fonts project. Prepared October 8, 2026.

This is a read-only audit. No application source, repository setting, tag, or deployment was changed. Findings apply to the pinned baseline below; later commits require a delta review.

## Baseline

| Item | Value |
|---|---|
| Repository | `tyohDeveloper/Unicode-Explorer`, branch `main` |
| Commit | `e7ad733d0e0a8d9459eeb361838afc01cee1a6c5` (2026-08-16, "docs: propagate PLATFORM/MODEL/REMOTE roles + Authority section (standards v2.2)") |
| Tags | `v1.0.0.0`, `standards-v2.2` |
| Artifact | `Unicode.html`, 406,485 bytes (396.9 KiB), gzip -9 276,347 bytes |
| Artifact SHA-256 | `50975b2609091ba74490c91ce6828bd9330e513240dd3c820082575e4c0c1679` |
| Declared app version | `v1.0.0.0` (hard-coded in `unicode-src/template.html`) |
| Unicode data | 17.0.0 ([Blocks-17.0.0.txt](https://www.unicode.org/Public/17.0.0/ucd/Blocks.txt), [UnicodeData.txt](https://www.unicode.org/Public/17.0.0/ucd/UnicodeData.txt)) |
| First-party source | 1,636 lines across `unicode-src/` (10 JS files, CSS, template, font config) plus `scripts/src/unicode/build.ts` |
| Standards reference | `history-and-prehistory` at `62c721d` (app 3.39.0.0, data 0.43.0.0), `docs/CODING-STANDARDS.md` v2.2, `docs/ARCHITECTURE.md`, `AGENTS.md`, `.github/workflows/build.yml` |
| Glyph-coverage reference | Unicode Font Kit (66 WOFF2 faces) and maintainer handoff from the Glyph-Rich Stylesheets and Fonts project |
| Test environment | Chromium 1217 headless (Linux), Node 20.20, Python 3.14, fontTools 4.66 |

## What was run

- A clean rebuild from source in a disposable copy, compared byte-for-byte with the committed artifact.
- A comparison of the embedded block list, character names, reserved-range table, and visibility rules against the official Unicode 17 character database.
- Headless-browser runs of the built file over `file://`: startup time, network requests, console errors, rendering at full scale, and keyboard tab order.
- Measured character-map coverage of every Unicode Font Kit face, plus candidate fonts for the remaining gaps, against all 159,375 visible assigned Unicode 17 characters.
- A prototype of in-browser glyph detection using the [Adobe Blank 2](https://github.com/adobe-fonts/adobe-blank-2) font.

Not yet run: Firefox, Safari, iPadOS, or Windows testing; screen-reader testing; per-device coverage measurement on your own machines. These are Checkpoint 2 items.

## Verdict

The core is sound and worth keeping. The data layer is accurate, the build is reproducible, and the single-file artifact is small, fast to load, and makes no network requests. The main problems sit around that core:

1. **Glyph display depends entirely on whatever fonts the device has, and the app cannot tell when a character fails to render.** A missing glyph looks the same as a real one.
2. **The repository standards do not actually govern the application.** The in-repo standards file maps its layer rules to unused Replit scaffold directories, so none of them apply to `unicode-src/`.
3. **There are no tests, no CI, and no artifact verification**, and the build silently ships a broken file if the Unicode data download fails.
4. **Selecting all blocks freezes the page for 19–23 seconds** and builds up to 820,000 page elements.
5. **The data is one Unicode version behind.** Unicode 18.0 was released on September 16, 2026, with 172,808 characters ([Unicode 18.0.0](https://www.unicode.org/versions/latest/)).

The most important coverage finding is encouraging: your existing font work already covers 91% of visible Unicode 17 characters, and a measured set of openly licensed fonts reaches 99.9%. The open question is how much of that to embed in a single file.

## Strengths to protect

- **Reproducible build.** A clean rebuild today produced a file byte-for-byte identical to the committed `Unicode.html`.
- **Correct character names.** All 299,382 assigned code points (including algorithmic CJK, Tangut, and Hangul ranges) produce exactly the official Unicode 17 name. Zero mismatches.
- **Exact block list.** All 346 blocks match `Blocks-17.0.0.txt` in name, range, and order.
- **Compact, fast, offline.** 397 KiB, page ready in about 220 ms, zero non-`file://` requests, zero console errors.
- **Clean source split.** Data, classification, sidebar, renderers, and controls already live in separate source files, which makes migration to modules straightforward.
- **Thoughtful name compression.** Alphabetic sort plus shared-prefix deltas reduce 40,470 names from 536 KB to 332 KB before embedding.

## Findings register

Severity follows the History & Prehistory review brief: P0 critical, P1 high (blocks a release unless explicitly accepted), P2 medium, P3 low. The companion CSV carries the same findings with evidence and proposed regression tests.

### Glyph coverage and rendering

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| GLY-01 | P1 | No fonts are embedded. Every glyph depends on device fonts, so the same file shows different coverage on your Mac, iPad, and any other machine, and nothing in the app reports it. | Adopt an embedded coverage tier (see Glyph coverage strategy). |
| GLY-02 | P1 | Missing glyphs are indistinguishable from real ones. Unsupported characters render as blank boxes or replacement shapes with no indication. | Add glyph detection: render each character with the chosen stack followed by Adobe Blank 2 (1.5 KB, zero-width glyph for every code point) and flag cells whose ink box is empty. Show per-block coverage in the status bar. |
| GLY-03 | P2 | Font stacks in `config/fonts.json` put CJK fonts first, so Latin, IPA, and Greek render in CJK fonts' secondary designs. Two families do not exist as written (`'Noto Serif CJK'`, `'Noto Sans Mono CJK'` need a region suffix such as `SC`). No historic-script or symbol families are named (for example Segoe UI Historic, Segoe UI Symbol, Apple Symbols, Noto Sans Symbols 2). | Replace flat stacks with script-aware composite families: `@font-face` rules using `local()` sources and `unicode-range` so each script reaches its best font. Generate them from a manifest. |
| GLY-04 | P2 | 2,543 combining marks are shown bare, so they render detached or invisibly. 26 default-ignorable characters (soft hyphen, combining grapheme joiner, Hangul fillers, Mongolian variation selectors) and line/paragraph separators appear as blank cells. | Render combining marks on U+25CC DOTTED CIRCLE, as Unicode's own code charts do. Show invisible characters as labelled dashed boxes (for example "SHY", "CGJ"). |
| GLY-05 | P2 | The page is fixed to `lang="en"`. Han characters shared by Chinese, Japanese, and Korean take their shape from the language tag, so users cannot compare regional forms. | Add a CJK glyph-locale selector (zh-Hans, zh-Hant, zh-HK, ja, ko) that sets `lang` on the output container. |
| GLY-06 | P3 | Fixed 2em grid cells clip wide glyphs such as cuneiform and some pictographs. There is no text versus emoji presentation control. | Allow cells to grow to the glyph's width. Add a presentation toggle using VS15/VS16 or `font-variant-emoji`. |

### Unicode data currency and correctness

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| DAT-01 | P1 | Unicode 18.0 is current. It adds 7 blocks and 13,007 characters (Bengali Supplement, Archaic Cuneiform Numerals, Jurchen, Jurchen Radicals, Musical Symbols Supplement, Miscellaneous Symbols and Arrows Extended, Seal). The build hard-codes the `17.0.0` URL, and `blocks.js` is maintained by hand. | Make the Unicode version a single build input. Generate the block list from `Blocks.txt` plus a small committed category-assignment file. Then upgrade to 18.0 as a data-track release. |
| DAT-02 | P2 | `isNonVisible()` is a hand-written approximation that disagrees with Unicode's own properties (finding GLY-04). It also contains dead conditions: the private-use high-surrogate test is already covered by the surrogate test, and the noncharacter test appears twice. | Derive visibility at build time from General_Category, `Default_Ignorable_Code_Point`, and `Prepended_Concatenation_Mark`. Embed it as a compact range table. |
| DAT-03 | P3 | `ALGO_RANGES` is maintained by hand. Its Nushu, Khitan, and CJK compatibility entries are redundant, because those characters are individually named in `UnicodeData.txt`. Unicode 18's new ranges will need new rules. | Derive algorithmic ranges from the `<…, First>`/`<…, Last>` markers in `UnicodeData.txt`. Strip pattern-derivable names from the embedded table to save space. |
| DAT-04 | P3 | Search covers names only. It ignores the 481 formal name aliases (39 corrections, 354 abbreviations such as NBSP and ZWJ), and does not accept a code point (`U+1F600`, `1F600`) or a pasted character. | Index aliases, and add code-point and literal-character lookup. |
| DAT-05 | P3 | No per-character properties are shown. | Add a detail panel with General Category, Script, Age (the version that added the character), and decomposition. Age is especially useful because recently added characters are the least likely to have fonts. |

### Build integrity and reproducibility

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| BLD-01 | P1 | The build fails open. If the `UnicodeData.txt` download fails, it logs a warning and still writes `Unicode.html` with empty names and reserved-range tables, then exits successfully. | Fail the build on any data error. Never write a degraded artifact. |
| BLD-02 | P2 | The build downloads Unicode data at build time with no pinned checksum. It reproduced today only because the upstream file has not changed. | Vendor the required UCD files under `data/ucd/<version>/` with a SHA-256 manifest. The build reads them offline and verifies hashes. |
| BLD-03 | P2 | No tests, no CI workflow, and no artifact verification. The only check is a 400 KB size message that never fails. | Adopt the History build chain: typecheck, standards lint, unit tests, bundle, minify, verify, with end-to-end tests as a separate CI job. |
| BLD-04 | P2 | The committed `Unicode.html` has no check that it matches its source. | Add a regeneration check in CI (the History repo's `check_regenerated` pattern), or build to `dist/` and attach the file to tagged releases. |
| BLD-05 | P3 | Custom regex CSS and HTML minifiers, against the standards' preference for maintained libraries. | Use `vite-plugin-singlefile` plus `html-minifier-terser`, as History does. |
| BLD-06 | P3 | The LZString runtime library is bundled only to unpack names. | Use the browser's built-in `DecompressionStream("deflate-raw")`. Measured: 273 KB embedded versus 332 KB today, and one fewer dependency. |

### Architecture and standards conformance

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| ARC-01 | P1 | `docs/CODING-STANDARDS.md` §0 maps every layer role to unused Replit scaffold paths (`artifacts/*/src/components/**` and similar). `unicode-src/` is not mapped, so no rule governs the actual application. It also declares a "multi-artifact repo" rather than the standalone HTML5 target, and says "semantic versioning" where History's copy of the same v2.2 standards requires four-part versioning. The two derived copies have drifted. | Re-propagate the canonical v2.2 text from the programming Project wiki, then fill in §0 for this app (proposed mapping below). Add a check that flags drift between derived copies. |
| ARC-02 | P2 | Runtime code is ten concatenated global scripts with hidden cross-file dependencies. For example, `hex4` is defined in `charnames.js` but used in `00-classify.js`, and `tableSortState` is declared in the table renderer but reset in the render core. DOM work and logic are mixed. `renderOutput` (about 55 lines) and `buildSidebar` (about 85 lines) exceed the 20-line function limit. | Migrate to TypeScript ES modules: pure Unicode logic under domain directories, with views on top. Extract the misplaced logic first, then split files (standards §16.2). |
| ARC-03 | P2 | The repository carries an unrelated Replit template: an Express API server that only streams the HTML file (with open CORS), a React/shadcn mockup sandbox (about 50 components), a Drizzle/Postgres package with an empty schema, and OpenAPI client generation. The post-merge script runs a database push. None of it is used by the app. | Remove it, and adopt History's lean single-package layout (Vite plus `vite-plugin-singlefile`, Vitest, Playwright). |
| ARC-04 | P2 | There is no README, LICENSE, CHANGELOG, `AGENTS.md`, or `docs/ARCHITECTURE.md`. The repository is public but unlicensed, which legally means all rights reserved. | Add all five. Use MIT for code, with font licenses carried separately (see Licensing). |
| ARC-05 | P3 | State does not survive a reload, although the standards allow URL-fragment state. | Encode selected blocks, mode, font, and size in `location.hash`. |
| ARC-06 | P3 | `.agents/skills/agent-tools` is a third-party skill that grants agents `Bash(infsh *)` access to an external AI service, which this project does not use. | Remove `.agents/` and `skills-lock.json` unless they are deliberately used. |
| ARC-07 | P3 | `docs/tasks/` holds 70 task files with overlapping names (`task-N.md` alongside descriptive duplicates). | Keep them as history (standards §16.8), but add an index and stop auto-copying from `.local/tasks`. |
| ARC-08 | P3 | 84 of 93 commits use a Replit noreply email that does not link to the GitHub account. | Configure the `50533494+tyohDeveloper@users.noreply.github.com` identity for future commits. Leave history as is. |

### Performance

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| PRF-01 | P1 | Selecting all blocks renders 163,807 cells. Measured: 19.2 s of frozen page in Grid mode and 23.3 s in Table mode, with 819,723 elements in the table. Each cell gets its own click handler and a tooltip name lookup at creation. | Virtualize: fixed-size cells make windowed rendering simple. Use a single delegated click handler and compute tooltips on hover. Target under 100 ms for any selection. |
| PRF-02 | P3 | Every checkbox change re-renders the whole output. | Render incrementally per block, reusing block sections already built. |

### Accessibility and interface

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| ACC-01 | P1 | The display-mode and font selectors are radio buttons hidden with `display:none`, so keyboard users cannot reach them. Verified: the tab order skips them entirely. | Hide them visually but keep them focusable, or use buttons with `aria-pressed`. |
| ACC-02 | P2 | Grid cells are plain `div`s, so characters cannot be focused, read, or inserted from the keyboard. Category headers are clickable list items without a button role or expanded/collapsed state. | Use a grid pattern with roving focus and Enter to insert. Make category headers buttons with `aria-expanded`. |
| ACC-03 | P2 | The accent colour on the panel background has a 4.25:1 contrast ratio, below the 4.5:1 minimum for the small uppercase category and section headings. Code-point labels are about 10 px. | Lighten the accent for text use. Set a minimum label size. |
| ACC-04 | P3 | The block search box has no label. Status counts are not announced to screen readers. Copy errors use `alert()`. | Add a label and a live status region, and replace `alert()` with inline feedback. |
| UX-01 | P3 | Inserting a character moves focus to the composition pad, which opens the on-screen keyboard on iPad. | Keep focus in the grid. Add an explicit "edit pad" action. |
| UX-02 | P3 | The "Ch" column sorts identically to "Code Point". Name sorting uses `localeCompare`, so the order varies by device locale. | Remove the duplicate sort. Sort names by code unit. |

### Security, privacy, and documentation

| ID | Sev | Finding | Recommendation |
|---|---|---|---|
| SEC-01 | P2 | No Content-Security-Policy is present. Runtime behaviour is clean (zero requests observed), but nothing enforces it. | Add History's CSP meta (`connect-src 'none'`, `object-src 'none'`, `base-uri 'none'`, fonts from `data:` only). Add a build check that searches for network and storage APIs. |
| SEC-02 | P3 | Font-button markup is built by inserting config values into attributes without escaping. This is build-time only, so risk is low. | Escape attribute values, or generate the buttons in code. |
| SEC-03 | P3 | The markup is not XML-parseable (scripts are not CDATA-wrapped), against the standards' polyglot-markup contract. | Add the XML-parse build check and CDATA wrapping. |
| DOC-01 | P2 | `replit.md` is stale. It claims XHTML 1.1, lists files that no longer exist (`02-render.js`, `03-controls.js`, `unassigned.js`), and gives outdated sizes. Code comments cite "~25 K" names (actual: 40,470). The page header hard-codes "Unicode 17.0 · 346 blocks". | Generate version and count text at build time. Rewrite `replit.md` as a short pointer to `AGENTS.md`. |

## Glyph coverage strategy

### Where the gaps are

Measured against the 159,375 visible assigned Unicode 17 characters (excluding controls, surrogates, private use, unassigned, and default-ignorable code points):

- **The full 66-face Unicode Font Kit covers 145,121 (91.1%).** The same total comes from just four of its files: Unifont, Unifont Upper, Jigmo2, and Jigmo3. In this measurement, Charis, Andika, Noto, FreeFont, and DejaVu add style and shaping quality, not extra coverage.
- **Every remaining gap is in 11 historic-script blocks:**

| Block | Missing | Font that closes it ([Noto](https://github.com/notofonts/notofonts.github.io) unless noted) |
|---|---:|---|
| Tangut | 6,144 | Noto Serif Tangut (except 8 characters added in Unicode 17) |
| Egyptian Hieroglyphs Extended-A | 3,995 | [UniHieroglyphica](https://github.com/thesaurus-linguae-aegyptiae/UniHieroglyphica) (all) or [NewGardiner](https://github.com/nederhof/newgardiner) (most) |
| Egyptian Hieroglyphs | 1,071 | Noto Sans Egyptian Hieroglyphs |
| Cuneiform | 922 | Noto Sans Cuneiform |
| Anatolian Hieroglyphs | 583 | Noto Sans Anatolian Hieroglyphs |
| Bamum Supplement | 569 | Noto Sans Bamum |
| Tangut Components | 512 | Noto Serif Tangut |
| Early Dynastic Cuneiform | 196 | Noto Sans Cuneiform |
| Cuneiform Numbers and Punctuation | 116 | Noto Sans Cuneiform |
| Tangut Components Supplement | 115 | No font found (new in Unicode 17) |
| Tangut Supplement | 31 | Noto Serif Tangut covers 9; 22 remain |

The [Berlin-Brandenburg Academy's Egyptological font list](https://aaew.bbaw.de/egyptological-unicode-fonts) identifies UniHieroglyphica as covering the Unicode 16 expanded set, and NewGardiner as covering it across two files; both are OFL-licensed.

### Delivery options

Sizes are compressed font payloads. The HTML size includes base64 embedding (about one-third overhead) on top of today's 397 KiB file.

| Option | What is embedded | Guaranteed coverage | Fonts | Single-file HTML |
|---|---|---:|---:|---:|
| A. Device fonts only | Nothing (improved stacks, detection, Adobe Blank) | Device-dependent | ~0 | ~0.4 MB |
| B. Standard | [GNU Unifont](https://www.unifoundry.com/unifont/index.html) + Unifont Upper + [Last Resort HE](https://github.com/unicode-org/last-resort-font/releases) | 77,874 (48.9%), including every visible Basic Multilingual Plane character | 1.55 MB | ~2.5 MB |
| C1. Complete, CJK | B + [Jigmo2/Jigmo3](https://kamichikoichi.github.io/jigmo/) | 145,121 (91.1%) | 16.8 MB | ~23 MB |
| C2. Complete, historic | C1 + 5 Noto historic-script fonts | 155,235 (97.4%) | 18.5 MB | ~25 MB |
| C3. Complete, lean Egyptian | C2 + NewGardiner | 158,662 (99.6%) | 19.6 MB | ~26.5 MB |
| C4. Complete, maximum | C2 + UniHieroglyphica | 159,230 (99.9%) | 24.6 MB | ~33 MB |
| D. Font pack from disk | Core file stays small; the user picks font files from disk each session (no network, no storage) | Whatever the user loads | 0 in file | ~0.4 MB |

The Last Resort font maps every code point to a glyph that names its block, so no character ever renders as an anonymous box. Its high-efficiency build is only 133 KB compressed.

### How the stack should be ordered

A font in the list that covers every code point (Last Resort, Adobe Blank) stops the browser from falling back to other system fonts. So:

- **Style stack first.** Use the selected style's named fonts (Charis or Andika, Noto, platform fonts), declared through `local()` and `unicode-range` so each script reaches its best font.
- **Embedded coverage fonts next.** Unifont, Jigmo, and the historic-script fonts, each limited to their measured `unicode-range`.
- **Last Resort at the end, as an explicit setting.** Offer "Show block placeholders for missing glyphs" versus "Let the device choose." Detection (GLY-02) runs in both modes and reports which characters fell through to embedded fonts or placeholders.

Unifont has a pixel-grid look and lacks complex-script shaping, so it belongs after the proper script fonts, never before them. A character-map entry also does not guarantee correct shaping or every style design, which the font-kit handoff already notes.

### Recommendation

Make **Option B the default artifact** and build **Option C3 as a "Complete" release asset** from the same source using a build flag. B keeps the everyday file at about 2.5 MB while guaranteeing the whole Basic Multilingual Plane and eliminating anonymous boxes. C3 reaches 99.6% for about 26.5 MB. That is too large for routine use or Git history, but fine as a tagged download, consistent with the handoff's advice to keep large generated HTML out of ordinary history. Ship detection (GLY-02) in every edition. Treat Option D as a later enhancement for anyone who wants their own fonts.

C4 adds 568 Egyptian characters for 5 MB more. That is worth it only if Ptolemaic Egyptian coverage matters to you.

### Licensing

Every font in Options B–C4 is under the SIL Open Font License or CC0. Unifont is dual-licensed, with OFL available, according to its maintainer's documentation. Jigmo is CC0, and Noto, NewGardiner, UniHieroglyphica, Last Resort, and Adobe Blank 2 are OFL. This avoids the GPL-with-font-exception question that the font-kit handoff raised for GNU FreeFont, which these options do not need. Ship the OFL texts and a font manifest (version, source URL, SHA-256, measured coverage) alongside the MIT-licensed code, and embed the notices in the artifact.

## Standards adoption from History & Prehistory

### Proposed §0 path mapping

| Layer role | Proposed paths |
|---|---|
| VIEW | `src/*.ts`: sidebar, grid, table, plain-text, composition pad, controls |
| CONTROLLER | unmapped; views call pure logic directly, as in History |
| STATE | `src/state/**` if URL-hash state lands; otherwise unmapped |
| PURE | `src/ucd/**` (names, visibility, reserved lookup, block model), `src/coverage/**` (detection logic, stack ordering) |
| PURE-CORE | `src/codepoint/**` (UTF-16 conversion, hex formatting, range search) |
| DATA | `src/data/**` (generated tables), `data/ucd/<version>/**` (vendored UCD files plus manifest), `fonts/manifest.json` |
| PLATFORM-PURE, PLATFORM-AMBIENT, MODEL, REMOTE | unmapped |

**Target:** standalone single-file HTML5, with the §17 standalone and artifact-contract rules in full.

### Adoption checklist

| History practice | Unicode Explorer today | Adopt |
|---|---|---|
| `AGENTS.md` with the rules most likely to be broken | Missing | Yes, adapted: no network, no storage, generated data, the font manifest, and Unicode version as a single input |
| `docs/ARCHITECTURE.md` (binding, short) | Missing | Yes |
| §0 maps to real code | Maps to unused scaffold | Yes (ARC-01) |
| Vite + `vite-plugin-singlefile`, TypeScript, no UI framework | Custom concatenation build, global scripts | Yes (ARC-02, BLD-05) |
| `npm run build` = check, standards, test, bundle, minify, verify | One build step, no gates | Yes (BLD-03) |
| `verify-build.mjs`: single file, no external URLs, no network/storage APIs, CSP, XML-parse, gzip baseline ±5% | None | Yes, with a fonts-only-as-`data:` rule added |
| Playwright end-to-end tests over `file://` with a zero-network assertion | None | Yes |
| Generated data with a regeneration check | Network fetch at build time | Yes, with vendored UCD and hashes (BLD-02) |
| Test-ID manifest | None | Yes |
| GitHub Actions: build, end-to-end, dataset jobs | None | Yes |
| Four-part versioning, separate app and data tracks, `release.mjs`, `<id>-app`/`<id>-data` tags | `v1.0.0.0` only | Yes. Data track: UCD version plus a font-manifest revision |
| Keep-a-Changelog, README contract, MIT LICENSE | Missing | Yes |
| CSP meta and outbound-link rules | Missing | Yes |

## Implementation roadmap

Following your preference, each phase starts by checkpointing its plan in GitHub, then proceeds as small commits with terse messages.

1. **Governance.** Re-propagate standards v2.2 and fill in §0. Add `AGENTS.md`, `ARCHITECTURE.md`, README, LICENSE, and CHANGELOG. Remove the Replit scaffold and `.agents/`. (ARC-01, 03, 04, 06; DOC-01)
2. **Build integrity.** Vendor UCD 17 with hashes, make the build fail closed, add the verify step, CSP, unit tests for names, visibility, and reserved lookup, end-to-end smoke tests, and CI. Prove behaviour is unchanged by reproducing today's artifact behaviour. (BLD-01–04, SEC-01, SEC-03)
3. **Module migration.** Move to TypeScript modules under the new mapping, extracting logic before splitting. Replace LZString with `DecompressionStream`. (ARC-02, BLD-05, BLD-06)
4. **Glyph coverage.** Font manifest and build flag for editions B and C3, script-aware stacks, Adobe Blank detection with a coverage readout, dotted-circle combining marks, invisible-character labels, and the CJK locale selector. (GLY-01–06, DAT-02)
5. **Scale and accessibility.** Virtualized rendering, delegated events, keyboard grid, contrast fixes, and URL-hash state. (PRF-01–02, ACC-01–04, UX-01–02, ARC-05)
6. **Unicode 18.** Generated block list and algorithmic ranges, the 18.0 data release, remeasured coverage, and new gap fonts as they appear (Seal and Jurchen are the largest additions). (DAT-01, DAT-03–05)

Phases 1–2 are low-risk and unblock everything else. Phase 4 delivers the main goal of showing as many glyphs as feasible, and can begin in parallel with Phase 3 because the font manifest and coverage tooling live at build level.

## Open decisions

| ID | Decision | Recommendation |
|---|---|---|
| Q-1 | Default edition size | Option B (~2.5 MB) as default, C3 (~26.5 MB) as a release asset |
| Q-2 | Egyptian Extended-A font | NewGardiner (1.1 MB, 4,498 of 5,066) unless full Ptolemaic coverage matters, in which case UniHieroglyphica (6.4 MB, all 5,066) |
| Q-3 | Last Resort placeholders on by default | Yes in the Complete edition; a visible toggle in Standard |
| Q-4 | Upgrade to Unicode 18 before or after the migration | After Phase 2, so the upgrade runs through the new regeneration and verification checks |
| Q-5 | Keep the committed root `Unicode.html` | Build to `dist/`, attach to tagged releases, and keep a committed copy only if Replit hosting needs it |
| Q-6 | Hosting | Not yet decided. The app currently runs as a Replit autoscale deployment through an Express server; a static host or the tyoh.app family would remove the server |

## Scope limitations

- Coverage figures are character-map measurements of font files. They do not prove correct shaping, combining-mark positioning, variation sequences, or genuine bold and italic designs.
- Browser measurements are from Linux Chromium. Safari, iPadOS, Firefox, and Windows behaviour, and the actual coverage of your devices' installed fonts, are untested.
- The glyph-detection prototype confirmed the technique, including that lone surrogates must be excluded. Zero-advance combining marks need an ink-box test rather than a width test; this is designed but not yet prototyped.
- Accessibility findings come from code inspection, keyboard tab order, and contrast calculation, not a screen-reader session.
- The programming Project wiki, which is canonical for the standards text, was not directly readable in this session. The History repository's derived copy at `62c721d` served as the reference.

## Sources

- Unicode 18.0.0 release: https://www.unicode.org/versions/latest/
- Unicode 17.0 character database: https://www.unicode.org/Public/17.0.0/ucd/
- Unicode 18.0 character database: https://www.unicode.org/Public/18.0.0/ucd/
- Unicode Last Resort font releases: https://github.com/unicode-org/last-resort-font/releases
- Adobe Blank 2: https://github.com/adobe-fonts/adobe-blank-2
- Noto fonts: https://github.com/notofonts/notofonts.github.io
- NewGardiner: https://github.com/nederhof/newgardiner
- UniHieroglyphica: https://github.com/thesaurus-linguae-aegyptiae/UniHieroglyphica
- Egyptological Unicode fonts (BBAW): https://aaew.bbaw.de/egyptological-unicode-fonts
- GNU Unifont: https://www.unifoundry.com/unifont/index.html
- Jigmo: https://kamichikoichi.github.io/jigmo/
- Audited repository: https://github.com/tyohDeveloper/Unicode-Explorer
- Standards reference: https://github.com/tyohDeveloper/history-and-prehistory
