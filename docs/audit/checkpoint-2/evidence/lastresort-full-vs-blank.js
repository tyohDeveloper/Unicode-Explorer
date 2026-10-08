const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage(); p.on('console',m=>console.log('console',m.text().slice(0,200)));
const woff2=fs.readFileSync('/tmp/gapfonts/LastResort-Regular.woff2').toString('base64');
const ttf=fs.readFileSync('/tmp/gapfonts/LastResort-Regular.ttf').toString('base64');
const blank=fs.readFileSync('/home/user/workspace/Unicode-Explorer/fonts/standard/AdobeBlank2.woff').toString('base64');
await p.setContent(`<style>@font-face{font-family:"LRw";src:url(data:font/woff2;base64,${woff2}) format("woff2")}@font-face{font-family:"LRt";src:url(data:font/ttf;base64,${ttf})}@font-face{font-family:"BL";src:url(data:font/woff;base64,${blank}) format("woff")}</style><div style="font-family:LRw">A</div>`);
const r=await p.evaluate(async()=>{
  await Promise.all(['LRw','LRt','BL'].map(f=>document.fonts.load(`16px "${f}"`)));
  const st=[...document.fonts].map(f=>f.family+':'+f.status);
  const c=document.createElement('canvas').getContext('2d');
  const w=(font,t)=>{c.font=font;const m=c.measureText(t);return [+m.width.toFixed(1), +(m.actualBoundingBoxAscent+m.actualBoundingBoxDescent).toFixed(1)]};
  const out={st};
  for (const fam of ['LRw','LRt']) out[fam]={A:w(`32px "${fam}","BL"`,'A'), A_mono:w(`32px "${fam}",monospace`,'A'), mono:w('32px monospace','A'), tangut:w(`32px "${fam}","BL"`,'\u{17000}'), tcs:w(`32px "${fam}","BL"`,'\u{18D80}'), tcsAlone:w(`32px "${fam}"`,'\u{18D80}')};
  out.blankA=w('32px "BL"','A');
  return out;});
console.log(JSON.stringify(r)); await b.close();})();
