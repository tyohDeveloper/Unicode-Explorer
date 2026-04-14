---
title: Modernize template from XHTML 1.1 to HTML5
---
# Modernize template from XHTML 1.1 to HTML5

## What & Why
`unicode-src/template.html` is declared as XHTML 1.1 and uses XML `CDATA` sections to safely embed inline JS and CSS. This requires the build script to guard against `]]>` appearing in injected content — a fragile constraint that grows riskier as the codebase expands. Switching to a standard HTML5 `<!DOCTYPE html>` template eliminates the XML parser entirely, removes the `CDATA` guards from the build, and produces output that browsers parse with the more permissive and predictable HTML parser.

## Done looks like
- `unicode-src/template.html` uses `<!DOCTYPE html>` and plain `<script>` / `<style>` tags with no CDATA wrappers
- The build script no longer injects `<![CDATA[` / `]]>` around JS or CSS blocks
- Any CDATA safety checks in `build.ts` are removed
- The generated `Unicode.html` passes HTML5 validation and is functionally identical in all browsers

## Out of scope
- Any content, styling, or behavior changes
- Switching the JS source files to ES modules or any other syntax changes
- Changes to the build pipeline beyond removing CDATA injection

## Tasks
1. **Update `template.html`** — replace the XHTML 1.1 doctype/namespace declarations with `<!DOCTYPE html>`, remove `xml:lang` in favor of plain `lang`, and strip the `<![CDATA[` / `]]>` wrappers from the inline `<script>` and `<style>` blocks.
2. **Update `build.ts`** — remove the CDATA wrapper injection and any `]]>` safety checks from the JS/CSS assembly functions. Ensure the `{{CSS}}` and `{{JS}}` placeholders are still replaced correctly.
3. **Rebuild and verify** — run `pnpm --filter @workspace/scripts build:unicode` and confirm the output `Unicode.html` is valid HTML5 and all features work correctly.

## Relevant files
- `unicode-src/template.html`
- `scripts/src/unicode/build.ts`