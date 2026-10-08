// Checkpoint 3 measurements (2.2.1.0-app / 2.0.1.0-data). Run from a directory with playwright installed:
//   node measure-checkpoint-3.js /path/to/Unicode.html /path/to/repo
const {chromium}=require('playwright'); const fs=require('fs');
const [html, repo] = [process.argv[2] ?? '/tmp/std/Unicode.html', process.argv[3] ?? '/home/user/workspace/Unicode-Explorer'];
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage({viewport:{width:1400,height:900}}); const requests=[]; const errors=[];
p.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))requests.push(r.url())}); p.on('pageerror',e=>errors.push(String(e)));
const t0=Date.now(); await p.goto('file://'+html); await p.waitForFunction(()=>document.querySelector('#placeholder')&&getComputedStyle(document.documentElement).getPropertyValue('--glyph-font').includes('UE Unifont'),null,{timeout:30000}); const startupMs=Date.now()-t0;
const read=(f)=>JSON.parse(fs.readFileSync(`${repo}/src/data/${f}`));
const blocks=read('blocks.json').blocks, vis=read('visibility.json').hidden, unassigned=read('unassigned.json').ranges;
const r=await p.evaluate(async ({blocks,vis,unassigned})=>{
  await Promise.all(['UE Unifont','UE Unifont Upper','UE Blank','UE LastResort'].map(f=>document.fonts.load(`16px "${f}"`)));
  const inRuns=(runs,cp)=>{let lo=0,hi=runs.length-1;while(lo<=hi){const m=(lo+hi)>>1;const s=runs[m][0],e=runs[m].length>1?runs[m][1]:s;if(cp<s)hi=m-1;else if(cp>e)lo=m+1;else return true;}return false;};
  const c=document.createElement('canvas').getContext('2d');
  const probe=(font)=>{c.font=font;let total=0,ok=0;const gaps=[];const t=performance.now();
    for(const [name,s,e] of blocks){let bt=0,bo=0;for(let cp=s;cp<=e;cp++){if(cp>=0xD800&&cp<=0xDFFF)continue;if(inRuns(vis,cp)||inRuns(unassigned,cp))continue;bt++;const m=c.measureText(String.fromCodePoint(cp));if(m.width>0.01||m.actualBoundingBoxLeft+m.actualBoundingBoxRight>0.01||m.actualBoundingBoxAscent+m.actualBoundingBoxDescent>0.01)bo++;}total+=bt;ok+=bo;if(bo<bt)gaps.push([name,bt,bo]);}
    return {total,ok,ms:Math.round(performance.now()-t),gaps};};
  const embedded=probe('32px "UE Unifont","UE Unifont Upper","UE Blank"');
  const lastResort=probe('32px "UE LastResort","UE Blank"');
  return {embedded, lastResort:{total:lastResort.total,ok:lastResort.ok}};
},{blocks,vis,unassigned});
fs.writeFileSync('embedded-only-gaps-by-block.json', JSON.stringify(r.embedded.gaps)+'\n');
// All blocks: first cells, then the background scan.
const t1=Date.now(); await p.click('[data-testid=button-sidebar-all]'); await p.waitForSelector('#output [data-cp]'); const firstCellsMs=Date.now()-t1;
await p.waitForFunction(()=>!/checking/.test(document.querySelector('[data-testid=text-status-chars]').textContent),null,{timeout:180000}); const scanMs=Date.now()-t1;
const st=await p.evaluate(()=>({chars:document.querySelector('[data-testid=text-status-chars]').textContent, cellsBuilt:document.querySelectorAll('#output [data-cp]').length, pendingChunks:document.querySelectorAll('.chunk-pending').length}));
// Contrast of text tokens on the panel and background.
const contrast=await p.evaluate(()=>{const v=(n)=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const rgb=(h)=>{h=h.replace('#','');if(h.length===3)h=[...h].map(x=>x+x).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)};
  const L=(c)=>{const [r,g,b]=rgb(c).map(x=>x<=0.03928?x/12.92:((x+0.055)/1.055)**2.4);return 0.2126*r+0.7152*g+0.0722*b};
  const ratio=(a,b)=>{const [x,y]=[L(a),L(b)].sort((p,q)=>q-p);return Math.round(((x+0.05)/(y+0.05))*100)/100};
  const out={};for(const fg of ['--text','--text-dim','--accent-text'])for(const bg of ['--panel','--bg'])out[`${fg} on ${bg}`]=ratio(v(fg),v(bg));return out;});
console.log(JSON.stringify({startupMs, embeddedOnly:{total:r.embedded.total,verified:r.embedded.ok,probeMs:r.embedded.ms,blocksWithGaps:r.embedded.gaps.length}, lastResort:r.lastResort, allBlocks:{firstCellsMs,scanMs,...st}, contrast, networkRequests:requests, pageErrors:errors},null,1));
await b.close();})();
