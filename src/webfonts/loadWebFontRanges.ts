/** CONTROLLER: unpack data/web-fonts.json ranges (deflate-raw+base64) with the browser's DecompressionStream, once. */
import table from "../../data/web-fonts.json";

export type RangeTable = Record<string, number[][]>;

let pending: Promise<RangeTable> | null = null;

async function inflate(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

export function loadWebFontRanges(): Promise<RangeTable> {
  pending ??= inflate(table.ranges).then((json) => JSON.parse(json) as RangeTable);
  return pending;
}
