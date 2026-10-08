import { editions, fonts } from "../../fonts/manifest.json";

export interface StandardFont { id: string; family: string; css_family: string; version: string; license: string; license_url: string; role: string; assigned_visible_cmap_count?: number }

export interface StandardFontSet { all: StandardFont[]; coverage: string[]; placeholder: string; detection: string; guaranteed: number; of: number }

/** The fonts embedded in this artifact (fonts/manifest.json, standard edition), by role. */
export function standardFonts(): StandardFontSet {
  const standard = editions.find((e) => e.id === "standard");
  const all: StandardFont[] = [];
  for (const id of standard?.fonts ?? []) {
    const font = (fonts as StandardFont[]).find((f) => f.id === id);
    if (font) all.push(font);
  }
  return {
    all,
    coverage: all.filter((f) => f.role === "coverage").map((f) => f.css_family),
    placeholder: all.find((f) => f.role === "placeholder")?.css_family ?? "",
    detection: all.find((f) => f.role === "detection")?.css_family ?? "",
    guaranteed: standard?.guaranteed_visible_code_points ?? 0,
    of: standard?.of ?? 0,
  };
}
