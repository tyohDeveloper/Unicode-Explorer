import re,json,collections
U='/tmp/ucd/'
def rng(s):
    a=s.split('..');return int(a[0],16),int(a[-1],16)
def prop(fn):
    d={}
    for l in open(U+fn):
        l=l.split('#')[0].strip()
        if not l: continue
        f=[x.strip() for x in l.split(';')]
        a,b=rng(f[0]); d.setdefault(f[1],[]).append((a,b))
    return d
# UnicodeData
names={};gc={};ranges=[]
first=None
for l in open(U+'UnicodeData.txt'):
    f=l.rstrip('\n').split(';');cp=int(f[0],16);n=f[1]
    if n.endswith(', First>'): first=(cp,n,f[2]);continue
    if n.endswith(', Last>'):
        ranges.append((first[0],cp,first[1][1:-8]));
        for c in range(first[0],cp+1): gc[c]=f[2]
        continue
    gc[cp]=f[2]; names[cp]=n
blocks=[]
for l in open(U+'Blocks.txt'):
    l=l.split('#')[0].strip()
    if not l: continue
    r,n=l.split(';');a,b=rng(r);blocks.append((n.strip(),a,b))
