# Grid+Name Display Mode

## What & Why
Add a new "Grid+Name" display mode to the Unicode Character Explorer. It renders characters in a fixed 4-column layout (columns headed +0, +1, +2, +3) where each cell shows the glyph, the code point in `U+XXXX` format, and the official Unicode character name — mirroring the style of traditional Unicode code charts.

## Done looks like
- A new "Grid+Name" radio button appears in the controls bar between Grid+CP and Table
- The output is a 4-column table-like grid; column headers read `+0  +1  +2  +3`
- Each cell contains: glyph on top, `U+XXXX` code point below it, and the character name below that
- Reserved/unassigned cells show their code point and "(reserved)" in place of a name
- Names that are too long are clipped with an ellipsis
- Clicking a character still inserts it into the Composition Pad
- The existing Grid, Grid+CP, Table, and Plain modes are unchanged

## Out of scope
- Changing the Table view or any existing mode
- Row address labels in the leftmost column (just the +0…+3 column headers are needed)

## Tasks
1. **Template** — Add a `Grid+Name` radio button (`value="grid-name"`) in the `.mode-btns` group, between Grid+CP and Table.
2. **CSS** — Add styles for the new `char-grid-name` container: a 4-column CSS grid with a header row showing `+0 +1 +2 +3`. Each cell (`gcn` class) stacks three elements — glyph, code point, name — with the name using a small sans font and `overflow: hidden; text-overflow: ellipsis`.
3. **Render grid** — Add a `renderGridName` function that groups characters into rows of 4, emits the `+0…+3` header row per block section, then renders each character cell with `<span class="glyph">`, `<span class="cp">U+XXXX</span>`, and `<span class="cn">name</span>`. Reserved cells get a placeholder name.
4. **Render core** — Wire `"grid-name"` into `renderOutput()` calling `renderGridName`, and include it in the `output.className = "grid-mode"` branch.

## Relevant files
- `unicode-src/template.html`
- `unicode-src/style.css`
- `unicode-src/js/03-render-grid.js`
- `unicode-src/js/02-render-core.js`
