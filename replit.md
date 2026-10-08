# Unicode Character Explorer

Read [`AGENTS.md`](AGENTS.md) first, then [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The
plan of record is [`docs/PLAN.md`](docs/PLAN.md); work only on the active phase.

## Shape

- `unicode-src/` — application source (template, CSS, JS, data, font config). Edit here.
- `Unicode.html` — **generated** single-file app. Never edit by hand; rebuild and commit with the
  source change.
- `tools/build/assemble.ts` — the build (`npm run build:bundle`; `--watch` for rebuild on change).
- `tools/ucd/`, `data/ucd/<version>/` — UCD parsing and the vendored, hash-verified data it reads.
- `scripts/` — verify-build, verify-regenerated, check-standards, release, test-ID manifest, size baseline.
- `fonts/manifest.json` — font provenance and edition definitions. No binaries are committed.
- `docs/tasks/` — historical task records.

## Checks

```
npm ci
npm run build && npm run verify:regenerated && npm run test:e2e
```

This repository is not deployed on Replit at present (`docs/PLAN.md` D-7). If it returns, run it
the way history-and-prehistory does: a Vite dev/preview server bound to `0.0.0.0:5000`, no Express.

## Standards

All code follows [`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) (v2.2). §0 maps layer
roles to this repository's paths. The canonical source is the `programming` project knowledge
wiki page `concepts/coding-architecture-standards`; the in-repo file is a derived copy.
