exec(open('/tmp/aud/cov.py').read().split("print('---- greedy")[0].replace("print(","(lambda *a,**k:None)("))
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import compress
import os,io
missing=target-full
G={}
for f in ['NotoSansEgyptianHieroglyphs-Regular.ttf','NotoSansCuneiform-Regular.ttf','NotoSansAnatolianHieroglyphs-Regular.ttf','NotoSansBamum-Regular.ttf','NotoSerifTangut-Regular.ttf','UniHieroglyphica.ttf','NewGardiner.ttf','LastResortHE-Regular.ttf']:
    p='/tmp/gapfonts/'+f; t=TTFont(p); cm=set(t.getBestCmap().keys()); G[f]=cm
    w='/tmp/gapfonts/'+f.rsplit('.',1)[0]+'.woff2'
    if not os.path.exists(w): compress(p,w)
    print(f'{f:42s} cmap {len(cm):6d} closes {len(cm&missing):5d} of gap  ttf {os.path.getsize(p)/1024:8.0f} KB woff2 {os.path.getsize(w)/1024:8.0f} KB')
rem=set(missing)
for f in ['NotoSansCuneiform-Regular.ttf','NotoSansAnatolianHieroglyphs-Regular.ttf','NotoSansBamum-Regular.ttf','NotoSerifTangut-Regular.ttf','UniHieroglyphica.ttf']:
    rem-=G[f]
print('remaining after Noto set + UniHieroglyphica:',len(rem))
import collections
bl=collections.Counter()
for c in rem:
    for n,a,b in blocks:
        if a<=c<=b: bl[n]+=1
print(bl)
print('LastResortHE covers missing?', len(missing & G['LastResortHE-Regular.ttf']), 'all target?', len(target&G['LastResortHE-Regular.ttf']))
