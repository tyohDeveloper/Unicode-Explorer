# Fix Grid+CP Copy Button Bug

## What & Why
The "Copy output" button silently copies nothing when Grid+CP mode is active. The mode selector check in the copy handler uses `"gridcp"` but the radio button's actual value is `"grid-cp"` (with a hyphen), so it falls through to the table-row selector which finds no elements in grid mode.

## Done looks like
- Clicking "Copy output" in Grid+CP mode copies all visible glyphs separated by spaces, same as Grid mode
- Copy still works correctly in Grid, Table, and Plain modes (no regression)

## Out of scope
- Any changes to Grid+CP rendering or layout

## Tasks
1. **Fix the mode string** — Change `mode === "gridcp"` to `mode === "grid-cp"` in the copy button handler, then rebuild `Unicode.html`.

## Relevant files
- `unicode-src/js/03-controls.js:43`
