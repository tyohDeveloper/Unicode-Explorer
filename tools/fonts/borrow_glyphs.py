"""Copy glyphs for the given code points from a donor CFF font into a target CFF font
that lacks them (PLAN.md D-27). Used to give Unifont Upper the U+25CC DOTTED CIRCLE of
Unifont, which the app draws combining marks on. Both fonts must share unitsPerEm.

usage: borrow_glyphs.py target.otf donor.otf out.otf 25CC[,XXXX...]
"""
import sys

from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.ttLib import TTFont


def borrow(target: TTFont, donor: TTFont, cp: int) -> None:
    if cp in target.getBestCmap():
        return
    source = donor.getBestCmap().get(cp)
    if source is None:
        raise SystemExit(f"donor has no glyph for U+{cp:04X}")
    if target["head"].unitsPerEm != donor["head"].unitsPerEm:
        raise SystemExit("unitsPerEm differs")
    cff = target["CFF "].cff
    top = cff.topDictIndex[0]
    cid_keyed = hasattr(top, "FDArray")
    private = top.FDArray[0].Private if cid_keyed else top.Private
    width, lsb = donor["hmtx"][source]
    default = getattr(private, "defaultWidthX", 0)
    nominal = getattr(private, "nominalWidthX", 0)
    pen = T2CharStringPen(None if width == default else width - nominal, None)
    donor.getGlyphSet()[source].draw(pen)
    charstring = pen.getCharString(private=private, globalSubrs=cff.GlobalSubrs)
    order = list(target.getGlyphOrder())
    name = f"cid{len(order):05d}" if cid_keyed else f"uni{cp:04X}"
    add_charstring(top, name, charstring, cid_keyed)
    order.append(name)
    top.charset = order  # for CFF the charset is the glyph order
    target.setGlyphOrder(order)
    target["hmtx"][name] = (width, lsb)
    target["maxp"].numGlyphs = len(order)
    for table in target["cmap"].tables:
        if table.isUnicode():
            table.cmap[cp] = name


def add_charstring(top, name, charstring, cid_keyed: bool) -> None:
    charstrings = top.CharStrings
    if cid_keyed:
        charstring.fdSelectIndex = 0
        top.FDSelect.gidArray.append(0)
    if charstrings.charStringsAreIndexed:
        charstrings.charStringsIndex.append(charstring)
        charstrings.charStrings[name] = len(charstrings.charStringsIndex) - 1
    else:
        charstrings.charStrings[name] = charstring


def main() -> None:
    target_path, donor_path, out_path, cps = sys.argv[1:5]
    # Keep head.modified as upstream so the output is byte-identical on every machine.
    target, donor = TTFont(target_path, recalcTimestamp=False), TTFont(donor_path)
    for cp in cps.split(","):
        borrow(target, donor, int(cp, 16))
    target.save(out_path)


if __name__ == "__main__":
    main()
