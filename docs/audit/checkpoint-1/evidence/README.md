# Checkpoint 1 evidence

Scripts behind the numbers in `../report.md`. They expect Unicode 17.0.0 UCD files in `/tmp/ucd`
(`UnicodeData.txt`, `Blocks.txt`, `DerivedAge.txt`, `PropList.txt`, `DerivedCoreProperties.txt`,
`NameAliases.txt`), the Unicode Font Kit extracted at `/tmp/kit/unicode-font-kit`, and the gap
fonts listed in `../../../fonts/manifest.json` at `/tmp/gapfonts`.

| File | Measures |
|---|---|
| `ucd.py` | Shared UCD parser |
| `check1.py` | Block list versus `Blocks.txt` |
| `check2.py` | Every assigned code point's name versus the app's lookup and algorithmic rules |
| `check3.py` | Visibility classification versus General Category and Default_Ignorable_Code_Point; render-scale counts |
| `cov.py`, `gap.py`, `tiers.py` | Character-map coverage of font files per block and per edition |
| `perf.js` | Playwright over `file://`: startup, full-selection render time, tab order, CSP, network |
| `block_cov.json`, `kit_cmaps.json` | Outputs of `cov.py` |

Phase 2 replaces the hand-run checks (`check1`–`check3`) with unit tests over vendored UCD files.
