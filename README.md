# Unicode Character Explorer

Browse every Unicode block, inspect characters by name and code point, and compose text from
them. Ships as **one HTML file** that runs offline from `file://`, stores nothing, and makes no
network requests.

> **Status:** app **2.3.1.1** ([changelog](CHANGELOG.md)), data **2.0.6.0** (Unicode 18.0.0,
> [data changelog](data/CHANGELOG.md)), 353 blocks, 172,808 characters, 2.9 MB. The Standard edition embeds GNU
> Unifont and Last Resort, so every Basic Multilingual Plane character has a glyph and every other
> character has at least a labelled placeholder; the Complete editions add font packs for the
> historic scripts and CJK extensions. No free font yet covers more than a sliver of the new Seal
> and Jurchen scripts, so they show Last Resort placeholders ([`docs/PLAN.md`](docs/PLAN.md) Phase 6).

## Use

Open `Unicode.html` in a browser. Select blocks in the sidebar; switch between Grid, Grid+CP,
Grid+Name, Table, and Plain views; filter by character name; click any character to add it to
the composition pad; copy the output. The selection, view, font, and size are mirrored in the
URL fragment, so bookmarking the page keeps them; nothing is stored on the device.

Requires a browser with `DecompressionStream` (Chrome 103+, Edge 103+, Firefox 113+,
Safari 16.4+), which unpacks the embedded character-name table at start-up.

### Glyph coverage

The output uses your chosen style stack first, then device fonts known to carry rarer scripts,
then any installed font packs, then the embedded Unifont pair. A canvas probe checks every
character against that list: the status bar and each block heading report how many are
**verified** (a listed font renders them) and how many are **unverified** (none does; your
device may still draw them through system fallback, or show a box). Unverified cells are
outlined; the **Placeholders** toggle replaces them with the Last Resort symbol for their block.
Combining marks are drawn on a dotted circle; with **Include non-visible** on, controls and
format characters appear as labelled boxes (NUL, ZWJ, SHY…). The **CJK** selector sets the
language of the output so unified ideographs take the regional glyph forms you expect.

**About** (top right) lists the embedded fonts, their versions and licenses, and which font packs
are present.

### Styles, search and keyboard

With the Complete packs present, **Serif** and **Sans** use the Unicode Font Kit's stacks
(Charis or Andika first, then Noto). **B** and **I** switch to genuine bold and italic faces where
those fonts have them; elsewhere the browser synthesises them, and **No synthesis** shows where.
**Search** takes a name or alias fragment (`snowman`, `zwj`), a code point (`U+2603`, `2603`) or
the character itself. **Emoji** chooses text or colour presentation. Pointing at a character, or
moving to it with the arrow keys, shows its **details**: name, aliases, block, General Category,
Script, Age (the Unicode version that added it), decomposition and whether a font drew it.

Keyboard: the first Tab stop is **Skip to characters**; in the output, arrow keys move, Home and
End jump to the ends of a block, Enter or Space inserts into the composition pad and focus stays
in the grid. Selecting every block paints in a fraction of a second; detection fills in the
counts in the background.

### CSS for your own app

**CSS for selection** writes CSS another programmer can paste into their own page for similar
coverage of the selected blocks: `@font-face` rules pointing at pinned public font URLs (the
same on every device, with the download size and licences in a comment) and a no-download
`font-family` list of fonts found on this device. Characters only GNU Unifont 18 covers get a
commented self-host template with the official download link. It never refers to this app's files.

## Build

```bash
npm ci
npm run build              # typecheck -> standards lint -> unit tests -> bundle -> verify
npm run verify:regenerated # committed src/data and Unicode.html match their sources
npm run test:e2e           # Playwright against the built artifact over file://
npm run generate:data      # regenerate src/data/*.json from data/ucd and data/*.json
npm run build:bundle       # embedded fonts CSS + vite build + minify-artifact -> Unicode.html
npm run dev                # Vite dev server on :5000
npm run fetch:fonts        # (network) download, pin and convert the pack fonts into fonts/cache/
npm run build:packs        # unicode-fonts/ packs and dist/release/*.zip from the cache
```

The build reads the vendored Unicode Character Database under `data/ucd/<version>/` and the
vendored Standard fonts under `fonts/standard/`, verifies their SHA-256 hashes, and never
touches the network. Output is byte-reproducible: a clean rebuild at a given commit matches the
committed `Unicode.html`, and CI checks that. `fetch:fonts` is the one network step and is run
only by the `release` workflow, which attaches the edition zips to each app release.

### Hosting

None at present. The file runs from disk. If the app returns to Replit or a similar service,
follow the [history-and-prehistory](https://github.com/tyohDeveloper/history-and-prehistory)
pattern (`vite dev`/`vite preview` bound to `0.0.0.0:5000`), not a server (`docs/PLAN.md` D-7).

## Editions

| Edition | Download | Fonts | Guaranteed glyphs |
|---|---|---|---:|
| Standard | `Unicode.html` (2.9 MB) | Unifont 18.0.01, Unifont Upper, Fairfax HD (Latin Extended-G), Last Resort 18.000, Adobe Blank 2 embedded | 78,275 (45.4%) + placeholders |
| Complete | `unicode-explorer-complete-<version>.zip` (26 MB) | Standard + packs: Jigmo2/3, Noto Sans Cuneiform, Noto Sans Anatolian Hieroglyphs, Noto Sans Bamum, Noto Serif Tangut; Serif/Sans style packs | 154,565 (89.7%) |
| Complete + Hieroglyphs | `unicode-explorer-complete-hieroglyphs-<version>.zip` (33 MB) | Complete + UniHieroglyphica 19.000 pack | 159,631 (92.6%) |

The zips are attached to each [release](https://github.com/tyohDeveloper/Unicode-Explorer/releases).
Unzip one and open its `Unicode.html`: the packs live in the sibling `unicode-fonts/` directory
and load only when you select a block they cover (no pack is over 8 MB; Extension B is split in two; the
status bar shows progress). Without the directory the same file runs as Standard
([ADR-0001](docs/adr/0001-sidecar-font-packs.md)). Measured against the 172,382 visible assigned
Unicode 18 characters; most of the gap is the 11,328 Seal and 965 Jurchen characters. What is
still missing, block by block, is in [`docs/coverage/missing-glyphs.md`](docs/coverage/missing-glyphs.md)
(`npm run report:gaps`), tracked by the [`font-gap` issues](https://github.com/tyohDeveloper/Unicode-Explorer/issues?q=label%3Afont-gap). Coverage is a character-map measurement, not a guarantee of shaping or
style. See [`fonts/manifest.json`](fonts/manifest.json) for provenance, hashes and licenses; every
font is under the SIL Open Font License or CC0, and the application code is MIT.

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
