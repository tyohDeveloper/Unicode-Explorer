---
title: Apply Charcoal + Electric Blue color scheme
---
# Apply Charcoal + Electric Blue Color Scheme

## What & Why
Replace the current dark navy + red scheme with a neutral charcoal base and electric blue accent for better readability and visual harmony.

## Done looks like
- Background, panel, surface, accent, and accent2 CSS variables all updated
- Box-shadow rgba updated to match new accent
- Unicode.html rebuilt and server restarted

## Tasks
1. In `unicode-src/style.css`, update the `:root` variables:
   - `--bg: #1c1c1e`
   - `--panel: #242426`
   - `--surface: #3a3a3c`
   - `--accent: #0a84ff`
   - `--accent2: #5e5ce6`
2. Update the hardcoded box-shadow rgba to `rgba(10,132,255,0.15)`
3. Run `pnpm --filter @workspace/scripts build:unicode`
4. Restart the server workflow

## Relevant files
- `unicode-src/style.css:2-10`