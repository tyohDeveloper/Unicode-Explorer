# Unicode Character Explorer

Read [`AGENTS.md`](AGENTS.md) first, then [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The
plan of record is [`docs/PLAN.md`](docs/PLAN.md); work only on the active phase.

## Shape

- `src/`, `index.html` — application source: TypeScript ES modules by layer (see
  `docs/CODING-STANDARDS.md` §0) and the HTML shell. Edit here.
- `data/` — authored JSON tables and the vendored, hash-verified UCD under `data/ucd/<version>/`.
- `src/data/` — **generated** tables (`npm run generate:data`). Never edit by hand.
- `Unicode.html` — **generated** single-file app (`npm run build:bundle` = Vite + minify-artifact).
  Never edit by hand; rebuild and commit with the source change.
- `tools/ucd/` — UCD parsing and generation.
- `scripts/` — verify-build, verify-regenerated, check-standards, release, test-ID manifest, size baseline.
- `fonts/manifest.json` — font provenance and edition definitions. No binaries are committed.
- `docs/tasks/` — historical task records.

## Checks

```
npm ci
npm run build && npm run verify:regenerated && npm run test:e2e
```

This repository is not deployed on Replit at present (`docs/PLAN.md` D-7). If it returns,
`npm run dev` / `npm run preview` already bind Vite to `0.0.0.0:5000`; no server is needed.

## Standards

All code follows [`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) (v2.2). §0 maps layer
roles to this repository's paths. The canonical source is the `programming` project knowledge
wiki page `concepts/coding-architecture-standards`; the in-repo file is a derived copy.
