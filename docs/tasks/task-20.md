---
title: Add CJK fonts to Fantasy button font stack
---
---
title: Add CJK fonts to Fantasy button font stack
---
# Add CJK fonts to Fantasy button stack

## What & Why
The Fantasy button currently has no CJK coverage: Papyrus,Impact,fantasy.
Prepend Noto Sans CJK SC and Source Han Sans SC so CJK codepoints render
with real glyphs; Latin/other scripts fall through to Papyrus/Impact as before.

## Change in unicode-src/template.html

Fantasy radio button value — replace:
  Papyrus,Impact,fantasy

with:
  'Noto Sans CJK SC','Source Han Sans SC',Papyrus,Impact,fantasy

Also update the tooltip title to mention CJK coverage.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update Fantasy label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, Fantasy label ~line 66)