// Phase 10 R-3: data/script-samples.json rendered with the app's own font stack (--glyph-font).
//   node script-samples.cjs <Unicode.html> <repo> <out.png> [--minimal <fonts.conf>]
// Reports the platform fonts Chromium used per sample (one font = shaped together) and saves a sheet.
const { chromium } = require('playwright'); const fs = require('fs');
const [html, repo, png] = process.argv.slice(2); const minimal = process.argv.includes('--minimal') ? process.argv[process.argv.indexOf('--minimal') + 1] : null;
(async () => {
  const b = await chromium.launch({ executablePath: '/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', env: { ...process.env, ...(minimal ? { FONTCONFIG_FILE: minimal } : {}) } });
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } }); const cdp = await p.context().newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const { samples } = JSON.parse(fs.readFileSync(`${repo}/data/script-samples.json`, 'utf-8'));
  const blocks = [...new Set(samples.flatMap((s) => [...s.text]).map((c) => c.codePointAt(0)))];
  const bl = JSON.parse(fs.readFileSync(`${repo}/src/data/blocks.json`, 'utf-8')).blocks;
  const starts = [...new Set(blocks.map((cp) => bl.find((x) => cp >= x[1] && cp <= x[2])?.[1]).filter((x) => x !== undefined))].map((s) => s.toString(16).toUpperCase().padStart(4, '0'));
  await p.goto(`file://${html}#b=${starts.join(',')}`);
  await p.waitForFunction(() => !/checking|loading/i.test(document.querySelector('[data-testid=text-status-chars]')?.textContent ?? 'checking'), null, { timeout: 120000 });
  await p.evaluate(async () => { for (const f of [...document.fonts]) await f.load().catch(() => {}); });
  await p.evaluate((samples) => {
    const sheet = document.createElement('div'); sheet.id = 'sheet';
    sheet.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;color:#000;padding:12px;overflow:auto;font:13px sans-serif;columns:2';
    samples.forEach((s, i) => { const row = document.createElement('div'); row.style.cssText = 'break-inside:avoid;margin:2px 0'; row.innerHTML = `<span style="display:inline-block;width:190px;color:#555"></span><span id="s${i}" style="font-family:var(--glyph-font);font-size:24px"></span>`; row.firstChild.textContent = s.script; row.lastChild.textContent = s.text; sheet.append(row); });
    document.body.append(sheet);
  }, samples);
  await p.waitForTimeout(800);
  const rows = [];
  for (let i = 0; i < samples.length; i++) {
    const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `#s${i}` });
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    const real = fonts.filter((f) => f.glyphCount > 0);
    const nonSpace = samples[i].text.includes(' ') ? real.filter((f) => !(f.glyphCount === 1 && real.length > 1 && /Liberation|DejaVu/.test(f.familyName))) : real;
    rows.push({ script: samples[i].script, fonts: real.map((f) => `${f.familyName}×${f.glyphCount}`).join(', '), single: nonSpace.length === 1 });
  }
  await p.screenshot({ path: png, fullPage: false });
  console.log(JSON.stringify(rows)); await b.close();
})();
