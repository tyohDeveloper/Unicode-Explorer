---
title: Add Mono font option to glyph font selector
---
---
title: Add Mono font option to glyph font selector
---
# Add Mono to font selector

## What & Why
The glyph font selector (System / Serif / Sans / 仿宋 / Math / Emoji) is missing a
monospace option. Monospace rendering is useful for technical blocks, spacing-sensitive
glyphs, and box-drawing characters. The mono stack is already defined as `--mono` in
the CSS; it just needs to be exposed as a font choice for the glyph display.

## Done looks like
- A "Mono" button appears after "Emoji" in the font selector row
- Selecting it renders glyphs in `"Cascadia Code","Fira Code",Consolas,"DejaVu Sans Mono",monospace`
- Deselecting / switching to another font works correctly
- Unicode.html rebuilt and served at /

## Steps
1. In `unicode-src/template.html` — add after the Emoji `<label>`:
   ```html
   <label title="Monospace — best for technical and box-drawing blocks">
     <input type="radio" name="gfont"
       value="&quot;Cascadia Code&quot;,&quot;Fira Code&quot;,Consolas,&quot;DejaVu Sans Mono&quot;,monospace" />Mono
   </label>
   ```
   Note: font-name quotes must be `&quot;` in XHTML attribute values.
2. Run `pnpm --filter @workspace/scripts build:unicode`
3. Restart the api-server workflow

## Relevant files
- `unicode-src/template.html` (line ~70, inside `.font-btns` div)
- `unicode-src/style.css` (no changes needed — `--mono` stack already defined)