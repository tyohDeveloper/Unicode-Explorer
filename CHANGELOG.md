# Changelog

App releases. The data track (Unicode Character Database snapshot plus font manifest) is
versioned independently; see `docs/PLAN.md` Q-7.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions are four-part,
`MAJOR.MAJORFIX.MINORFIX.SPELLING`, and are **not** semver — see
[`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) §12.

## [Unreleased]

### Added

- `docs/PLAN.md`: plan of record with decisions D-1 to D-6, open questions, edition
  definitions, and six phases.
- `docs/audit/checkpoint-1/`: audit report, 37-finding register, and evidence scripts
  (baseline commit `e7ad733`).
- `docs/ARCHITECTURE.md`, `AGENTS.md`, `LICENSE` (MIT), `THIRD_PARTY_LICENSES.md`,
  `fonts/manifest.json`, `.architecture-exceptions.json`.

### Changed

- `docs/CODING-STANDARDS.md`: re-propagated v2.2 text with §0 mapped to `unicode-src/` and
  four-part versioning in §12.
- `replit.md` reduced to a pointer at `AGENTS.md`.

### Removed

- Unused Replit scaffold: mockup sandbox, OpenAPI client and schema generation, Drizzle
  database package, third-party agent skills. The Express static server remains until hosting
  (Q-6) is decided.

No application behaviour changed; `Unicode.html` is byte-identical to `v1.0.0.0`.

## [1.0.0.0] — 2026-08-16

Baseline. Unicode 17.0, 346 blocks, five display modes, composition pad, name filter, eight font
stacks, 397 KiB single file. Tagged `v1.0.0.0`.
