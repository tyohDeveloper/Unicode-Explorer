exec(open('/tmp/aud/gap.py').read().replace("print(f'{f:42s}","(lambda *a:None)(f'{f:42s}").split("rem=set(missing)")[0])
import os
K='/tmp/kit/unicode-font-kit/fonts/';Gp='/tmp/gapfonts/'
def sz(p): return os.path.getsize(p)
uni=cmaps['unifont-17.0.05.woff2']|cmaps['unifont_upper-17.0.05.woff2']
jig=cmaps['Jigmo2.woff2']|cmaps['Jigmo3.woff2']
noto=G['NotoSansEgyptianHieroglyphs-Regular.ttf']|G['NotoSansCuneiform-Regular.ttf']|G['NotoSansAnatolianHieroglyphs-Regular.ttf']|G['NotoSansBamum-Regular.ttf']|G['NotoSerifTangut-Regular.ttf']
base=sz(K+'unifont-17.0.05.woff2')+sz(K+'unifont_upper-17.0.05.woff2'); lr=sz(Gp+'LastResortHE-Regular.woff2')
js=sz(K+'Jigmo2.woff2')+sz(K+'Jigmo3.woff2')
ns=sum(sz(Gp+f) for f in ['NotoSansEgyptianHieroglyphs-Regular.woff2','NotoSansCuneiform-Regular.woff2','NotoSansAnatolianHieroglyphs-Regular.woff2','NotoSansBamum-Regular.woff2','NotoSerifTangut-Regular.woff2'])
ng=sz(Gp+'NewGardiner.woff2'); uh=sz(Gp+'UniHieroglyphica.woff2')
T=len(target)
def row(n,cov,b): 
    c=len(cov&target);print(f'{n:55s} {c:7d} {100*c/T:5.1f}%  fonts {b/1048576:6.2f} MB  html≈{(b*4/3+406485)/1048576:6.2f} MB')
row('B: Unifont pair',uni,base)
row('B+: Unifont pair + LastResortHE (fallback glyphs)',uni,base+lr)
row('C1: + Jigmo2/3',uni|jig,base+lr+js)
row('C2: + Noto historic set',uni|jig|noto,base+lr+js+ns)
row('C3: + NewGardiner',uni|jig|noto|G['NewGardiner.ttf'],base+lr+js+ns+ng)
row('C4: + UniHieroglyphica (instead of NewGardiner)',uni|jig|noto|G['UniHieroglyphica.ttf'],base+lr+js+ns+uh)
print('target',T)
