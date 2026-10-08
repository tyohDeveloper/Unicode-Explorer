exec(open('/tmp/aud/ucd.py').read())
import re
src=open('/home/user/workspace/Unicode-Explorer/unicode-src/data/blocks.js').read()
app=[(m[0],int(m[1],16),int(m[2],16),m[3]) for m in re.findall(r'\["([^"]+)",0x([0-9A-F]+),0x([0-9A-F]+),"([^"]+)"\]',src)]
print('official blocks',len(blocks),'app blocks',len(app))
ob={(a,b):n for n,a,b in blocks}; ab={(a,b):n for n,a,b,c in app}
print('missing in app',[ (hex(a),n) for (a,b),n in ob.items() if (a,b) not in ab])
print('extra in app',[ (hex(a),n) for (a,b),n in ab.items() if (a,b) not in ob])
print('name mismatches',[(ob[k],ab[k]) for k in ob if k in ab and ob[k]!=ab[k]])
# order
print('app sorted by cp?', [x[1] for x in app]==sorted(x[1] for x in app))
cats=collections.Counter(c for *_,c in app);print(cats)
print('range markers',[(hex(a),hex(b),n) for a,b,n in ranges])
