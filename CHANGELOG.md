# Changelog

App releases. The data track (Unicode Character Database snapshot plus font manifest) is
versioned independently; see `docs/PLAN.md` Q-7.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are four-part,
`MAJOR.MAJORFIX.MINORFIX.SPELLING`, and are **not** semver — see
[`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) §12.

## [Unreleased]

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
