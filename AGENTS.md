# Working in this repo

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) first. It is short and it is binding.
[`docs/PLAN.md`](docs/PLAN.md) is the plan of record; check which phase is active before
proposing work from a later one.

The six rules most likely to be violated by accident:

1. **No `fetch()`, no CDN, no external font URLs at runtime.** Everything inlines. Fonts are
   `data:` URLs. A runtime request fails from `file://`, is blocked by the CSP, and fails the
   build check.
2. **No `localStorage` / `IndexedDB` / cookies.** Session state is in-memory only. Use
   `location.hash` if state must survive a reload.
3. **`Unicode.html` and `src/data/*.json` are generated.** Edit `src/`, `index.html`, or
   `data/`, then `npm run generate:data && npm run build:bundle`, and commit source and output
   together; CI rejects a committed artifact or table that does not match its sources.
4. **The Unicode version is one build input.** Do not add a block, range, or name by hand; it
   derives from the vendored, hash-verified Unicode Character Database in `data/ucd/<version>/`.
   Authored tables live in `data/*.json`, never as literals in code. A new test ID means updating
   `scripts/testid-manifest.json` in the same change; generated IDs use the domain key (code
   point hex, category slug), never an index.
5. **Fonts need provenance.** A font enters `fonts/manifest.json` with source URL, version,
   SHA-256, license (OFL or CC0 only), and measured coverage, or it does not build. `npm run
   fetch:fonts` is the only network step and pins hashes on first fetch; `fonts/cache/` and
   `unicode-fonts/` are never committed; `fonts/standard/*.woff2` are vendored and must equal the
   converter's output from the pinned upstream bytes. `data/web-fonts.json` is measured by
   `tools/fonts/buildWebFontTable.ts` from the Unicode Font Kit checkout and committed; rerun it
   when fonts or the Unicode version change. No Egyptian-hieroglyph font ships in
   Standard or Complete (`PLAN.md` D-4).
6. **Never put a full-coverage font (Last Resort, Adobe Blank) in the global font stack.** It
   is applied per cell by detection (`PLAN.md` D-6). Detection says verified or unverified,
   never "missing": it cannot see system fallback (`PLAN.md` D-12).

Verify with `npm run build && npm run verify:regenerated && npm run test:e2e`. All three must
pass. Versions move only through `npm run release -- <app|data> <version>`, which requires a
CHANGELOG section first.

## Coding & architecture standards

All code in this repository follows **[`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md)** — the binding rules for layer boundaries, purity, function and file size limits, naming, data externalization, testing, and dependency budgets. Read it before making changes.

Key hard limits: every function body ≤ 20 lines; one export per pure-logic file, named for the file; pure-core files ≤ 100 lines, other pure/state/controller files ≤ 150, view files ≤ 250; no `document`/`window`/timers in PURE or STATE; no barrel files. §0 of that file maps those layer roles to this repository's directories and `npm run check:standards` enforces it. There are no active exceptions; the register is [`.architecture-exceptions.json`](.architecture-exceptions.json).

The canonical source of truth is the `programming` project knowledge wiki page `concepts/coding-architecture-standards`; the in-repo file is a derived copy. Amend the wiki first, then propagate here.
