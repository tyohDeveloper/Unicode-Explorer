---
title: Prepend Adobe-oriented fonts to Serif, Sans, Cursive, Fantasy stacks
---
# Prepend Adobe fonts to four font stacks

## What & Why
User has an Adobe-oriented workflow and wants Adobe/professional CJK fonts
to take priority in relevant stacks.

## Changes in unicode-src/template.html

### Serif
Prepend 'Source Han Serif' and 'Adobe Song Std' before current first entry.
Old start: 'Noto Serif CJK SC',...
New start: 'Source Han Serif','Adobe Song Std','Noto Serif CJK SC',...

### Sans
Prepend 'Source Han Sans' and 'Heisei Kaku Gothic' before current first entry.
Old start: 'Noto Sans','Noto Sans CJK SC',...
New start: 'Source Han Sans','Heisei Kaku Gothic','Noto Sans','Noto Sans CJK SC',...

### Cursive
Prepend 'Adobe Kaiti Std' before current first entry.
Old start: KaiTi,...
New start: 'Adobe Kaiti Std',KaiTi,...

### Fantasy
Prepend 'Adobe Kaiti Std' before current first entry.
Old start: 'Noto Sans CJK SC',...
New start: 'Adobe Kaiti Std','Noto Sans CJK SC',...

## Steps
1. Edit unicode-src/template.html — update four label value attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, lines ~62–66)
