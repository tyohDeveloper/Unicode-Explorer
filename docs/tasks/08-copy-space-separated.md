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
   - If mode is `"grid"`: query `#output .gc:not(.cell-reserved)`, map to `textContent`, join with `" "`
   - If mode is `"gridcp"`: query `#output .glyph`, map to `textContent`, join with `" "`
   - If mode is `"table"`: query `#output td.td-ch.clickable`, map to `textContent.trim()`, filter empty, join with `" "`
   - If mode is `"plain"`: use `document.querySelector("#plain-text-out").textContent` (already space-joined)
2. Run `pnpm --filter @workspace/scripts build:unicode` to rebuild
3. Restart the server workflow

## Relevant files
- `unicode-src/js/03-controls.js:34-46`
- `unicode-src/js/02-render.js:160-175`
