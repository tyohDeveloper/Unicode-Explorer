exec(open('/tmp/aud/ucd.py').read())
from fontTools.ttLib import TTFont
import glob,os,json,collections
dcp=prop('DerivedCoreProperties.txt');DI=set()
for a,b in dcp['Default_Ignorable_Code_Point']: DI.update(range(a,b+1))
target={c for c,g in gc.items() if g not in('Cc','Cs','Co','Cn','Zl','Zp') and c not in DI and not (g=='Cf')}
# include visible Cf (prepended concatenation marks)
PCM=set();pl=prop('PropList.txt')
for a,b in pl['Prepended_Concatenation_Mark']: PCM.update(range(a,b+1))
target|=PCM
print('target visible assigned',len(target))
cmaps={}
for f in sorted(glob.glob('/tmp/kit/unicode-font-kit/fonts/*.woff2')):
    t=TTFont(f,lazy=True); cmaps[os.path.basename(f)]=set(t.getBestCmap().keys())
json.dump({k:len(v) for k,v in cmaps.items()},open('/tmp/aud/kit_cmaps.json','w'))
def union(pred): 
    s=set()
    for k,v in cmaps.items():
        if pred(k): s|=v
    return s
profiles={
 'full_kit':union(lambda k:True),
 'unifont_pair':union(lambda k:k.startswith('unifont')),
 'unifont_pair+jigmo':union(lambda k:k.startswith('unifont') or k.startswith('Jigmo')),
 'kit_minus_cjk_big':union(lambda k:not k.startswith('NotoS') or 'CJK' not in k),
}
for n,s in profiles.items(): print(n,len(s&target),'/',len(target),'missing',len(target-s))
full=profiles['full_kit']
rows=[]
for n,a,b in blocks:
    t=[c for c in range(a,b+1) if c in target]
    if not t: continue
    m=[c for c in t if c not in full]; u=[c for c in t if c not in profiles['unifont_pair+jigmo']]
    rows.append((n,'%04X'%a,len(t),len(t)-len(m),len(m),len(u)))
gaps=[r for r in rows if r[4]>0]
gaps.sort(key=lambda r:-r[4])
print('blocks with any gap in full kit:',len(gaps),'of',len(rows))
for r in gaps: print(r)
json.dump(rows,open('/tmp/aud/block_cov.json','w'))
# missing by Age
age=prop('DerivedAge.txt');agec={}
for v,rs in age.items():
    for a,b in rs:
        for c in range(a,b+1): agec[c]=v
print('missing by age', collections.Counter(agec.get(c) for c in target-full).most_common())

print('---- greedy coverage per byte (regular/upright faces only) ----')
sizes={k:os.path.getsize('/tmp/kit/unicode-font-kit/fonts/'+k) for k in cmaps}
cand={k for k in cmaps if not any(s in k for s in ('Bold','Italic','Oblique'))}
cov=set();chosen=[]
while True:
    best=None
    for k in cand-set(chosen):
        gain=len((cmaps[k]&target)-cov)
        if gain<50: continue
        sc=gain/sizes[k]
        if not best or sc>best[0]: best=(sc,k,gain)
    if not best: break
    chosen.append(best[1]); cov|=cmaps[best[1]]&target
    print(f'{best[1]:34s} +{best[2]:6d} cum {len(cov):6d} ({100*len(cov)/len(target):5.1f}%) size {sizes[best[1]]/1024:8.1f} KB cumsize {sum(sizes[c] for c in chosen)/1048576:6.2f} MB')
print('--- unifont pair missing by block (top 15)')
uni=profiles['unifont_pair'];r=[]
for n,a,b in blocks:
    t=[c for c in range(a,b+1) if c in target]; m=[c for c in t if c not in uni]
    if m: r.append((len(m),n))
for x in sorted(r,reverse=True)[:15]: print(x)
print('blocks with missing',len(r),'total',sum(x[0] for x in r))
