---
title: Unicode Character Explorer
---
# Unicode Character Explorer HTML File

## What & Why
Build a single, standalone HTML file (XHTML-compliant) called `Unicode.html` that lets users explore Unicode characters entirely offline. No external resources, no server — everything is self-contained in one file.

## Done looks like
- A file named `Unicode.html` exists at the project root
- The page loads and works with no network connection
- A scrollable list of all Unicode blocks is shown, each with a checkbox
- Buttons allow "Select All" and "Deselect All" for convenience
- A checkbox controls whether non-visible/control characters are included
- A display-mode selector lets the user choose between:
  - Grid (large glyphs only, compact)
  - Table (code point + character + name per row)
  - Grid with code point below each character
  - Plain text flow (characters separated by spaces)
- A "Show" button generates the output
- The output area is a readable, selectable text region the user can copy from
- Output is neatly aligned/formatted for each mode
- The file is XHTML-compliant (proper XML structure, self-closing tags, etc.)

## Out of scope
- Any server-side logic or API calls
- Network-fetched Unicode data (all data is baked into the file)
- Character search/filtering beyond block selection
- Saving or exporting (the user can copy from the selectable output)

## Tasks
1. **Build the Unicode block data** — Compile a comprehensive list of Unicode block name, start, and end code point ranges, baked as a JavaScript data structure in the HTML file. Cover all major Unicode 15 blocks.

2. **Build the UI** — Create the HTML/CSS layout: block checklist with select-all/deselect-all, non-visible characters toggle, display-mode selector (grid / table / grid+codepoint / plaintext), and a "Show" button. Style for clean alignment and readability with no external resources.

3. **Implement character generation** — Write JavaScript that iterates selected blocks, filters non-visible characters if toggled, and renders the output in the chosen display mode. The output area must be selectable. Character names should be resolved via a lookup table or inline Unicode name data.

4. **XHTML compliance** — Ensure the document is valid XHTML 1.1 or XHTML 5 (proper XML declaration, self-closing void elements, quoted attributes, CDATA-wrapped scripts/styles, correct MIME semantics noted in a comment).

## Relevant files
- `replit.md`