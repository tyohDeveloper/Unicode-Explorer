---
title: Add CJK sans-serif fonts to Sans button font stack
---
---
title: Add CJK sans-serif fonts to Sans button font stack
---
# Add CJK sans-serif fonts to Sans button stack

## What & Why
The Sans font-selector button currently has 'Noto Sans',Arial,Helvetica,sans-serif.
Insert CJK-specific sans-serif fonts after 'Noto Sans' so CJK scripts render with
proper glyphs while Latin/Greek/etc fall through to Arial/Helvetica as before.

## Change in unicode-src/template.html

Sans radio button value — replace:
  'Noto Sans',Arial,Helvetica,sans-serif

with:
  'Noto Sans','Noto Sans CJK SC','Noto Sans CJK TC','Noto Sans CJK JP','Noto Sans CJK KR','Microsoft YaHei','Microsoft JhengHei','Hiragino Kaku Gothic Pro',Meiryo,'Malgun Gothic',Arial,Helvetica,sans-serif

Also update the tooltip title to mention CJK coverage.
No other font stacks change. No JS or CSS changes required.

## Steps
1. Edit unicode-src/template.html — update Sans label value and title attributes
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, Sans label ~line 63)