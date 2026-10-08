# Unicode Character Explorer

Browse every Unicode block, inspect characters by name and code point, and compose text from
them. Ships as **one HTML file** that runs offline from `file://`, stores nothing, and makes no
network requests.

> **Status:** app **1.1.0.0** ([changelog](CHANGELOG.md)), data **1.0.0.0** (Unicode 17.0.0,
> [data changelog](data/CHANGELOG.md)), 346 blocks, 398 KiB. Unicode 18.0 (September 2026) is
> scheduled for Phase 6 of [`docs/PLAN.md`](docs/PLAN.md). Fonts are not yet embedded, so glyph
> display depends on the device; the Standard edition and sidecar font packs arrive in Phase 4.

## Use

Open `Unicode.html` in a browser. Select blocks in the sidebar; switch between Grid, Grid+CP,
Grid+Name, Table, and Plain views; filter by character name; click any character to add it to
the composition pad; copy the output.

## Build

```bash
npm ci
npm run build              # typecheck -> standards lint -> unit tests -> bundle -> verify
npm run verify:regenerated # committed Unicode.html matches its sources
npm run test:e2e           # Playwright against the built artifact over file://
npm run build:bundle       # just rebuild Unicode.html
npx tsx tools/build/assemble.ts --watch
```

The build reads the vendored Unicode Character Database under `data/ucd/<version>/`, verifies
its SHA-256 hashes, and never touches the network. Output is byte-reproducible: a clean rebuild
at a given commit matches the committed `Unicode.html`, and CI checks that.

### Hosting

None at present. The file runs from disk. If the app returns to Replit or a similar service,
follow the [history-and-prehistory](https://github.com/tyohDeveloper/history-and-prehistory)
pattern (`vite dev`/`vite preview` bound to `0.0.0.0:5000`), not a server (`docs/PLAN.md` D-7).

## Editions (planned, Phase 4)

| Edition | Fonts | Guaranteed glyphs |
|---|---|---:|
| Standard (`Unicode.html`, ~2.4 MiB) | Unifont, Unifont Upper, Last Resort HE embedded | 77,874 (48.9%) + placeholders |
| Complete (zip) | Standard + sidecar packs: Jigmo2/3, Noto Cuneiform, Anatolian Hieroglyphs, Bamum, Tangut | 154,164 (96.7%) |
| Complete + Hieroglyphs (zip) | Complete + UniHieroglyphica pack | 159,230 (99.9%) |

The packs live in a sibling `unicode-fonts/` directory and load on demand when a block needs
them; without the directory the app runs as Standard
([ADR-0001](docs/adr/0001-sidecar-font-packs.md)). Measured against the 159,375 visible assigned
Unicode 17 characters. Coverage is a character-map measurement, not a guarantee of shaping or
style. See [`fonts/manifest.json`](fonts/manifest.json) for provenance and licenses.

## Repository

- [`AGENTS.md`](AGENTS.md): the rules most likely to be broken by accident.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): binding architecture for this repo.
- [`docs/CODING-STANDARDS.md`](docs/CODING-STANDARDS.md): coding and architecture standards v2.2.
- [`docs/PLAN.md`](docs/PLAN.md): decisions, editions, phases. [`docs/adr/`](docs/adr/): decision records.
- [`docs/audit/checkpoint-1/`](docs/audit/checkpoint-1/): the audit this plan answers.
- [`docs/tasks/`](docs/tasks/): historical task records from the Replit build-out.

## License

Code is [MIT](LICENSE). Fonts keep their own licenses (OFL, CC0); see
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
