---
title: Copy output: separate characters with spaces
---
# Copy output: spaces not newlines

## What & Why
The "Copy output" button uses `innerText` on the entire output div, which captures HTML layout newlines between character cells. The result is characters separated by newlines. Users want spaces instead.

## Done looks like
- Clicking "Copy output" in Grid mode produces `A B C D …` (space-separated)
- Same in Grid+CP and Table modes
- Plain mode is already space-separated — no change in behaviour
- Composition Pad "Copy" button is unaffected (it copies typed text as-is)

## Out of scope
- Changing how the Composition Pad copy works
- Adding any copy-format options or UI

## Tasks
1. In `unicode-src/js/03-controls.js`, replace the `btn-copy` click handler's
   `innerText` approach with mode-aware character collection:
   - If `currentMode` is `"grid"` or `"gridcp"`: query all `#output .glyph` spans,
     map to `textContent`, filter out empty/whitespace, join with `" "`
   - If `currentMode` is `"table"`: query all `#output td.td-ch`, map to
     `textContent.trim()`, filter out empty strings, join with `" "`
   - If `currentMode` is `"plain"`: use `document.querySelector("#plain-text-out").textContent`
     which is already space-joined
2. Run `pnpm --filter @workspace/scripts build:unicode` to rebuild
3. Restart the server workflow

## Relevant files
- `unicode-src/js/03-controls.js:34-46`
- `unicode-src/js/02-render.js:160-175`