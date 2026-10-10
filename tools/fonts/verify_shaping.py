"""Shaping parity for shipped fonts (PLAN.md Phase 10, R-1).

Every font the app ships, as the exact bytes that ship (fonts/standard/*.woff2 for the
embedded fonts, unicode-fonts/<pack>.js for the packs), is shaped with HarfBuzz against
its full upstream source (fonts/cache/<id>.source.*), over a corpus the shipped font fully
covers: data/script-samples.json, every block's characters in runs, each combining mark on
a base letter and on U+25CC, and consonant + virama + consonant for Brahmic blocks. Glyph
names, clusters, advances and offsets must match. Needs fetch:fonts and build:packs first.

usage: python3 tools/fonts/verify_shaping.py [--report path.json]
"""
import base64
import io
import json
import re
import sys
import zipfile
from pathlib import Path

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
RUN = 12  # characters per run of a block's repertoire
SKIPPED: list = []  # strings both fonts refuse at HarfBuzz's limits


def sfnt_bytes(data: bytes) -> bytes:
    """WOFF/WOFF2 → plain SFNT for HarfBuzz."""
    font = TTFont(io.BytesIO(data), recalcTimestamp=False)
    font.flavor = None
    out = io.BytesIO()
    font.save(out)
    return out.getvalue()


def source_bytes(font: dict) -> bytes:
    fmt = font["source"]["format"].split("/")[0]
    raw = (ROOT / "fonts/cache" / f"{font['id']}.source.{fmt}").read_bytes()
    if font["source"].get("member"):
        raw = zipfile.ZipFile(io.BytesIO(raw)).read(font["source"]["member"])
    return sfnt_bytes(raw) if raw[:4] in (b"wOFF", b"wOF2") else raw


def ucd():
    blocks, ccc, gc = [], {}, {}
    for line in (ROOT / "data/ucd").glob("*/Blocks.txt").__next__().read_text().splitlines():
        m = re.match(r"([0-9A-F]+)\.\.([0-9A-F]+); (.+)", line)
        if m:
            blocks.append((int(m[1], 16), int(m[2], 16), m[3]))
    for line in (ROOT / "data/ucd").glob("*/UnicodeData.txt").__next__().read_text().splitlines():
        f = line.split(";")
        gc[int(f[0], 16)], ccc[int(f[0], 16)] = f[2], int(f[3])
    return blocks, ccc, gc


def corpus(cmap: set, blocks, ccc, gc, samples) -> list:
    out = [s for s in samples if all(ord(c) in cmap for c in s)]
    for start, end, _ in blocks:
        cps = [cp for cp in range(start, end + 1) if cp in cmap and gc.get(cp, "Cn")[0] in "LMNPS"]
        if not cps:
            continue
        out += ["".join(map(chr, cps[i:i + RUN])) for i in range(0, len(cps), RUN)]
        letters = [cp for cp in cps if gc[cp][0] == "L"]
        for mark in (cp for cp in cps if gc[cp][0] == "M"):
            if letters:
                out.append(chr(letters[0]) + chr(mark))
            if 0x25CC in cmap:
                out.append("\u25cc" + chr(mark))
            if ccc.get(mark) == 9 and len(letters) > 1:
                out.append(chr(letters[0]) + chr(mark) + chr(letters[1]))
    return out


def shape(face_font, names, text: str):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    try:
        hb.shape(face_font, buf)
    except MemoryError:  # HarfBuzz's max_ops/max_len guard (e.g. Duployan's long chains)
        return "limit"
    return [(names[i.codepoint], i.cluster, p.x_advance, p.y_advance, p.x_offset, p.y_offset) for i, p in zip(buf.glyph_infos, buf.glyph_positions)]


def compare(label: str, shipped: bytes, full: bytes, texts) -> list:
    fonts = []
    for data in (shipped, full):
        fonts.append((hb.Font(hb.Face(data)), TTFont(io.BytesIO(data)).getGlyphOrder()))
    bad = []
    for text in texts:
        a, b = (shape(f, n, text) for f, n in fonts)
        if a == b == "limit":
            SKIPPED.append({"font": label, "codepoints": " ".join(f"U+{ord(c):04X}" for c in text)})
            continue
        if a != b:
            bad.append({"font": label, "text": text, "codepoints": " ".join(f"U+{ord(c):04X}" for c in text), "shipped": a if isinstance(a, str) else a[:8], "full": b if isinstance(b, str) else b[:8]})
    return bad


def shipped_fonts(manifest: dict):
    by_id = {f["id"]: f for f in manifest["fonts"]}
    standard = next(e for e in manifest["editions"] if e["id"] == "standard")
    for fid in standard["fonts"]:
        f = by_id[fid]
        if f.get("role") == "coverage":
            yield fid, f, (ROOT / f["vendored"]).read_bytes()
    for pack in manifest["packs"]:
        path = ROOT / "unicode-fonts" / f"{pack['id']}.js"
        payload = json.loads(path.read_text().split("]=", 1)[1].rstrip().rstrip(";"))
        for fid, entry in zip(pack["fonts"], payload["fonts"]):
            yield f"{pack['id']}/{fid}", by_id[fid], base64.b64decode(entry["data"])


def main() -> None:
    manifest = json.loads((ROOT / "fonts/manifest.json").read_text())
    samples = [s["text"] for s in json.loads((ROOT / "data/script-samples.json").read_text())["samples"]]
    blocks, ccc, gc = ucd()
    bad, checked, strings = [], 0, 0
    for label, font, data in shipped_fonts(manifest):
        shipped, full = sfnt_bytes(data), source_bytes(font)
        # Characters both fonts map: borrowed glyphs (D-27) exist only in the shipped font.
        cmap = set(TTFont(io.BytesIO(shipped)).getBestCmap()) & set(TTFont(io.BytesIO(full)).getBestCmap())
        texts = corpus(cmap, blocks, ccc, gc, samples)
        if "--verbose" in sys.argv:
            print(f"  {label}: {len(texts)} strings", file=sys.stderr, flush=True)
        bad += compare(label, shipped, full, texts)
        checked, strings = checked + 1, strings + len(texts)
    report = {"fonts": checked, "strings": strings, "mismatches": len(bad), "skipped_at_harfbuzz_limits": SKIPPED, "examples": bad[:50]}
    if "--report" in sys.argv:
        Path(sys.argv[sys.argv.index("--report") + 1]).write_text(json.dumps(report, ensure_ascii=False, indent=1) + "\n")
    print(f"verify:shaping {'OK' if not bad else 'FAILED'} — {checked} shipped fonts, {strings} strings, {len(bad)} mismatches, {len(SKIPPED)} skipped at HarfBuzz limits")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
