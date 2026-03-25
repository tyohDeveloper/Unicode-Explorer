---
title: Character composition pad with click-to-insert
---
# Character Composition Pad

## What & Why
Users want to build up a string by clicking characters in the Grid or Table
views. A persistent textarea at the bottom of the main panel lets them click
to insert characters and also type freely, acting as a scratch pad for
composing text from Unicode characters.

## Done looks like
- A collapsible "Composition Pad" panel appears below the output area in the
  main column, with a toggle button to show/hide it
- Clicking any character cell in Grid or Grid+CP view inserts that character
  into the pad at the current cursor position (or appends if no cursor is set)
- Clicking the "Ch" cell of any row in Table view does the same
- The pad is a real textarea: users can type freely, use backspace, move the
  cursor, select text, etc.
- A "Clear" button empties the pad; a "Copy" button copies its contents to
  the clipboard
- The pad persists its contents when the user changes block selection, mode,
  or font — it is not cleared on re-render

## Out of scope
- Inserting from Plain text view (Plain is already selectable text)
- Saving pad contents across page reloads
- Rich formatting or named character lookup inside the pad

## Tasks
1. **HTML template** — Add a compose-pad section to `template.html` below
   the output-wrap div: a collapse toggle button, a `<textarea id="compose-pad">`,
   a Clear button, and a Copy button.

2. **Click-to-insert in render.js** — In `renderGrid()`, attach an onclick to
   each non-reserved cell that calls a shared `insertToComposePad(ch)` helper.
   In `renderTable()`, attach an onclick to the `td.td-ch` cell of each row.
   The helper inserts the character at the textarea's selectionStart/selectionEnd,
   then advances the cursor by one code unit (or two for surrogate pairs).

3. **Pad controls in controls.js** — Wire the Clear button, Copy button, and
   collapse toggle. The collapse toggle shows/hides the pad body and flips a
   ▼/▲ indicator.

4. **Styling** — In `style.css`, style the compose-pad section: fixed height
   textarea (≈ 90px), monospaced large font using `--glyph-font`, dark panel
   background matching the controls bar, and a highlighted border on focus.

5. **Rebuild and restart** — Run `pnpm --filter @workspace/scripts build:unicode`
   and restart the API server workflow.

## Relevant files
- `unicode-src/template.html`
- `unicode-src/js/02-render.js`
- `unicode-src/js/03-controls.js`
- `unicode-src/style.css`