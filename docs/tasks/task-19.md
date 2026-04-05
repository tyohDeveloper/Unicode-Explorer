---
title: Add CJK Kai fonts to Cursive button font stack
---
---
title: Add CJK Kai fonts to Cursive button font stack
---
# Add CJK Kai fonts to Cursive button stack

## What & Why
Kai (楷体) is the CJK calligraphic style that corresponds to the CSS cursive generic.
Prepend CJK Kai fonts before the existing Western cursive names so CJK scripts
render in the appropriate calligraphic style.

## Change in unicode-src/template.html

Cursive radio button value — replace:
  'Segoe Script','Brush Script MT','Comic Sans MS',cursive

with:
  KaiTi,SimKai,STKaiti,'DFKai-SB',KaiU,'TW-Kai','TW-Kai-Plus',kai,'Noto Serif CJK SC','Segoe Script','Brush Script MT','Comic Sans MS',cursive

Also update the tooltip title to mention CJK Kai coverage.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update Cursive label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, Cursive label ~line 65)