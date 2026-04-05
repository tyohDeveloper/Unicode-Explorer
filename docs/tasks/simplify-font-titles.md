# Simplify Font Titles in fonts.json

## What & Why
The `title` fields in `fonts.json` currently list the specific font family names within each stack (e.g. "Sans-serif — CJK: Noto Sans CJK, Microsoft YaHei, Hiragino..."). This creates a maintenance burden because the titles drift out of sync whenever font stacks change. Simplify them to just the generic category name.

## Done looks like
- All `title` fields in `fonts.json` use short, generic labels with no font family names listed
- Hover tooltips on the font buttons in the UI reflect the simplified text

## Out of scope
- Changes to font stacks themselves
- Any other changes to fonts.json structure

## Tasks
1. Replace each `title` value in `fonts.json` with a concise generic label: System UI, Serif, Sans-serif, Monospace, Cursive, Fantasy, 仿宋 (FangSong), Math.

## Relevant files
- `unicode-src/config/fonts.json`
