// Phase 10 R-2: every combining mark, drawn on U+25CC as the app shows it.
//   node marks-census.cjs <Unicode.html beside unicode-fonts/> <marks-input.json> [--minimal <fonts.conf>]
// For each mark: the first family in the app's stack that draws both U+25CC and the mark ("cluster"),
// whether a family draws the mark at all, and (Mn/Me) whether the pair takes more width than U+25CC alone.
const { chromium } = require('playwright'); const fs = require('fs');
const [html, input] = process.argv.slice(2); const minimal = process.argv.includes('--minimal') ? process.argv[process.argv.indexOf('--minimal') + 1] : null;
(async () => {
  const b = await chromium.launch({ executablePath: '/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome', env: { ...process.env, ...(minimal ? { FONTCONFIG_FILE: minimal } : {}) } });
  const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.goto('file://' + html); await p.waitForFunction(() => getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').includes('UE Unifont'), null, { timeout: 30000 });
  await p.click('[data-testid=button-sidebar-all]');
  await p.waitForFunction(() => !/checking|loading/i.test(document.querySelector('[data-testid=text-status-chars]').textContent), null, { timeout: 300000 });
  const { marks, blocks } = JSON.parse(fs.readFileSync(input, 'utf-8'));
  const r = await p.evaluate(async ({ marks, blocks }) => {
    for (const f of [...document.fonts]) await f.load().catch(() => {});
    const stack = getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').split(',').map((s) => s.trim()).filter(Boolean);
    const c = document.createElement('canvas').getContext('2d');
    const font = (fam) => `32px ${fam},"UE Blank"`;
    const ink = (fam, s) => { c.font = font(fam); const m = c.measureText(s); return m.width > 0.01 || m.actualBoundingBoxLeft + m.actualBoundingBoxRight > 0.01 || m.actualBoundingBoxAscent + m.actualBoundingBoxDescent > 0.01; };
    const width = (fam, s) => { c.font = font(fam); return c.measureText(s).width; };
    const circle = new Map(stack.map((f) => [f, ink(f, '\u25CC')]));
    const blockOf = (cp) => blocks.find((x) => cp >= x[1] && cp <= x[2])?.[0] ?? '?';
    const byBlock = {}; const totals = { marks: 0, cluster: 0, split: 0, none: 0, spacing: 0 }; const examples = { split: [], none: [], spacing: [] }; const fonts = {};
    for (const [cp, gc] of marks) {
      const ch = String.fromCodePoint(cp), bk = blockOf(cp);
      const row = byBlock[bk] ??= { marks: 0, cluster: 0, split: 0, none: 0, spacing: 0 };
      row.marks++; totals.marks++;
      const fam = stack.find((f) => circle.get(f) && ink(f, ch));
      let kind = fam ? 'cluster' : stack.some((f) => ink(f, ch)) ? 'split' : 'none';
      row[kind]++; totals[kind]++;
      if (kind !== 'cluster' && examples[kind].length < 40) examples[kind].push(cp.toString(16).toUpperCase());
      if (fam) {
        fonts[fam] = (fonts[fam] ?? 0) + 1;
        if (gc !== 'Mc' && width(fam, '\u25CC' + ch) - width(fam, '\u25CC') > 1) { row.spacing++; totals.spacing++; if (examples.spacing.length < 40) examples.spacing.push(cp.toString(16).toUpperCase() + ' ' + fam); }
      }
    }
    return { totals, fonts, examples, byBlock: Object.fromEntries(Object.entries(byBlock).filter(([, v]) => v.split || v.none || v.spacing)) };
  }, { marks, blocks });
  console.log(JSON.stringify(r, null, 1)); await b.close();
})();
