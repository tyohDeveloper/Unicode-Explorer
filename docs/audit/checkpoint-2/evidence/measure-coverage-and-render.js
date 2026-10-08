const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage();
const t0=Date.now(); await p.goto('file:///tmp/std/Unicode.html'); await p.waitForFunction(()=>document.querySelector('#placeholder')&&getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').includes('UE Unifont'),null,{timeout:30000}); const startup=Date.now()-t0;
const blocks=JSON.parse(fs.readFileSync('/home/user/workspace/Unicode-Explorer/src/data/blocks.json')).blocks;
const vis=JSON.parse(fs.readFileSync('/home/user/workspace/Unicode-Explorer/src/data/visibility.json')).hidden;
const unassigned=JSON.parse(fs.readFileSync('/home/user/workspace/Unicode-Explorer/src/data/unassigned.json')).ranges;
const r=await p.evaluate(async ({blocks,vis,unassigned})=>{
  await Promise.all(['UE Unifont','UE Unifont Upper','UE Blank','UE LastResort'].map(f=>document.fonts.load(`16px "${f}"`)));
  const hidden=(cp)=>{let lo=0,hi=vis.length-1;while(lo<=hi){const m=(lo+hi)>>1;if(cp<vis[m][0])hi=m-1;else if(cp>vis[m][1])lo=m+1;else return true;}return false;};
  const reserved=(cp)=>{let lo=0,hi=unassigned.length-1;while(lo<=hi){const m=(lo+hi)>>1;const r=unassigned[m];const e=r.length>1?r[1]:r[0];if(cp<r[0])hi=m-1;else if(cp>e)lo=m+1;else return true;}return false;};
  const c=document.createElement('canvas').getContext('2d');
  const probe=(font)=>{c.font=font;let total=0,ok=0;const perBlock=[];const t=performance.now();
    for(const [name,s,e] of blocks){let bt=0,bo=0;for(let cp=s;cp<=e;cp++){if(cp>=0xD800&&cp<=0xDFFF)continue;if(hidden(cp)||reserved(cp))continue;bt++;const m=c.measureText(String.fromCodePoint(cp));if(m.width>0.01||m.actualBoundingBoxLeft+m.actualBoundingBoxRight>0.01||m.actualBoundingBoxAscent+m.actualBoundingBoxDescent>0.01)bo++;}total+=bt;ok+=bo;if(bo<bt)perBlock.push([name,bt,bo]);}
    return {total,ok,ms:Math.round(performance.now()-t),gaps:perBlock};};
  const embedded=probe('32px "UE Unifont","UE Unifont Upper","UE Blank"');
  const device=probe(`32px ${getComputedStyle(document.documentElement).getPropertyValue('--glyph-font')},"UE Blank"`);
  const lastResort=probe('32px "UE LastResort","UE Blank"');
  return {embedded:{total:embedded.total,ok:embedded.ok,ms:embedded.ms,gapBlocks:embedded.gaps.length,gaps:embedded.gaps}, deviceStack:{total:device.total,ok:device.ok,ms:device.ms,gapBlocks:device.gaps.length}, lastResort:{total:lastResort.total,ok:lastResort.ok}};
},{blocks,vis,unassigned});
console.log(JSON.stringify({startupMs:startup, embeddedOnly:{total:r.embedded.total,verified:r.embedded.ok,probeMs:r.embedded.ms,blocksWithGaps:r.embedded.gapBlocks}, sandboxDeviceStack:r.deviceStack, lastResort:r.lastResort}));
fs.writeFileSync('/tmp/cp2-embedded-gaps.json', JSON.stringify(r.embedded.gaps));
// PRF: all blocks grid with detection
const t1=Date.now(); await p.evaluate(()=>{location.hash='#b='+JSON.parse(document.querySelector('#block-list')?'[]':'[]')}); 
await p.click('[data-testid=button-sidebar-all]'); await p.waitForFunction(()=>document.querySelectorAll('#output [data-cp]').length>150000,null,{timeout:120000}); const allMs=Date.now()-t1;
const st=await p.evaluate(()=>({chars:document.querySelector('#stat-chars').textContent, cells:document.querySelectorAll('#output [data-cp]').length}));
console.log(JSON.stringify({allBlocksGridMs:allMs, ...st}));
await b.close();})();
