---
title: Add CJK monospace fonts to Mono button font stack
---
---
title: Add CJK monospace fonts to Mono button font stack
---
# Add CJK monospace fonts to Mono button stack

## What & Why
The Mono button currently has no CJK coverage. Prepend CJK-aware monospace fonts
so CJK codepoints render with proper fixed-width glyphs; Latin/other scripts fall
through to the existing Cascadia Code / Fira Code / Consolas chain.

## Change in unicode-src/template.html

Mono radio button value — replace:
  'Cascadia Code','Fira Code',Consolas,'DejaVu Sans Mono',monospace

with:
  'Sarasa Mono SC','Sarasa Mono TC','Sarasa Mono J','Sarasa Mono K','Noto Sans Mono CJK','Maple Mono','MS Gothic',NSimSun,MingLiU,'Cascadia Code','Fira Code',Consolas,'DejaVu Sans Mono',monospace

Also update the tooltip title to mention CJK coverage.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update Mono label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, Mono label ~line 61)