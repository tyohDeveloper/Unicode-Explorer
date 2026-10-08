# Checkpoint 3 evidence

Playwright scripts run with the sandbox's Chromium against the released `Unicode.html`
(copy it to `/tmp/std/Unicode.html` or pass the path). They need `playwright` in the working
directory and are not part of the build.

| File | What it measures |
|---|---|
| `measure-checkpoint-3.js` | Start-up; characters drawn by the embedded fonts alone and by Last Resort behind Adobe Blank; all-blocks first cells and background scan; contrast of the text tokens; network requests and page errors. Writes `embedded-only-gaps-by-block.json`. |
| `embedded-only-gaps-by-block.json` | `[block, visible assigned, drawn]` for the 25 blocks the embedded fonts do not fully cover (Unicode 18). |
| `startup-by-release.js` | Warm start-up, 5 runs each, for the 2.0.0.0, 2.1.0.0 and current artifacts (CP3-04). |
| `rerender-all-blocks.js` | Re-render time after mode, font and filter changes with every block selected (PRF-02). |
| `egyptian-subset-vs-full.js` | Pixel hash of format-control sequences in the full UniHieroglyphica and the D-20 subset: identical. |
