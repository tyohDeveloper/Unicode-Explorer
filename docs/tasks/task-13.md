---
title: Redesign font selector — 8 options with ui-* generics
---
---
title: Redesign font selector — 8 options with ui-* generics
---
# Redesign font selector

## What & Why
Reorganise the glyph font selector in template.html to 8 options in a defined
order, adding Cursive and Fantasy, removing Emoji, and enriching Serif / Sans /
Mono stacks with the CSS Level 4 `ui-*` generic families.

## New button order and font stacks

| Label   | Value (for XHTML attribute, use &quot; for quoted names) |
|---------|-----------------------------------------------------------|
| System  | system-ui,ui-sans-serif,serif |
| Serif   | ui-serif,Georgia,'Times New Roman','Noto Serif',serif |
| Sans    | ui-sans-serif,'Noto Sans',Arial,Helvetica,sans-serif |
| Mono    | ui-monospace,'Cascadia Code','Fira Code',Consolas,'DejaVu Sans Mono',monospace |
| Cursive | 'Segoe Script','Brush Script MT','Comic Sans MS',cursive |
| Fantasy | Papyrus,Impact,fantasy |
| 仿宋    | FangSong,STFangsong,'FZFangSong-Z02',fangsong,serif (unchanged) |
| Math    | 'STIX Two Math','Latin Modern Math','Cambria Math',math,serif (unchanged) |

Notes:
- Emoji button is removed entirely.
- System remains the default (checked="checked").
- All multi-word font names in XHTML attribute values must use &quot; escaping
  (or single quotes — stay consistent with the existing options in the file which
  already use single quotes in value attributes).
- ui-serif, ui-sans-serif, ui-monospace are CSS Level 4 system generic families;
  they have good modern browser support and gracefully fall back.

## Steps
1. Replace the entire `.font-btns` div content in `unicode-src/template.html`
   with the 8 labels in the order above.
2. Update tooltip `title` attributes to be descriptive.
3. Run `pnpm --filter @workspace/scripts build:unicode`
4. Restart api-server workflow.

## Relevant files
- `unicode-src/template.html` (lines 64–72, the .font-btns div)
- No CSS changes needed.