---
title: Full character name coverage from UnicodeData.txt
---
# Full Character Name Coverage from UnicodeData.txt

## What & Why
Currently only ~1,000 characters in a handpicked `CN` table have proper names. All others (Greek, Cyrillic, Hebrew, Arabic, Devanagari, Thai, and the vast majority of Unicode) display the fallback "U+XXXX" instead of their actual Unicode name. This is the most visible correctness gap in the app.

The build script already fetches `UnicodeData.txt` at build time. The same fetch should be used to extract all character names and embed a complete lookup table, replacing the handpicked `CN` entries.

Algorithmic ranges (CJK Unified Ideographs, Hangul Syllables, Tangut, Nushu, Khitan) do not need to be stored since `getAlgoName()` already handles them at runtime. Everything else — roughly 35,000 named characters — should be extracted and embedded.

## Done looks like
- Every assigned character in every block shows its correct Unicode name in the tooltip and Table view Name column
- Algorithmic ranges (CJK, Hangul, etc.) still use the runtime algorithm — no data duplication
- Controls, surrogates, PUA, and noncharacters still show their existing category labels
- `Unicode.html` file size increase is acceptable (target: under 400 KB total)

## Out of scope
- Changes to algorithmic name generation
- Name aliases or correction aliases (NameAliases.txt) — official names only

## Tasks
1. **Extract names at build time** — After fetching `UnicodeData.txt`, parse the name field (column 1) for every non-algorithmic, non-control, non-surrogate, non-PUA code point. Build a compact JS map `{cp: "NAME", ...}` covering all named characters.

2. **Replace the handpicked CN table** — Remove the existing handpicked `charnames.js` CN entries and replace with code that loads the build-time-generated name map. The algorithmic logic (`ALGO_RANGES`, `hangulName`, category labels) stays unchanged.

3. **Compact serialization** — Emit the name map as a minified JS object literal injected inline (similar to how `UNASSIGNED` is injected). Use hex code points as numeric keys to keep size small. Verify final file size stays under 400 KB.

4. **Rebuild and verify** — Rebuild `Unicode.html`, spot-check names in Greek, Cyrillic, Hebrew, Arabic, Devanagari, and Emoji blocks, and confirm the Table view Name column shows correct names for all checked blocks.

## Relevant files
- `scripts/src/unicode/build.ts`
- `unicode-src/data/charnames.js`
- `unicode-src/js/00-classify.js`