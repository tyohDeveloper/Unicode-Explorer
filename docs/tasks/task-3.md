---
title: Sortable table column headers
---
# Sortable Table Column Headers

## What & Why
The Table view lists characters in code-point order only. Clicking column headers to sort ascending/descending makes it easy to find characters by name or group them by block — a standard data-table interaction.

## Done looks like
- Clicking "Code Point", "Ch", "Name", or "Block" column headers sorts the table on that column
- First click = ascending, second click on same header = descending; clicking a different header resets to ascending
- Active sort column shows a ▲ or ▼ indicator in the header
- Sort is stable (rows that compare equal keep their original relative order)
- Sort state resets to default (code point ascending) when the user changes block selection or switches away from Table mode and back

## Out of scope
- Persisting sort state across page reloads
- Sorting in Grid or Plain modes

## Tasks
1. **Sort state and header click handlers** — In `02-render.js`, maintain a sort-state object (column + direction). In `renderTable()`, make each `<th>` clickable: clicking toggles direction or changes the active column, then re-renders the table.

2. **Stable sort implementation** — Before building the `<tbody>` rows, sort the flat character array using `Array.prototype.sort` (stable in all ES2019+ engines). Comparators: code point = numeric, ch = same as code point, name = locale string compare, block = string compare then code point as tiebreaker.

3. **Sort indicator styling** — In `style.css`, add a small ▲/▼ pseudo-element or text span to the active `<th>`, and a `cursor:pointer` on all sortable headers.

4. **Rebuild and restart** — Run `pnpm --filter @workspace/scripts build:unicode` and restart the API server workflow.

## Relevant files
- `unicode-src/js/02-render.js`
- `unicode-src/style.css`