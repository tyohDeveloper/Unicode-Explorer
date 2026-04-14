# Split render.js into focused modules

## What & Why
`02-render.js` is a 353-line file that mixes three distinct concerns: the main render orchestrator, the grid renderer, and the table renderer (including sort state and sort helpers). Splitting it into three focused files makes each concern easier to read, test, and modify independently without risk of accidentally touching unrelated logic.

## Done looks like
- `unicode-src/js/02-render-core.js` — contains `scheduleRender`, `renderOutput`, `getSelectedBlocks`, `getMode`, `groupByBlock`, `makeSepHeading`, and `insertToComposePad`
- `unicode-src/js/03-render-grid.js` — contains `renderGrid` only
- `unicode-src/js/04-render-table.js` — contains all table-related code: `tableSortState`, `tableSortAllCP`, `tableSortBlocks`, `sortedTableItems`, `buildTableHead`, `buildTableBody`, `makeTableRow`, `applyTableSort`, and `renderTable`
- `unicode-src/js/05-render-plain.js` — contains `renderPlain` only
- `02-render.js` is removed
- `JS_FILES` array in `build.ts` is updated to reference the four new files in the correct dependency order
- The built `Unicode.html` is functionally identical — all modes (Grid, Grid+CP, Table, Plain) continue to work correctly

## Out of scope
- Any logic changes or bug fixes
- CSS changes
- Splitting `01-sidebar.js` or `03-controls.js`

## Tasks
1. **Create the four split files** — extract the relevant functions verbatim from `02-render.js` into `02-render-core.js`, `03-render-grid.js`, `04-render-table.js`, and `05-render-plain.js`. Renumber `03-controls.js` to `06-controls.js` to keep the load order meaningful.
2. **Update the build script** — update the `JS_FILES` array in `build.ts` to remove `js/02-render.js` and add the four new files (plus the renamed controls file) in dependency order. Delete `02-render.js`.
3. **Rebuild and verify** — run `pnpm --filter @workspace/scripts build:unicode` and confirm the output `Unicode.html` still works across all four render modes.

## Relevant files
- `unicode-src/js/02-render.js`
- `unicode-src/js/03-controls.js`
- `scripts/src/unicode/build.ts:40-47`
