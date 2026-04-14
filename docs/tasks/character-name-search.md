# Character Name Search

## What & Why
Add a character name search field so users can filter the rendered output by Unicode character name (e.g. typing "snowflake" or "latin small letter a" shows only the matching characters). The existing sidebar search only filters the block list — this targets the characters themselves.

## Done looks like
- A search input labelled "Filter by name" appears in the controls bar (or below the sidebar block search)
- Typing a query filters the rendered output in real time so only characters whose Unicode names contain the query string are shown (case-insensitive substring match)
- The character count in the status bar reflects the filtered result
- Clearing the search restores the full output
- The filter works across all display modes (Grid, Grid+CP, Grid+Name, Table, Plain)
- An empty query shows all characters from the selected blocks (no change to existing behaviour)

## Out of scope
- Regex or wildcard syntax in the search query
- Searching by code point hex value (separate concern)
- Changing how the block selection sidebar works

## Tasks
1. **Name filter input** — Add a "Filter by name" text input to the template. Wire up an `input` event listener that debounces and stores the current query, then triggers a re-render.
2. **Filter integration in render core** — In `renderOutput`, after building `allCP`, apply the name filter: if a query is set, remove entries whose `charName(cp)` does not contain the query string (case-insensitive). Update the character count to reflect the filtered set. Pass the filtered array to the existing renderer functions unchanged.
3. **Build rebuild** — Re-run the build script so `Unicode.html` reflects all source changes.

## Relevant files
- `unicode-src/template.html`
- `unicode-src/js/01-sidebar.js`
- `unicode-src/js/02-render-core.js`
- `unicode-src/style.css`
- `scripts/src/unicode/build.ts`
