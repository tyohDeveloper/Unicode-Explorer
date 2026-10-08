import * as fontkit from "fontkit";

/** Sorted code points in the font's Unicode cmap (TTF, OTF, WOFF, WOFF2). */
export function readCmap(bytes: Uint8Array): number[] {
  const font = fontkit.create(Buffer.from(bytes)) as fontkit.Font;
  return [...new Set(font.characterSet)].sort((a, b) => a - b);
}
