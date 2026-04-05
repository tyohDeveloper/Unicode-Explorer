---
title: Update 仿宋 button font stack with improved cross-platform coverage
---
# Update 仿宋 (Fangsong) font stack

## What & Why
Current stack: FangSong,STFangsong,'FZFangSong-Z02',fangsong,serif
Replace with a broader cross-platform set covering Windows, Adobe, TeX/Linux,
the CSS fangsong generic, and Noto Serif CJK SC as a final serif fallback.

## Change in unicode-src/template.html

仿宋 radio button value — replace:
  FangSong,STFangsong,'FZFangSong-Z02',fangsong,serif

with:
  FangSong,SimFang,'Adobe Fangsong Std',cwTeXFangSong,fangsong,'Noto Serif CJK SC',serif

Also update the tooltip title to reflect the new stack.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update 仿宋 label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, 仿宋 label ~line 67)
