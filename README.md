# Unicode Character Explorer

Browse every Unicode block, inspect characters by name and code point, and compose text from
them. Ships as **one HTML file** that runs offline from `file://`, stores nothing, and makes no
network requests.

> **Status:** app **v1.0.0.0** ([changelog](CHANGELOG.md)), Unicode **17.0** data, 346 blocks,
> 397 KiB. Unicode 18.0 (September 2026) is scheduled for Phase 6 of [`docs/PLAN.md`](docs/PLAN.md).
> Fonts are not yet embedded, so glyph display depends on the device; embedded coverage editions
> arrive in Phase 4.

## Use

Open `Unicode.html` in a browser. Select blocks in the sidebar; switch between Grid, Grid+CP,
Grid+Name, Table, and Plain views; filter by character name; click any character to add it to
the composition pad; copy the output.

## Build

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/scripts build:unicode   # writes Unicode.html
pnpm --filter @workspace/scripts watch:unicode   # rebuild on change
```

The build currently fetches `UnicodeData.txt` from unicode.org; Phase 2 vendors it. The built
file is byte-reproducible: a clean rebuild at a given commit matches the committed `Unicode.html`.

### Running on Replit

`artifacts/api-server` is a small Express server that serves `Unicode.html` at `/` for the
Replit deployment. It is hosting glue, not part of the application, and goes away once hosting
is decided (`docs/PLAN.md` Q-6).

## Editions (planned, Phase 4)

| Edition | Embedded fonts | Guaranteed glyphs | Size |
|---|---|---:|---:|
| Standard (default) | Unifont, Unifont Upper, Last Resort HE | 77,874 (48.9%) + placeholders | ~2.4 MiB |
| Complete | + Jigmo2/3, Noto Cuneiform, Anatolian Hieroglyphs, Bamum, Tangut | 154,164 (96.7%) | ~24.7 MiB |
| Complete + Hieroglyphs | + UniHieroglyphica | 159,230 (99.9%) | ~32.9 MiB |

Measured against the 159,375 visible assigned Unicode 17 characters. Coverage is a
character-map measurement, not a guarantee of shaping or style. See
[`fonts/manifest.json`](fonts/manifest.json) for provenance and licenses.

## Repository

- [`AGENTS.md`](AGENTS.md): the rules most likely to be broken by accident.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): binding architecture for this repo.
- [`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md): coding and architecture standards v2.2.
- [`docs/PLAN.md`](docs/PLAN.md): decisions, editions, phases.
- [`docs/audit/checkpoint-1/`](docs/audit/checkpoint-1/): the audit this plan answers.
- [`docs/tasks/`](docs/tasks/): historical task records from the Replit build-out.

## License

Code is [MIT](LICENSE). Fonts keep their own licenses (OFL, CC0); see
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
