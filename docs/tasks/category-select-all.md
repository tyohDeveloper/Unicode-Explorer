# Category Select-All Checkbox

## What & Why
Users want to select or deselect all blocks in a sidebar category at once —
e.g. check all Mathematics blocks with one click rather than checking each
individually. Currently the only bulk controls are global All / None buttons.

## Done looks like
- Each category header has a small checkbox on its left side (before the ▼ toggle)
- Clicking the category checkbox checks all blocks in that category, or unchecks
  them all if they were all already checked
- When some (but not all) blocks in a category are checked, the category checkbox
  shows an indeterminate state (the standard browser half-filled appearance)
- Checking/unchecking individual block rows updates the parent category checkbox
  state accordingly
- The collapse/expand toggle (▼) is a separate click target and is unaffected
- After any category checkbox change, the output auto-updates and the status bar
  reflects the new selection count

## Out of scope
- Nested category groupings (categories remain flat)
- Persisting selection state across page reloads

## Tasks
1. **Add category checkbox to sidebar** — In `01-sidebar.js`, add a checkbox
   element inside each category header `<li>`. Wire its click handler to
   check/uncheck all block items in that category and call `scheduleRender()`
   and `updateStatus()`. Stop event propagation so the checkbox click does not
   also trigger the expand/collapse handler on the `<li>`.

2. **Sync category checkbox state** — Write a helper `syncCatCheck(cat)` that
   reads all block checkboxes for a category and sets the category checkbox to
   checked, unchecked, or indeterminate. Call it from individual block-row
   click handlers and from the existing btn-all / btn-none handlers.

3. **Style the category checkbox** — In `style.css`, align the checkbox inside
   the category header row (flex, vertically centered, accent color). Ensure
   there is no visual collision with the ▼ toggle indicator.

4. **Rebuild and restart** — Run `pnpm --filter @workspace/scripts build:unicode`
   and restart the API server workflow.

## Relevant files
- `unicode-src/js/01-sidebar.js`
- `unicode-src/style.css`
