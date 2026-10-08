const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome'});
 const ctx=await b.newContext({viewport:{width:1400,height:900}});
 const p=await ctx.newPage(); const reqs=[];const errs=[];
 p.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))reqs.push(r.url())});
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())}); p.on('pageerror',e=>errs.push(String(e)));
 const t0=Date.now(); await p.goto('file:///home/user/workspace/Unicode-Explorer/Unicode.html'); await p.waitForLoadState('load');
 console.log('load ms',Date.now()-t0);
 const st=await p.evaluate(()=>{const e=performance.getEntriesByType('navigation')[0];return {dcl:e.domContentLoadedEventEnd,load:e.loadEventEnd}});console.log('nav',st);
 await p.screenshot({path:'/tmp/aud/shot-initial.png'});
 // select Basic Latin etc
 await p.click('#blk-0'); await p.waitForTimeout(300); await p.screenshot({path:'/tmp/aud/shot-latin.png'});
 // a11y: tab order
 const tabs=[];for(let i=0;i<14;i++){await p.keyboard.press('Tab');tabs.push(await p.evaluate(()=>{const a=document.activeElement;return a.tagName+'#'+a.id+'.'+a.className+' '+(a.value||'').slice(0,15)}))}
 console.log('tab order',tabs);
 const gcFocusable=await p.evaluate(()=>{const g=document.querySelector('.gc');return g?{tabIndex:g.tabIndex,role:g.getAttribute('role')}:null});console.log('grid cell',gcFocusable);
 // All
 for (const mode of ['grid','table']){
  await p.evaluate(m=>{document.querySelector('input[name=mode][value='+m+']').checked=true;},mode);
  const t1=Date.now();
  await p.click('#btn-all'); 
  await p.waitForFunction(()=>document.querySelectorAll('#output *').length>1000,{timeout:180000});
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0))));
  const t=Date.now()-t1;
  const n=await p.evaluate(()=>({nodes:document.querySelectorAll('#output *').length,stat:document.getElementById('stat-chars').textContent,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):null}));
  console.log(mode,'All render ms',t,n);
  await p.click('#btn-none'); await p.waitForTimeout(300);
 }
 const csp=await p.evaluate(()=>!!document.querySelector('meta[http-equiv=Content-Security-Policy]'));
 console.log('CSP meta',csp,'net reqs',reqs,'errors',errs);
 await b.close();
})();
