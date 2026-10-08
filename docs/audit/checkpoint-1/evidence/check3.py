exec(open('/tmp/aud/ucd.py').read())
def isNV(cp):
    return (cp<=0x1F or 0x7F<=cp<=0x9F or 0xD800<=cp<=0xDFFF or cp==0xFEFF or 0xFFF9<=cp<=0xFFFB or (cp&0xFFFF) in (0xFFFE,0xFFFF)
      or 0xFDD0<=cp<=0xFDEF or 0x200B<=cp<=0x200F or 0x202A<=cp<=0x202E or 0x2060<=cp<=0x206F or 0xFE00<=cp<=0xFE0F
      or 0xE0000<=cp<=0xE01EF or 0xE000<=cp<=0xF8FF or cp>=0xF0000)
dcp=prop('DerivedCoreProperties.txt')
def inr(cp,rs): return any(a<=cp<=b for a,b in rs)
DI=set();[DI.update(range(a,b+1)) for a,b in dcp['Default_Ignorable_Code_Point']]
pl=prop('PropList.txt');WS=set();[WS.update(range(a,b+1)) for a,b in pl['White_Space']]
import collections
shown_invisible=collections.Counter();ex=collections.defaultdict(list)
hidden_visible=[]
for cp,g in gc.items():
    if g in('Cs',): continue
    nv=isNV(cp)
    invisible = cp in DI or g in('Cc','Cf','Zl','Zp') 
    if not nv and invisible:
        k='DefaultIgnorable' if cp in DI else g; shown_invisible[k]+=1; ex[k].append('%04X'%cp)
    if nv and not invisible and g not in ('Co',) and not ((cp&0xFFFF)>=0xFFFE):
        hidden_visible.append(('%04X'%cp,g,names.get(cp)))
print('shown by default but invisible/format:',dict(shown_invisible))
for k,v in ex.items(): print(k,len(v),v[:40])
print('hidden but actually graphic:',hidden_visible)
ws=[('%04X'%c,gc[c]) for c in sorted(WS) if not isNV(c)];print('whitespace shown:',ws)
# combining marks
M=[c for c,g in gc.items() if g in('Mn','Mc','Me')];print('combining marks (Mn/Mc/Me):',len(M))
# total shown if All selected
blk_total=sum(b-a+1 for n,a,b in blocks)
cells=0;assigned_vis=0
for n,a,b in blocks:
    for cp in range(a,b+1):
        if 0xD800<=cp<=0xDFFF: continue
        res = cp not in gc and not(0xE000<=cp<=0xF8FF or cp>=0xF0000 or 0xFDD0<=cp<=0xFDEF or (cp&0xFFFF)>=0xFFFE)
        if res or not isNV(cp): cells+=1
        if not res and not isNV(cp): assigned_vis+=1
print('block span',blk_total,'cells rendered for All (default):',cells,'assigned visible:',assigned_vis)
graphic=sum(1 for c,g in gc.items() if g not in('Cc','Cf','Cs','Co','Zl','Zp') and c not in DI)
print('graphic assigned (excl Co/Cs/Cc/Cf/DI):',graphic)
age=prop('DerivedAge.txt');print('ages',sorted(age.keys(),key=float)[-4:]); a17=sum(b-a+1 for a,b in age['17.0']);a16=sum(b-a+1 for a,b in age['16.0']);print('new in 16:',a16,'new in 17:',a17)
