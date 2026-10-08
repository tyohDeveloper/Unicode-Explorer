const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage(); await p.setContent('<html><body></body></html>');
const r=await p.evaluate(()=>{
  const c=document.createElement('canvas').getContext('2d');
  const sig=(stack,cp)=>{c.font=`32px ${stack}`;const m=c.measureText(String.fromCodePoint(cp));return [m.width,m.actualBoundingBoxLeft,m.actualBoundingBoxRight,m.actualBoundingBoxAscent,m.actualBoundingBoxDescent].map(v=>Math.round(v*100)/100).join(',')};
  const stack='system-ui,serif'; const out={};
  const groups={
    'reserved 4-digit (Greek block)':[0x378,0x380,0x381,0x38B],
    'reserved 4-digit (Cyrillic ext?) ':[0x2FE0,0x2FE5],
    'reserved 5-digit (Linear B 1000C)':[0x1000C,0x10027,0x1003B],
    'missing real 5-digit (Tangut)':[0x17000,0x17001,0x187F0],
    'missing real 5-digit (CJK B)':[0x20000,0x20001,0x2A6DF],
    'missing real 4-digit? none; cherokee rendered':[0x13A0,0x13A1],
    'reserved in Tangut Supplement 18D1F..':[0x18D1F,0x18D20],
    'real glyphs':[0x41,0x4E00,0x1F600,0x0915,0x1200],
  };
  for (const [k,cps] of Object.entries(groups)) out[k]=cps.map(cp=>cp.toString(16)+':'+sig(stack,cp));
  return out;});
for (const [k,v] of Object.entries(r)) console.log(k,'\n   ',v.join('\n    ')); await b.close();})();
