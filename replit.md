# Unicode Character Explorer

Read [`AGENTS.md`](AGENTS.md) first, then [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The
plan of record is [`docs/PLAN.md`](docs/PLAN.md); work only on the active phase.

## Shape

- `unicode-src/` — application source (template, CSS, JS, data, font config). Edit here.
- `Unicode.html` — **generated** single-file app. Never edit by hand; rebuild and commit with the
  source change.
- `scripts/src/unicode/build.ts` — the build. `pnpm --filter @workspace/scripts build:unicode`
  (one shot) or `watch:unicode`.
- `artifacts/api-server/` — Express server that serves `Unicode.html` at `/` and `/unicode` for
  the Replit deployment. Hosting glue only; not part of the app.
- `fonts/manifest.json` — font provenance and edition definitions. No binaries are committed.
- `docs/tasks/` — historical task records.

## Checks

```
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/scripts build:unicode
```

The build must leave `Unicode.html` unchanged unless the commit intends to change it.

## Standards

All code follows [`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md) (v2.2). §0 maps layer
roles to this repository's paths. The canonical source is the `programming` project knowledge
wiki page `concepts/coding-architecture-standards`; the in-repo file is a derived copy.
