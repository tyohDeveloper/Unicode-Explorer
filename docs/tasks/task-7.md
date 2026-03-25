---
title: Move Modifier Tone Letters to East Asian category
---
# Move Modifier Tone Letters to East Asian

## What & Why
The "Modifier Tone Letters" block (U+A700–A71F) is currently categorised under "Latin & Extensions" in the sidebar. These characters are tone markers primarily used in transcriptions of Chinese and other East Asian languages, so they belong under "East Asian".

## Done looks like
- "Modifier Tone Letters" no longer appears under "Latin & Extensions" in the sidebar
- It appears under "East Asian" instead
- A fresh Unicode.html is built reflecting the change

## Out of scope
- Moving any other blocks
- Changing the display name of the block

## Tasks
1. In `unicode-src/data/blocks.js` line 138, change `"Latin & Extensions"` to `"East Asian"` for the Modifier Tone Letters entry
2. Run `pnpm --filter @workspace/scripts build:unicode` to rebuild Unicode.html
3. Restart the server workflow

## Relevant files
- `unicode-src/data/blocks.js:138`