// Phase 10 R-4/R-5: emoji sequences and Hangul jamo with the app's stack (--glyph-font), as the
// compose pad and plain mode show them. Reports platform fonts and glyph counts per sequence.
//   node sequences.cjs <Unicode.html> [--minimal <fonts.conf>]
const { chromium } = require('playwright');
const [html] = process.argv.slice(2); const minimal = process.argv.includes('--minimal') ? process.argv[process.argv.indexOf('--minimal') + 1] : null;
const SEQ = [
  ['ZWJ: woman technologist', '\u{1F469}\u200D\u{1F4BB}'], ['ZWJ: rainbow flag', '\u{1F3F3}\uFE0F\u200D\u{1F308}'], ['flag: US', '\u{1F1FA}\u{1F1F8}'],
  ['keycap 1', '1\uFE0F\u20E3'], ['skin tone: thumbs up', '\u{1F44D}\u{1F3FD}'], ['heart VS16 (emoji)', '\u2764\uFE0F'], ['heart VS15 (text)', '\u2764\uFE0E'],
  ['Hangul precomposed 한', '\uD55C'], ['Hangul jamo ᄒ+ᅡ+ᆫ', '\u1112\u1161\u11AB'], ['Hangul jamo ext ꥠ+ힰ', '\uA960\uD7B0'],
];
(async () => {
  const b = await chromium.launch({ executablePath: '/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', env: { ...process.env, ...(minimal ? { FONTCONFIG_FILE: minimal } : {}) } });
  const p = await b.newPage(); const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  await p.goto(`file://${html}#b=1F300,1F600,1F900,2600,1100,AC00,A960,D7B0`);
  await p.waitForFunction(() => !/checking|loading/i.test(document.querySelector('[data-testid=text-status-chars]')?.textContent ?? 'checking'), null, { timeout: 120000 });
  await p.evaluate(async () => { for (const f of [...document.fonts]) await f.load().catch(() => {}); });
  await p.evaluate((SEQ) => SEQ.forEach(([, t], i) => { const s = document.createElement('span'); s.id = 'q' + i; s.textContent = t; s.style.cssText = 'font-family:var(--glyph-font);font-size:24px'; document.body.prepend(s); }), SEQ);
  const out = [];
  for (let i = 0; i < SEQ.length; i++) {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#q' + i });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    const glyphs = fonts.reduce((s, f) => s + f.glyphCount, 0);
    out.push({ sequence: SEQ[i][0], glyphs, fonts: fonts.map((f) => `${f.familyName}×${f.glyphCount}`).join(', ') });
  }
  console.log(JSON.stringify(out)); await b.close();
})();
