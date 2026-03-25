---
title: Phonetic Scripts category + collapse by default
---
# Phonetic Scripts Category + Collapse Defaults

## What & Why
Two sidebar improvements following Wikipedia's "List of Unicode characters" structure:
1. IPA and phonetic extension blocks currently live in "Latin & Extensions" but belong in their own group — Wikipedia separates these as "Phonetic script".
2. All sidebar sections currently start expanded, which creates a very long list on first load. Sections should start collapsed except the topmost one (Latin & Extensions).

## Done looks like
- Sidebar has a new "Phonetic Scripts" category containing: IPA Extensions, Spacing Modifier Letters, Phonetic Extensions, Phonetic Extensions Supplement
- "Latin & Extensions" no longer includes those four blocks
- On page load, only "Latin & Extensions" is expanded; all other categories start collapsed
- Rebuild produces an updated Unicode.html; the API server serves the new version

## Out of scope
- Any other category reorganizations beyond the four blocks listed
- Changes to the CN lookup table or character names
- Visual styling changes

## Tasks
1. **Move phonetic blocks** — In `blocks.js`, change the category field of IPA Extensions, Spacing Modifier Letters, Phonetic Extensions, and Phonetic Extensions Supplement from "Latin & Extensions" to "Phonetic Scripts".

2. **Collapse sidebar by default** — In `01-sidebar.js`, after building the sidebar DOM, iterate all categories except "Latin & Extensions" and apply the collapsed state (add `collapsed` class to the header, `cat-hidden` to all its block items, set `catCollapseState[cat] = true`).

3. **Rebuild and restart** — Run `pnpm --filter @workspace/scripts build:unicode` and restart the API server workflow.

## Relevant files
- `unicode-src/data/blocks.js`
- `unicode-src/js/01-sidebar.js`