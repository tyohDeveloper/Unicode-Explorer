---
title: Fix sticky table header gap
---
# Fix: Sticky Table Header Gap

## What & Why
The table's `thead` uses `position: sticky; top: 0` but its scroll container
(`#output-wrap`) has `padding: 16px 20px`. The 16px top padding creates a gap
between the scroll container's edge and where the sticky header anchors at `top: 0`.
As the user scrolls, rows slide into that 16px gap and appear ABOVE the header.

## Done looks like
- The sticky header sits flush against the very top of the scroll area — no gap
- Table rows scroll cleanly beneath the header; none ever appear above it
- Top spacing above content is visually unchanged (still ~16px before the first row)
- Grid, Plain, and Placeholder views are unaffected

## Tasks
1. In `unicode-src/style.css`:
   - Change `#output-wrap` padding from `padding: 16px 20px` to `padding: 0 20px 16px`
     (remove top padding; keep right, bottom, left)
   - Add `padding-top: 16px` to the `#output` rule
     (padding on `#output` scrolls with content, so sticky `top: 0` has no gap)
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart the server workflow

## Out of scope
- Changing any other layout spacing
- Modifying the sort logic or table structure

## Relevant files
- `unicode-src/style.css:82-83`