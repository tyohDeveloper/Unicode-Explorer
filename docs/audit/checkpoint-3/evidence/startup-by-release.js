const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
for (const f of process.argv.slice(2)) { const ts=[]; for (let i=0;i<5;i++){ const p=await b.newPage(); const t0=Date.now(); await p.goto('file://'+f); await p.waitForFunction(()=>document.querySelector('#placeholder')&&getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').includes('UE Unifont'),null,{timeout:30000}); ts.push(Date.now()-t0); const nav=await p.evaluate(()=>Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd)); ts.push('dcl'+nav); await p.close(); } console.log(f, ts.join(' ')); }
await b.close();})();
