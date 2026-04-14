# Add Version Tag to Build Template

## What & Why
The v1.0.0.0 version label was added directly to `Unicode.html` (the built output), not to `template.html` (the source). Every time the build runs, `Unicode.html` is overwritten from the template, silently erasing the version tag. The tag needs to live in the source template so it survives all future rebuilds.

## Done looks like
- The version tag appears in `template.html` in the header, matching the style used in the current `Unicode.html` (small, muted text, pushed to the right)
- After rebuilding, `Unicode.html` still shows the version tag in the header
- A `{{VERSION}}` marker (or hardcoded value) in the template makes future version bumps straightforward

## Out of scope
- Automating version bumps from git tags
- Changing where or how the version is displayed

## Tasks
1. **Add version to template** — Insert the `<span class="app-version">v1.0.0.0</span>` element into the header section of `template.html`, matching the position and styling currently visible in `Unicode.html`. Confirm the corresponding `.app-version` CSS rule already exists in `style.css` (added by Task #27); add it there if not.

2. **Rebuild and verify** — Rebuild `Unicode.html` and confirm the version tag appears in the header at the far right.

## Relevant files
- `unicode-src/template.html:20-23`
- `unicode-src/style.css`
