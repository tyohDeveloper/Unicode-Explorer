export interface CellMetrics { width: number; height: number; gap: number }

/** Pixel height of `count` cells laid out in rows across `containerWidth` (placeholder sizing before materialisation). */
export function estimateChunkHeight(count: number, containerWidth: number, cell: CellMetrics): number {
  if (count <= 0) return 0;
  const perRow = Math.max(1, Math.floor((containerWidth + cell.gap) / (cell.width + cell.gap)));
  const rows = Math.ceil(count / perRow);
  return rows * (cell.height + cell.gap);
}
