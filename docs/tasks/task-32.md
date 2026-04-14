---
title: Split charnames into data and logic
---
# Split charnames into data and logic

## What & Why
`data/charnames.js` bundles two distinct things: the `ALGO_RANGES` configuration table (pure data describing which code point ranges have algorithmically-derivable names) and the resolution functions (`getAlgoName`, `hangulName`, `getCharName`, `hex4`) that use it. Separating them mirrors the pattern used elsewhere in the project — `data/` holds tables, `js/` holds logic — and makes it easy to add new algorithmic name rules without touching resolution code.

## Done looks like
- `unicode-src/data/algo-ranges.js` — contains only the `ALGO_RANGES` array and the `hangulName` helper (pure data/lookup, no DOM or build-injected deps)
- `unicode-src/data/charnames.js` — retains only `getAlgoName`, `getCharName`, and `hex4` (the resolution layer); references `ALGO_RANGES` declared in the new file
- `JS_FILES` in `build.ts` is updated so `data/algo-ranges.js` is loaded before `data/charnames.js`
- Built `Unicode.html` resolves character names identically to before

## Out of scope
- Changes to algorithmic naming logic
- The `CN` name map (injected at build time, not part of this file)
- Any other JS files

## Tasks
1. **Extract `ALGO_RANGES` and `hangulName`** — create `unicode-src/data/algo-ranges.js` containing the `ALGO_RANGES` array and the `hangulName` function. Remove them from `data/charnames.js`.
2. **Update the build script** — insert `data/algo-ranges.js` before `data/charnames.js` in the `JS_FILES` array in `build.ts`.
3. **Rebuild and verify** — run `pnpm --filter @workspace/scripts build:unicode` and confirm all character names resolve correctly, including Hangul syllables, CJK ideographs, and Tangut/Nushu/Khitan entries.

## Relevant files
- `unicode-src/data/charnames.js`
- `scripts/src/unicode/build.ts:40-47`