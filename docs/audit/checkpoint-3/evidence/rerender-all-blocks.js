const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:1400,height:900}});
await p.goto('file:///tmp/std/Unicode.html'); await p.click('[data-testid=button-sidebar-all]'); await p.waitForSelector('#output [data-cp]');
await p.waitForFunction(()=>!/checking/.test(document.querySelector('[data-testid=text-status-chars]').textContent),null,{timeout:180000});
const out={};
for (const [label, testid] of [['to Table','radio-mode-table'],['to Grid','radio-mode-grid'],['font Serif','radio-font-serif'],['toggle non-visible','checkbox-controls-nonvisible']]) {
  const loc=p.getByTestId(testid); if(!(await loc.count())){out[label]='n/a';continue;}
  const t=Date.now(); await p.locator('label',{has:loc}).first().click().catch(()=>loc.click());
  await p.waitForTimeout(50); await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  out[label]={ms:Date.now()-t, cells:await p.evaluate(()=>document.querySelectorAll('#output [data-cp]').length)};
}
console.log(JSON.stringify(out)); await b.close();})();
