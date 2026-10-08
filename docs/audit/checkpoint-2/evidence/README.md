# Checkpoint 2 evidence

Playwright scripts run with the sandbox's Chromium against the released `Unicode.html`
(copy it to `/tmp/std/Unicode.html` or edit the paths). They need `playwright` in the
working directory (`npm i playwright`) and are not part of the build.

| File | What it measures |
|---|---|
| `measure-coverage-and-render.js` | Start-up time; characters verified by the embedded fonts alone, by the full stack, and by Last Resort behind Adobe Blank; probe times; all-blocks Grid render time. Writes the per-block embedded-only gap list. |
| `embedded-only-gaps-by-block.json` | `[block, visible assigned, verified]` for the 20 blocks the embedded fonts do not fully cover. |
| `lastresort-he-vs-blank.js` | The Last Resort HE build (WOFF2 and TTF) measured behind Adobe Blank: zero ink for every character (CP2-02). |
| `lastresort-full-vs-blank.js` | The full Last Resort build measured the same way: ink for every character (D-11). |
| `tofu-metrics.js` | Chromium tofu box metrics for reserved and unfont-ed code points: they vary by code point, so no tofu signature exists (CP2-03, D-12). |
