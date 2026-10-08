const {chromium}=require('playwright'); const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/home/user/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
const p=await b.newPage();
const full=fs.readFileSync('/home/user/workspace/Unicode-Explorer/fonts/cache/unihieroglyphica.woff2').toString('base64');
const js=fs.readFileSync('/home/user/workspace/Unicode-Explorer/unicode-fonts/egyptian-hieroglyphs.js','utf8'); const sub=JSON.parse(js.slice(js.indexOf('=',js.indexOf('["egyptian-hieroglyphs"]'))+1).trim().replace(/;$/,'')).fonts[0].data;
const r=await p.evaluate(async([full,sub])=>{
  const load=async(n,d)=>{const f=new FontFace(n,Uint8Array.from(atob(d),c=>c.charCodeAt(0)).buffer);await f.load();document.fonts.add(f);};
  await load('Full',full); await load('Sub',sub);
  const tests=['\u{13000}','\u{13000}\u{13430}\u{13001}','\u{13000}\u{13431}\u{13002}\u{13430}\u{13003}','\u{13460}\u{13436}\u{13471}','\u{13000}\u{13439}\u{13001}'];
  const c=document.createElement('canvas'); c.width=400;c.height=120; const x=c.getContext('2d');
  return tests.map(t=>{const out={};for(const f of ['Full','Sub']){x.clearRect(0,0,400,120);x.font=`60px "${f}"`;x.fillText(t,10,90);const d=x.getImageData(0,0,400,120).data;let h=0;for(let i=3;i<d.length;i+=4)h=(h*31+d[i])>>>0;out[f]=[Math.round(x.measureText(t).width*10)/10,h];}return [t.codePointAt(0).toString(16),out.Full,out.Sub,out.Full[1]===out.Sub[1]];});
},[full,sub]);
console.log(JSON.stringify(r)); await b.close();})();
