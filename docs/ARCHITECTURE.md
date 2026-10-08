# Architecture & coding rules

Rules for anyone — human or coding agent — working in this repo. Read before making changes.
These are the standalone-HTML5 deployment-target standards as they apply here; the reference
implementations of the same pattern are
[history-and-prehistory](https://github.com/tyohDeveloper/history-and-prehistory) and
[OmniUnitConverter-Calculator](https://github.com/tyohDeveloper/OmniUnitConverter-Calculator).
The binding rule text is [`CODING-STANDARDS.md`](CODING-STANDARDS.md); this file says how it
lands in this repository. The plan of record is [`PLAN.md`](PLAN.md).

## 1. Deployment target

Single-file HTML5. One `.html` artifact with all CSS, JS, data, and fonts inlined, opened directly
from `file://` or served from a static host. Offline use is a first-class distribution mode, not a
fallback.

Three editions build from the same source and differ only in embedded fonts: **Standard**
(default), **Complete**, and **Complete + Hieroglyphs**. Definitions, measured coverage, and sizes
are in `PLAN.md` §Editions; font provenance is in [`../fonts/manifest.json`](../fonts/manifest.json).

If a requirement arrives that this target cannot meet, the app has outgrown the target. Do not
bolt a backend on. Escalate the decision.

## 2. The no-network rule

The app makes **zero** outbound requests at runtime. Fonts are embedded as `data:font/woff2`
URLs, never referenced by URL. Enforcement (Phase 2 of `PLAN.md`):

1. A strict CSP `<meta>`: `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';
   font-src data:; img-src data:; connect-src 'none'; frame-src 'none'; object-src 'none';
   base-uri 'none'`.
2. `verify-build` searches the built artifact for `fetch(`, `XMLHttpRequest`, `sendBeacon`,
   `new WebSocket`, `serviceWorker`, `RTCPeerConnection`, `EventSource`, and any `http(s)://`
   URL outside user-initiated links, and fails the build on a hit.
3. A Playwright test asserts no non-`file://` request fires on load or during use.

The **build** may read the network only through `tools/fetch-fonts.mjs`, which downloads
manifest entries into a git-ignored cache and verifies SHA-256. The Unicode Character Database
files the build needs are vendored under `data/ucd/<version>/` with a hash manifest (Phase 2);
until then the build fetches `UnicodeData.txt` at build time, which is a known defect (BLD-01,
BLD-02 in the audit).

## 3. The no-storage rule

No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies — not for preferences, not for
last-used settings, not for anything. Reloading starts from a clean slate.

If state is worth keeping, put it in `location.hash` so the **user** decides whether to persist it
by bookmarking (Phase 3: selected blocks, display mode, font, size).

## 4. Layers

Current layout (binding now; the §0 table in `CODING-STANDARDS.md` is the normative mapping):

```
unicode-src/js/00-classify.js     PURE   visibility and reserved-range lookup
unicode-src/data/charnames.js     PURE   name resolution (table, algorithmic, category labels)
unicode-src/js/01..06-*.js        VIEW   sidebar, render core, grid, table, plain, controls
unicode-src/data/*.js, config/    DATA   block list, algorithmic ranges, font stacks
scripts/src/unicode/build.ts      build  concatenate, inject generated tables, minify
```

Target layout (Phase 3; adopt in one commit together with the §0 table):

```
src/codepoint/*.ts    PURE-CORE  UTF-16 conversion, hex formatting, sorted-range search
src/ucd/*.ts          PURE       names, visibility, reserved lookup, block model, aliases
src/coverage/*.ts     PURE       detection logic, stack ordering, per-block coverage math
src/state/*.ts        STATE      URL-hash encode/decode, selection reducers (if adopted)
src/*.ts              VIEW       sidebar, grid, table, plain text, composition pad, controls
src/data/*.json       DATA       generated tables (read-only at runtime)
data/ucd/<ver>/       DATA       vendored UCD files + sha256 manifest
fonts/manifest.json   DATA       font sources, hashes, licenses, measured coverage, editions
tools/                build      UCD generators, font fetch/convert, coverage measurement
```

Logic belongs in PURE. If a function can be written without touching the DOM, it goes there and
it gets a unit test. Views render and wire events; they do not classify code points, resolve
names, or compute coverage.

## 5. Data

- **The Unicode version is one build input.** Block list, algorithmic-name ranges, reserved
  ranges, names, aliases, and visibility all derive from the vendored UCD for that version. Hand
  maintenance of `blocks.js` and `algo-ranges.js` ends in Phase 6; until then, a change to either
  must cite the UCD line it mirrors.
- **Generated tables are not hand-edited.** `UNASSIGNED` and `CN` are produced by the build. When
  `src/data/*.json` exists (Phase 3), it is generated too, and a regeneration check compares it
  to the committed copy.
- **Visibility is a Unicode property, not a hand list.** The target rule: a code point is shown
  by default when its General Category is not `Cc`, `Cf`, `Cs`, `Co`, `Cn`, `Zl`, or `Zp` and it
  is not `Default_Ignorable_Code_Point`, except that `Prepended_Concatenation_Mark` characters
  are shown. Combining marks render on U+25CC. Everything hidden by default is reachable through
  "Include non-visible" and shows a labelled dashed box.
- **Coverage figures are character-map measurements.** They do not prove shaping, mark
  positioning, variation sequences, or the presence of bold and italic designs. Say so wherever a
  number is shown.

## 6. Fonts and editions

- Device fonts first, embedded coverage fonts second, placeholders last — and the placeholder
  font (Last Resort) is applied **per cell by detection**, never placed in the global stack
  (`PLAN.md` D-6). A font covering every code point anywhere in a `font-family` list prevents the
  browser from reaching unnamed device fonts.
- Embedded fonts carry `unicode-range` descriptors generated from their measured cmap
  intersected with assigned visible code points for the build's Unicode version.
- Every font in `fonts/manifest.json` has a source URL, version, SHA-256, license, and measured
  coverage. A font without all five does not build.
- Licenses stay separate: `LICENSE` is MIT and covers code. Fonts are OFL or CC0 and their
  notices ship in `THIRD_PARTY_LICENSES.md` and inside each edition artifact. Nothing with a GPL
  obligation is embedded.
- No Egyptian-hieroglyph font ships in Standard or Complete (`PLAN.md` D-4). Candidates are
  recorded as `status: "candidate"` in the manifest and are not fetched by default.

## 7. Build chain

Today: `pnpm --filter @workspace/scripts build:unicode` assembles `Unicode.html` and prints a
size line. Nothing fails.

Phase 2 target: `npm run build` = `check` → `check:standards` → `test:run` → `build:bundle` →
`minify:artifact` → `verify:build`, failing at the first stage error, with CI running the identical
command and Playwright as a separate job. `verify:build` enforces: single-file output with no
siblings, no external URLs, no forbidden network or storage APIs, CSP present with
`connect-src 'none'`, fonts only as `data:` URLs, strict-XML-parseable shell, no `]]>` in inlined
bodies, full test-ID manifest coverage, and gzip within 5% of the recorded baseline **per edition**.

## 8. Markup

Ship `.html` so browsers use the forgiving parser, but keep the markup strict-XML valid. Boolean
attributes in long form, void elements self-closed, script and style bodies CDATA-wrapped, no
comments inside them. The shell is XML-parsed as a build check (Phase 2).

## 9. Test IDs

Format: `{role}-{area}-{name}[-{key}]`. Examples: `input-sidebar-search`, `button-mode-grid`,
`cell-grid-1F600`. Statically present IDs go in `scripts/testid-manifest.json` under `required`;
template-built IDs are listed under `dynamic` and covered by Playwright (Phase 2).

## 10. Links

Every outbound link is user-initiated, opens in a new tab with `rel="noopener noreferrer"`, has
descriptive text, and carries no tracking parameters. Allowed destinations: unicode.org for the
version and block in view, this repository, the MIT license, font licenses and sources, and
sibling apps in the tyoh.app family.

## 11. Commits and versions

Terse messages, one concern per commit, large changes decomposed. Plan checkpoints land in
`PLAN.md` before large build phases begin. Agent-authored commits use
`50533494+tyohDeveloper@users.noreply.github.com`.

Versions are four-part `MAJOR.MAJORFIX.MINORFIX.SPELLING` on two tracks, `<id>-app` and
`<id>-data`, cut only by `scripts/release.mjs` (Phase 2). Documentation-only standards updates
are tagged `standards-*` and do not move either track.

## 12. Open decisions

The live register is `PLAN.md` §Decisions (`D-n` decided, `Q-n` open). Findings are tracked in
`audit/checkpoint-1/finding-register.csv` and in the GitHub issues created per phase.
