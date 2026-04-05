---
title: Extract font config to fonts.json + minify build output
---
---
title: Extract font config to separate file + minify build output
---
# Extract font config + minify build output

## Goal 1 — Font config file
Create `unicode-src/config/fonts.json` containing all 8 font-selector entries
as a JSON array. The build generates the `<div class="font-btns">` HTML from
this file rather than the HTML being hardcoded in template.html.

### New file: unicode-src/config/fonts.json
Array of objects:
  { "label": "System", "title": "...", "stack": "system-ui,serif", "checked": true }
  { "label": "Serif",  "title": "...", "stack": "'Source Han Serif',..." }
  ... (8 total entries)

### template.html change
Replace the entire <div class="font-btns">...</div> block with {{FONT_BTNS}}.

### build.ts change
- Read and JSON.parse unicode-src/config/fonts.json
- Generate font-btns HTML: for each entry build a <label> with title/value/checked
- Inject via .replace("{{FONT_BTNS}}", generatedHtml)
- Add fonts.json to the watch list

## Goal 2 — Minify the assembled output
After assembly (CSS + JS + HTML injected), apply minification before writing:

### CSS (applied to css string before {{CSS}} injection)
- Strip /* ... */ block comments (regex: /\/\*[\s\S]*?\*\//g)
- Collapse runs of whitespace to single space
- Remove leading/trailing whitespace from each line
- Remove newlines

### JS (applied to assembled js string before {{JS}} injection)
- Install terser (pnpm add -D terser --filter @workspace/scripts)
- Use terser to minify the concatenated JS blob
- Options: compress + mangle, keep_fnames: false
- IMPORTANT: terser runs on the JS source only; the CDATA wrapper is added by
  the template so terser never sees ]]> or CDATA markers

### HTML (applied to final html string after all injections)
- Strip <!-- ... --> comments (the big header comment block)
- Collapse whitespace between tags (>\s+< becomes ><)
- Do NOT touch content inside <![CDATA[ ... ]]> blocks
- Trim leading/trailing whitespace from each line then rejoin

## Steps
1. Create unicode-src/config/fonts.json with all 8 current font stacks
2. Edit template.html: replace font-btns div contents with {{FONT_BTNS}}
3. Install terser: pnpm add -D terser --filter @workspace/scripts
4. Update scripts/src/unicode/build.ts:
   a. Import terser minify
   b. Add fontConfig read + HTML generation function
   c. Add CSS minify function (regex-based)
   d. Add HTML minify function (strip comments, collapse whitespace, skip CDATA)
   e. Add JS minification via terser (async)
   f. Wire all into build() function
5. Run build and verify Unicode.html is valid and smaller
6. Restart api-server workflow

## Acceptance
- Unicode.html still works correctly in the browser
- Font selector buttons all present and functional
- File size noticeably smaller than 112,341 bytes
- fonts.json is the only file that needs editing to change font stacks

## Relevant files
- unicode-src/config/fonts.json (new)
- unicode-src/template.html
- scripts/src/unicode/build.ts
- scripts/package.json (terser devDependency)