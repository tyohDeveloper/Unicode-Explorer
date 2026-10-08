/**
 * CONTROLLER: decode the embedded character-name table. The bundle carries
 * raw-DEFLATE bytes as base64 (tools/ucd/compressNameTable.ts); the browser's
 * DecompressionStream expands them, then the pure delta decoder rebuilds the map.
 * This is the only asynchronous start-up step and touches no network.
 */
import names from "../data/names.json";
import { decodeNameTable } from "./decodeNameTable.js";

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function loadNameTable(): Promise<Map<number, string>> {
  const stream = new Blob([base64ToBytes(names.data)]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  const table = decodeNameTable(await new Response(stream).text());
  if (table.size !== names.count) throw new Error(`name table decoded ${table.size} entries, expected ${names.count}`);
  return table;
}
