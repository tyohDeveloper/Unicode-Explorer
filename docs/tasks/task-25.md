---
title: Fix stray quote in Sans font stack
---
# Fix stray quote in Sans font stack

## What & Why
The Sans stack in fonts.json has an accidental leading `'` making the first entry `''Source Han Sans'` instead of `'Source Han Sans'`. This causes the browser to silently skip Source Han Sans entirely when that font button is active.

## Done looks like
- Sans stack begins with `'Source Han Sans'` (single quotes, no doubling)
- `Unicode.html` is rebuilt and the fix is present in the output

## Out of scope
- Any other font stacks or settings

## Tasks
1. **Remove stray quote** — Fix `''Source Han Sans'` → `'Source Han Sans'` in the Sans stack entry, then rebuild `Unicode.html`.

## Relevant files
- `unicode-src/config/fonts.json`