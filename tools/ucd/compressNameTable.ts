/**
 * Compress the delta-encoded name table with raw DEFLATE (fflate, pure JS so
 * the bytes are identical on every Node version) and return base64. The
 * browser decodes it with DecompressionStream("deflate-raw") in
 * src/names/loadNameTable.ts; the delta format is reversed by
 * src/names/decodeNameTable.ts.
 */
import { deflateSync, strToU8 } from "fflate";
import { encodeNameMap } from "./encodeNameMap.js";

export function compressNameTable(nameMap: Map<number, string>): string {
  const bytes = deflateSync(strToU8(encodeNameMap(nameMap)), { level: 9, mem: 12 });
  return Buffer.from(bytes).toString("base64");
}
