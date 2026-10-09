// Checkpoint 4 measurements (2.3.0.0-app / 2.0.5.0-data). Run from a directory with playwright installed:
//   node measure-checkpoint-4.cjs <standard Unicode.html> <complete edition Unicode.html (with unicode-fonts/)> <repo>
const { chromium } = require('playwright'); const fs = require('fs');
const [std, cmp, repo] = process.argv.slice(2);
const read = (f) => JSON.parse(fs.readFileSync(`${repo}/src/data/${f}`));
const ready = () => document.querySelector('#placeholder') && getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').includes('UE Unifont');
async function startup(b, html) { const ts = []; for (let i = 0; i < 5; i++) { const p = await b.newPage(); const t0 = Date.now(); await p.goto('file://' + html); await p.waitForFunction(ready, null, { timeout: 30000 }); ts.push(Date.now() - t0); await p.close(); } return ts; }
async function allBlocks(b, html) {
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } }); const requests = []; const errors = [];
  p.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) requests.push(r.url()); }); p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto('file://' + html); await p.waitForFunction(ready, null, { timeout: 30000 });
  const t1 = Date.now(); await p.click('[data-testid=button-sidebar-all]'); await p.waitForSelector('#output [data-cp]'); const firstCellsMs = Date.now() - t1;
  await p.waitForFunction(() => !/checking|loading/i.test(document.querySelector('[data-testid=text-status-chars]').textContent), null, { timeout: 300000 }); const scanMs = Date.now() - t1;
  const chars = await p.textContent('[data-testid=text-status-chars]'); const packs = await p.evaluate(() => document.fonts.size);
  await p.close(); return { firstCellsMs, scanMs, chars, fontFaces: packs, requests, errors };
}
async function embedded(b, html) {
  const p = await b.newPage(); await p.goto('file://' + html); await p.waitForFunction(ready, null, { timeout: 30000 });
  const blocks = read('blocks.json').blocks, vis = read('visibility.json').hidden, unassigned = read('unassigned.json').ranges;
  const fams = read('embedded-fonts.json').fonts.filter((f) => f.role === 'coverage').map((f) => ({ css: f.css_family, design: f.design ?? 'outline' }));
  const r = await p.evaluate(async ({ blocks, vis, unassigned, fams }) => {
    for (const f of [...document.fonts]) await f.load().catch(() => {});
    const inRuns = (runs, cp) => { let lo = 0, hi = runs.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1; const s = runs[m][0], e = runs[m].length > 1 ? runs[m][1] : s; if (cp < s) hi = m - 1; else if (cp > e) lo = m + 1; else return true; } return false; };
    const c = document.createElement('canvas').getContext('2d');
    const draws = (font, s) => { c.font = font; const m = c.measureText(s); return m.width > 0.01 || m.actualBoundingBoxLeft + m.actualBoundingBoxRight > 0.01 || m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0.01; };
    const by = Object.fromEntries(fams.map((f) => [f.css, 0])); let total = 0, none = 0; const t = performance.now();
    for (const [, s, e] of blocks) for (let cp = s; cp <= e; cp++) {
      if ((cp >= 0xD800 && cp <= 0xDFFF) || inRuns(vis, cp) || inRuns(unassigned, cp)) continue; total++;
      const ch = String.fromCodePoint(cp); const f = fams.find((f) => draws(`32px "${f.css}","UE Blank"`, ch));
      if (f) by[f.css]++; else none++;
    }
    const outline = fams.filter((f) => f.design === 'outline').reduce((s, f) => s + by[f.css], 0);
    return { total, byFamily: by, outline, bitmap: total - none - outline, none, ms: Math.round(performance.now() - t) };
  }, { blocks, vis, unassigned, fams });
  await p.close(); return r;
}
(async () => {
  const b = await chromium.launch({ executablePath: '/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome' });
  const out = process.env.ONLY_ALL ? { allBlocksComplete: await allBlocks(b, cmp) } : { startupStandard: await startup(b, std), embedded: await embedded(b, std), allBlocksStandard: await allBlocks(b, std), allBlocksComplete: await allBlocks(b, cmp) };
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
