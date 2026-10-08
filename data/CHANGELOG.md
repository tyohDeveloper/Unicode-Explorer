# Data changelog

The data track covers the vendored Unicode Character Database snapshot and `fonts/manifest.json`.
It is versioned independently of the app (`docs/PLAN.md` Q-7; four-part, not semver). Tags are
`<version>-data`.

## [1.0.0.0] — 2026-10-08

### Added

- Unicode 17.0.0: `UnicodeData.txt` and `Blocks.txt` vendored under `data/ucd/17.0.0/` with a
  SHA-256 manifest. 346 blocks; 299,382 assigned code points; 40,470 individually named
  characters. The build reads these files offline and fails closed on any mismatch.
- `fonts/manifest.json`: Standard, Complete, and Complete + Hieroglyphs edition definitions with
  provenance, licenses, and measured coverage against 159,375 visible assigned characters.
