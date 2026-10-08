/** CONTROLLER: decode src/data/properties.json (deflate-raw+base64) once, on first use. */
import table from "../data/properties.json";
import { decodeProperties, type Properties, type PropertyTable } from "./decodeProperties.js";

let pending: Promise<Properties> | null = null;

async function inflate(base64: string): Promise<string> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

export function loadProperties(): Promise<Properties> {
  pending ??= inflate(table.data).then((json) => decodeProperties(JSON.parse(json) as PropertyTable));
  return pending;
}
