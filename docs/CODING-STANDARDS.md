# Adopted Coding Standards

> **Source of truth.** `tyohDeveloper/engineering-standards`, release `1.0.1.1` (tag `standards-1.0.1.1`, commit `9f00458c2f11e8e057dc987b926b4cf1ec4db43e`). If this copy and the tagged release disagree, the release wins. Do not amend this file to propose a standards change; open a proposal in the hub.

Adoption record: [`STANDARDS-ADOPTION.json`](../STANDARDS-ADOPTION.json) (schema 2). Exceptions: [`.architecture-exceptions.json`](../.architecture-exceptions.json), machine-checked by `scripts/check-standards.mjs`. Predecessor policy (v2.2 portable edition, superseded; its wiki-authority clause is void under hub ADR-0004): [`standards/portable-v2.2.md`](standards/portable-v2.2.md), retained unchanged for history.

## Retrieval step

The complete applicable policy is the following documents at tag `standards-1.0.1.1`. Agents and reviewers load them from the hub; this repository does not carry a copy.

| Document | Governs here |
|---|---|
| `standards/coding-core.md` | Core rules C-1 to C-49; language classes `application` (`src/**`) and `tooling` (`tools/**`, `scripts/**`) |
| `standards/bindings/typescript.md` | How each rule is checked in TypeScript; TS-1 to TS-7 (class `application`; `tools/**` and `scripts/**` follow the `tooling` column of coding-core) |
| `standards/bindings/python.md` | `tools/fonts/verify_shaping.py` (tooling class) |
| `standards/profiles.md` | Delivery profile rules: §2.1 `state = none`, §3.1 single-file, §3.5 network, §3.7 localization |
| `standards/artifact-contract.md` | Single-file artifact shape and verification |
| `standards/architecture.md` | Role model (VIEW, CONTROLLER, STATE, PURE, PURE-CORE, DATA, PLATFORM, MODEL, REMOTE) |
| `reviews/architecture-review.md`, `reviews/standards-compliance-review.md` | Review procedures |

## Application mapping

Delivery profile (declared in the adoption record): `state = none`, `packaging = single-file`, `store = none`, `identity = none`, `network = none`, `compute = interactive`; localization `scope = []` (interface is English only; the CJK locale-tagged glyph selection in `data/cjk-locales.json` is DATA under C-14, not interface localization). No platform ports. Bindings: `typescript:application`, `python:tooling`. Build tooling in TypeScript (`tools/**`, `scripts/**`) is the `tooling` class under coding-core §language classes; the TypeScript binding declares only `application` today, so the tooling column of coding-core applies directly (hub follow-up requested).

Role mapping (responsibility-named directories; roles are not directory names). `scripts/check-standards.mjs` holds this table in code; a file matching no row fails the build.

| Role | Paths |
|---|---|
| VIEW | `src/*.ts` (top level only), `index.html`, `src/style.css` |
| CONTROLLER | `src/settings/**`, `src/clipboard/**`, `src/render/**`, `src/names/loadNameTable.ts`, `src/fonts/{glyphProbe,fontPacks,coverageScanner}.ts`, `src/webfonts/loadWebFontRanges.ts`, `src/properties/loadProperties.ts` |
| STATE | `src/state/**` (Settings shape, actions, reducer, URL-hash encode/decode) |
| PURE | `src/ucd/**`, `src/selection/**`, `src/coverage/**`, `src/markup/**`, listed files in `src/fonts/`, `src/webfonts/`, `src/properties/`, `src/names/decodeNameTable.ts` |
| PURE-CORE | `src/codepoint/**` |
| DATA | `src/data/*.json` (generated), `data/**` (authored tables, vendored UCD with hash manifest), `fonts/manifest.json`, `fonts/standard/**`, `fonts/licenses/**` |
| PLATFORM-PURE, PLATFORM-AMBIENT, MODEL, REMOTE | unmapped (no ports in this profile) |
| tooling class | `tools/**`, `scripts/*.mjs` (role `BUILD` in the checker, 250-line limit) |

Text representation (application convention kept from the predecessor §0): a character is a code point held as a number; UTF-16 strings exist only at the browser boundary; no counting or indexing by UTF-16 unit. This applies C-16a to text.

## Core rule mapping

`check-standards.mjs` and `verify-build.mjs` still emit v2.2 section numbers. Correspondence to 1.0.1.1 core rules:

