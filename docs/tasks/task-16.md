---
title: Add CJK serif fonts to Serif button font stack
---
---
title: Add CJK serif fonts to Serif button font stack
---
# Add CJK serif fonts to Serif button stack

## What & Why
The Serif font-selector button currently leads with Georgia for CJK codepoints,
which means CJK characters fall back to a generic serif and often render poorly.
Prepend 8 CJK-specific serif fonts so CJK scripts render with proper glyphs
while Latin/Greek/etc still fall through to Georgia → Times New Roman → Noto Serif.

## Change in unicode-src/template.html

Serif radio button value — replace:
  Georgia,'Times New Roman','Noto Serif',serif

with:
  'Noto Serif CJK SC','Noto Serif CJK TC','Noto Serif CJK JP','Noto Serif CJK KR','Source Han Serif SC','Source Han Serif TC','Source Han Serif JP','Source Han Serif KR',Georgia,'Times New Roman','Noto Serif',serif

Also update the tooltip title to mention CJK coverage.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update Serif label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, Serif label ~line 62)