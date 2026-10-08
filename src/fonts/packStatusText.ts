export type PackState = "idle" | "loading" | "loaded" | "failed";
export interface PackStatus { id: string; label: string; state: PackState; bytes: number }

const mb = (bytes: number) => `${(bytes / 1048576).toFixed(bytes >= 10485760 ? 0 : 1)} MB`;

/** One-line font-pack status for the status bar; "" when nothing is happening. */
export function packStatusText(statuses: readonly PackStatus[]): string {
  const loading = statuses.filter((s) => s.state === "loading");
  const loaded = statuses.filter((s) => s.state === "loaded");
  const failed = statuses.filter((s) => s.state === "failed");
  const parts: string[] = [];
  if (loading.length) parts.push(`Loading font pack${loading.length > 1 ? "s" : ""}: ${loading.map((s) => `${s.label} (${mb(s.bytes)})`).join(", ")}\u2026`);
  if (loaded.length) parts.push(`Font packs: ${loaded.map((s) => s.label).join(", ")}`);
  if (failed.length) parts.push(`Font pack unavailable: ${failed.map((s) => s.label).join(", ")}`);
  return parts.join(" \u00B7 ");
}
