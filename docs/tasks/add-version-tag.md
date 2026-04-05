# Add Version Tag to Header

## What & Why
Display an app version string ("v1.0.0.0") in the far right of the header title line, so users can quickly see which version of the app they are running.

## Done looks like
- The header shows "v1.0.0.0" aligned to the far right of the title row
- The version tag is visually subtle (smaller, muted text) so it doesn't compete with the title
- Layout works at typical browser widths without wrapping or overlapping

## Out of scope
- Dynamic version reading from a file or build step
- Version bump tooling or automation

## Tasks
1. Add a version `<span>` with text "v1.0.0.0" inside the `<header>` element, after the existing subtitle span, and style it to sit at the far right using the existing flexbox layout (e.g. `margin-left: auto` or `justify-content: space-between`). Use muted, small text styling consistent with the current color scheme.

## Relevant files
- `artifacts/api-server/unicode-src/template.html`
- `artifacts/api-server/unicode-src/style.css`
