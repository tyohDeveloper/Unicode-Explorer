# Fix: Characters Missing from Grid/Table/Plain

## What & Why
The `isReserved()` function uses a broken heuristic: any code point whose
name falls back to "U+XXXX" (i.e. not in the CN table) is treated as
unassigned and hidden from Table/Plain views. This incorrectly hides
hundreds of valid characters — IPA Extensions, Spacing Modifiers,
Arabic, Devanagari, and many others — because our CN name table only
covers a subset of Unicode's assigned characters.

## Done looks like
- IPA Extensions (U+0250-02AF) shows all characters in Grid, Grid+CP, Table, and Plain modes
- Arabic, Devanagari, and other non-Latin blocks show characters in all views
- No valid assigned character is hidden or shown as a dashed placeholder due to a missing name
- Code points that are truly unassigned render as empty/tofu cells naturally via the font — no special treatment

## Out of scope
- Adding more character names to the CN table (a separate enhancement)
- Re-introducing a reserved-character indicator (requires a proper Unicode unassigned-ranges dataset)

## Tasks
1. **Remove isReserved gating** — In `02-render.js`, remove the `isReserved(cp)` check from `renderOutput()`. All code points in the selected block range are included in `allCP` regardless; surrogates remain excluded (they are already skipped separately).

2. **Remove the reserved cell rendering** — In `renderGrid()`, remove the `item.reserved` branch. All grid cells render a character glyph (even if the font shows it as a blank or tofu box). Remove the `.reserved` CSS classes from `style.css`.

3. **Clean up isReserved** — Either delete `isReserved()` from `00-classify.js` entirely or leave it stubbed as `return false` with a comment explaining the limitation, for future use when a proper Unicode unassigned-ranges dataset is added.

4. **Rebuild and restart** — Run `pnpm --filter @workspace/scripts build:unicode`, restart the API server workflow, and verify IPA Extensions shows all characters.

## Relevant files
- `unicode-src/js/02-render.js`
- `unicode-src/js/00-classify.js`
- `unicode-src/style.css`
