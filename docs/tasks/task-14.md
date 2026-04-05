---
title: Swap Font and Size control order in controls bar
---
---
title: Swap Font and Size control order in controls bar
---
# Swap Font and Size control order

## What & Why
Move the Font selector before the Size slider in the controls bar.
Semantic order: Display → Non-visible → Font → Size → Copy output.
Font selects content character style; Size controls display presentation.

## Steps
1. In `unicode-src/template.html`, swap the two `<div class="control-group">` blocks:
   - The Size group (lines ~57–61) moves to after the Font group (lines ~62–74)
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart the api-server workflow

## Relevant files
- `unicode-src/template.html` (controls-bar section)