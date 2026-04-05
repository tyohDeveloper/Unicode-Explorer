---
title: Remove ui-* font keywords from glyph font stacks
---
---
title: Remove ui-* font keywords from glyph font stacks
---
# Remove ui-* font keywords

## What & Why
The ui-serif, ui-sans-serif, and ui-monospace CSS generics were added to the
front of the Serif, Sans, and Mono stacks. On most systems these resolve to the
same fonts as system-ui, which caused Serif and Sans to render tofu glyphs
identically to System and degraded the appearance. Remove them.

## Changes to unicode-src/template.html

| Button | New value attribute |
|--------|---------------------|
| System  | system-ui,serif |
| Serif   | Georgia,'Times New Roman','Noto Serif',serif |
| Sans    | 'Noto Sans',Arial,Helvetica,sans-serif |
| Mono    | 'Cascadia Code','Fira Code',Consolas,'DejaVu Sans Mono',monospace |
| Cursive | unchanged |
| Fantasy | unchanged |
| 仿宋    | unchanged |
| Math    | unchanged |

## Steps
1. Edit unicode-src/template.html — remove ui-* prefix from the 4 affected values
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart api-server workflow

## Relevant files
- unicode-src/template.html (font-btns div, lines ~60–72)