| v2.2 section | Core rule |
|---|---|
| §0, §1 roles, import direction, purity | C-1, C-2, C-3, C-4 |
| §1.6, §3.5 single sourcing | C-5 |
| §2 state | C-7, C-8, C-9 |
| §3.1–§3.4 limits | C-11, C-12, C-13 |
| §3.2, §3.8, §3.9 one export, names, barrels | C-6, TS-7 |
| §3.6 dead code | C-20 |
| §3.7, §11 exceptions | C-27 |
| §4 test identifiers | C-18 |
| §5 data | C-14, C-15 |
| §6 indexing | C-16a |
| §7 gating, §7.6 size | C-19, C-21 |
| §8 tests | C-22, C-23 |
| §9 libraries | C-24 |
| §10 license | C-26 |
| §17 standalone target | profiles §2.1, §3.1; artifact contract |
| New in 1.0.x without a v2.2 counterpart | C-31 (EXC-0003), CI runner pinning under C-19 (done, EXC-0004 records the review date) |

## Enforcement matrix

Commands are the repository's actual scripts. "Automated" runs in CI through `npm run build` (check, check:standards, lint:dead, lint:secrets, test:run, bundle, verify), `npm run verify:regenerated` and the e2e job; "manual-review" is checked in architecture and compliance reviews until the listed exception closes.

| Core rule | Mechanism | Command | Enforcement |
|---|---|---|---|
| C-19 gating | Composed build fails on first stage | `npm run build` | automated |
| C-1, C-2 role mapping and import direction | role table in `check-standards.mjs`; unmapped file fails | `npm run check:standards` | automated |
| C-3 no ambient effects in PURE, STATE | identifier scan (`document`, `window`, `navigator`, `location`, `Date.now`, `Math.random`) | `npm run check:standards` | automated |
| C-6, TS-7 one export, filename matches, no barrels, no shape names | `check-standards.mjs` §3.2, §3.8, §3.9 | `npm run check:standards` | automated |
| C-11 function length ≤ 20 | TypeScript compiler API walk | `npm run check:standards` | automated |
| C-12 role file limits | PURE-CORE 100, PURE/STATE/CONTROLLER 150, VIEW/BUILD 250 | `npm run check:standards` | automated |
| C-14, C-15 data external and verified | generated tables regenerated from the hash-verified UCD and compared | `npm run verify:regenerated` | automated |
| C-16a code-point indexing | convention above | | manual-review |
| C-18 stable test IDs | `scripts/testid-manifest.json`; duplicate and required-ID assertions | `npm run verify:build` | automated |
| C-20 dead code | knip (unused files, exports, types, dependencies) | `npm run lint:dead` | automated |
| C-21 size budget | `scripts/build-baseline.json` gzip × 1.05 | `npm run verify:build` | automated |
| C-22, C-23 tests, determinism | Vitest, Playwright over `file://` | `npm run test:run`, `npm run test:e2e` | automated |
| C-24 dependency policy | no runtime dependencies; build tools reviewed | | manual-review |
| C-26 license inventory | `THIRD_PARTY_LICENSES.md`, `fonts/manifest.json` (OFL/CC0 only) | | manual-review (EXC-0002) |
| C-27 exceptions | `.architecture-exceptions.json`, expiry checked | `npm run check:standards` | automated |
| C-31 no secrets | secretlint preset-recommend over the tree (binaries, generated data and lockfile ignored) | `npm run lint:secrets` | automated |
| Artifact contract, profile §3.5 network = none, §2.1 no storage | `verify-build.mjs`: no fetch/CDN/storage APIs, CSP, polyglot XHTML, CDATA wrapping, no comments | `npm run build:bundle && npm run verify:build` | automated |
| C-19 runner pinning | `ubuntu-24.04` in both workflows | | automated (EXC-0004 review date) |

## Extensions

Application-level conventions that are not hub rules and stay here:

- Font provenance: a font enters `fonts/manifest.json` with source URL, version, SHA-256, license and measured coverage or it does not build (`AGENTS.md` rule 5; `docs/PLAN.md` D-4, D-6, D-12).
- Generated artifacts (`Unicode.html`, `src/data/*.json`) are committed with their sources and regeneration-checked.
- Versions move only through `npm run release -- <app|data> <version>` with a CHANGELOG section first; the app and data tracks are versioned independently.

## Exceptions

Open entries with owner and review date: [`.architecture-exceptions.json`](../.architecture-exceptions.json) (EXC-0002 C-26, EXC-0004 runner pin; EXC-0001 and EXC-0003 closed 2026-10-30). An expired entry fails `npm run check:standards`.
