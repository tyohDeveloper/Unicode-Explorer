import { compress } from "wawoff2";

/** TTF/OTF → WOFF2 via Google's woff2 compiled to WebAssembly; deterministic for a pinned package version. */
export async function toWoff2(sfnt: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await compress(sfnt));
}
