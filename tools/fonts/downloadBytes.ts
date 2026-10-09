/** Fetch a URL into memory. The only network access in the toolchain (ARCHITECTURE.md §2). */
export async function downloadBytes(url: string, headers: Record<string, string> = {}): Promise<Uint8Array> {
  const response = await fetch(url, { redirect: "follow", headers });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}
