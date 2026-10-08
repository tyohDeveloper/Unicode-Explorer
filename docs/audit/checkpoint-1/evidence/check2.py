exec(open('/tmp/aud/ucd.py').read())
ALGO=[(0x3400,0x4DBF,"CJK UNIFIED IDEOGRAPH-"),(0x4E00,0x9FFF,"CJK UNIFIED IDEOGRAPH-"),(0x20000,0x2A6DF,"CJK UNIFIED IDEOGRAPH-"),(0x2A700,0x2B73F,"CJK UNIFIED IDEOGRAPH-"),(0x2B740,0x2B81F,"CJK UNIFIED IDEOGRAPH-"),(0x2B820,0x2CEAF,"CJK UNIFIED IDEOGRAPH-"),(0x2CEB0,0x2EBEF,"CJK UNIFIED IDEOGRAPH-"),(0x30000,0x3134F,"CJK UNIFIED IDEOGRAPH-"),(0x31350,0x323AF,"CJK UNIFIED IDEOGRAPH-"),(0x323B0,0x3347F,"CJK UNIFIED IDEOGRAPH-"),(0x2EBF0,0x2EE5F,"CJK UNIFIED IDEOGRAPH-"),(0xF900,0xFAFF,"CJK COMPATIBILITY IDEOGRAPH-"),(0x2F800,0x2FA1F,"CJK COMPATIBILITY IDEOGRAPH-"),(0x17000,0x187FF,"TANGUT IDEOGRAPH-"),(0x18D00,0x18D7F,"TANGUT IDEOGRAPH-"),(0x1B170,0x1B2FF,"NUSHU CHARACTER-"),(0x18B00,0x18CFF,"KHITAN SMALL SCRIPT CHARACTER-")]
L="G GG N D DD R M B BB S SS _ J JJ C K T P H".split();L[11]=""
V="A AE YA YAE EO E YEO YE O WA WAE OE YO U WEO WE WI YU EU YI I".split()
T=[""]+"G GG GS N NJ NH D L LG LM LB LS LT LP LH M B BS S SS NG J C K T P H".split()
def hang(cp):
    s=cp-0xAC00;return L[s//588]+V[(s%588)//28]+T[s%28]
def app_name(cp):
    if cp in names and not names[cp].startswith('<'): return names[cp]
    for a,b,p in ALGO:
        if a<=cp<=b: return p+'%04X'%cp
    if 0xAC00<=cp<=0xD7A3: return "HANGUL SYLLABLE "+hang(cp)
    return None
def expected(cp):
    if cp in names: return names[cp] if not names[cp].startswith('<') else None
    for a,b,n in ranges:
        if a<=cp<=b:
            if 'CJK' in n: return 'CJK UNIFIED IDEOGRAPH-%04X'%cp
            if 'Tangut' in n: return 'TANGUT IDEOGRAPH-%04X'%cp
            if 'Hangul' in n: return 'HANGUL SYLLABLE '+hang(cp)
            return None
    return None
bad=[];missing=[]
for cp in gc:
    e=expected(cp)
    if e is None: continue
    a=app_name(cp)
    if a!=e: bad.append((hex(cp),e,a))
print('assigned (incl ranges):',len(gc),' mismatched names:',len(bad)); print(bad[:10])
# Hangul spot-check vs known: U+AC00 GA, U+D7A3 HIH, U+B620? 
print(hang(0xAC00),hang(0xD7A3),hang(0xAC01))
# aliases
al=[l.split(';') for l in open(U+'NameAliases.txt') if l.strip() and not l.startswith('#')]
import collections
print('aliases by type',collections.Counter(x[2].strip() for x in al))
