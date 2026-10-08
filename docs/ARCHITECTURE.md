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
URLs, never referenced by URL. Enforcement:

1. A strict CSP `<meta>`: `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';
   font-src data:; img-src data:; connect-src 'none'; frame-src 'none'; object-src 'none';
   base-uri 'none'`.
2. `verify-build` searches the built artifact for `fetch(`, `XMLHttpRequest`, `sendBeacon`,
   `new WebSocket`, `serviceWorker`, `RTCPeerConnection`, `EventSource`, and any `http(s)://`
   URL outside user-initiated links, and fails the build on a hit.
3. A Playwright test asserts no non-`file://` request fires on load or during use.

The **build** may read the network only through `tools/fetch-fonts.mjs` (Phase 4), which
downloads manifest entries into a git-ignored cache and verifies SHA-256. The Unicode Character
Database files the build needs are vendored under `data/ucd/<version>/` with a hash manifest;
`tools/ucd/readUcdFile.ts` verifies every file and throws on any mismatch, so a degraded artifact
is never written.

Sibling font packs (ADR-0001, proposed) are the one permitted same-location load: classic
scripts under `unicode-fonts/`, injected by the app on demand, failing softly when absent.

## 3. The no-storage rule

No `localStorage`, `sessionStorage`, `IndexedDB`, or cookies — not for preferences, not for
last-used settings, not for anything. Reloading starts from a clean slate.

If state is worth keeping, put it in `location.hash` so the **user** decides whether to persist it
by bookmarking. Selected blocks (by start code point), display mode, font, size, the non-visible
toggle, and the name filter round-trip through the hash (`src/state/encodeHashState.ts`); only
values that differ from the defaults are written.

## 4. Layers

The §0 table in `CODING-STANDARDS.md` is the normative mapping and `check-standards` enforces it.
In outline:

```
src/codepoint/*.ts    PURE-CORE   code point ↔ string, hex, sorted-range search, hex ranges
src/ucd/*.ts          PURE        names (table → algorithmic → label), visibility, reserved, blocks
src/selection/*.ts    PURE        collect code points, filter by name, group, sort, count
src/names/            PURE+CTRL   decodeNameTable (pure) and loadNameTable (DecompressionStream)
src/state/*.ts        STATE       Settings shape, action creators, reducer, URL-hash encode/decode
src/settings/         CONTROLLER  settingsStore: the one mutable home of Settings
src/clipboard/, src/render/  CONTROLLER  clipboard IO; render debounce
src/*.ts              VIEW        sidebar, output, grid/table/plain renderers, controls, compose pad
src/data/*.json       DATA        generated from the UCD; regeneration-checked
data/*.json           DATA        authored tables; data/ucd/<version>/ vendored UCD + hashes
tools/ucd/*.ts        build       UCD parsing and src/data generation (one export per file)
scripts/*.mjs         build       minify-artifact, verify-build, verify-regenerated, check-standards, release
```

Data flow: views dispatch action creators to the store; the pure reducer produces the next
Settings; subscribers reflect it into the DOM, write it to `location.hash`, and schedule a
render. Rendering reads Settings, runs the PURE selection functions, and builds DOM. Nothing
outside the store holds domain state; the composition pad's text is user content and lives in
its textarea.

Logic belongs in PURE. If a function can be written without touching the DOM, it goes there and
it gets a unit test. Views render and wire events; they do not classify code points, resolve
names, or compute coverage. Phase 4 adds `src/coverage/` (PURE) for detection and stack logic.

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

`npm run build` = `check` → `check:standards` → `test:run` → `build:bundle` → `verify:build`,
failing at the first stage error. `build:bundle` is `vite build` (esbuild-minified ES modules,
inlined by `vite-plugin-singlefile`, `modulePreload` disabled because its polyfill injects
`fetch()`) followed by `scripts/minify-artifact.mjs` (`html-minifier-terser` for HTML and CSS,
CDATA wrapping, `crossorigin` removal) which writes `Unicode.html`. `npm run generate:data`
rebuilds `src/data/*.json`. CI runs the identical build, then `verify:regenerated` (generated data
and artifact match HEAD), then Playwright as a separate job.

`verify:build` enforces: no external URLs, no forbidden network or storage APIs, CSP present with
`connect-src 'none'`, fonts only as `data:` URLs, strict-XML-parseable shell with CDATA-wrapped
script and style bodies, no `]]>` in inlined bodies, full test-ID manifest coverage (both
directions), version stamp agreeing with `package.json` and `data/version.json`, and gzip within
5% of `scripts/build-baseline.json`. Phase 4 extends the baseline per edition.

`check:standards` enforces §1.4 (purity of PURE and STATE), §3.1, §3.2, §3.3, §3.8, §3.9, and
§11 of the coding standards over the §0 mapping using the TypeScript AST; a file matching no
layer fails; active exceptions suppress, expired ones fail.

## 8. Markup

Ship `.html` so browsers use the forgiving parser, but keep the markup strict-XML valid. Boolean
attributes in long form, void elements self-closed, script and style bodies CDATA-wrapped, no
comments inside them. The shell is XML-parsed as a build check (`scripts/xmlParse.mjs`).

## 9. Test IDs

Format: `{role}-{area}-{name}[-{key}]`. Examples: `input-sidebar-search`, `button-mode-grid`,
`cell-grid-1F600`. Statically present IDs go in `scripts/testid-manifest.json` under `required`;
template-built IDs are listed under `dynamic` and covered by Playwright. The verifier fails on a
required ID missing from the artifact and on an artifact ID missing from the manifest.

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
`<id>-data`, cut only by `scripts/release.mjs`. The number says how large the change was; what
changed is in `CHANGELOG.md` / `data/CHANGELOG.md`, and the release script refuses to tag a
version without a changelog section and writes that section into the annotated tag (PLAN.md
D-8). Documentation-only standards updates are tagged `standards-*` and do not move either track.

## 12. Open decisions

The live register is `PLAN.md` §Decisions (`D-n` decided, `Q-n` open). Findings are tracked in
`audit/checkpoint-1/finding-register.csv` and in the GitHub issues created per phase.
