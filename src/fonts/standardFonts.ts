import table from "../data/embedded-fonts.json";

export interface StandardFont { id: string; family: string; css_family: string; version: string; license: string; license_url: string; role: string; design?: "outline" | "bitmap"; assigned_visible_cmap_count?: number }

export interface StandardFontSet { all: StandardFont[]; coverage: string[]; placeholder: string; detection: string; guaranteed: number; of: number }

/** The fonts embedded in this artifact (src/data/embedded-fonts.json, generated from fonts/manifest.json), by role. */
export function standardFonts(): StandardFontSet {
  const all = table.fonts as StandardFont[];
  return {
    all,
    coverage: all.filter((f) => f.role === "coverage").map((f) => f.css_family),
    placeholder: all.find((f) => f.role === "placeholder")?.css_family ?? "",
    detection: all.find((f) => f.role === "detection")?.css_family ?? "",
    guaranteed: table.guaranteed,
    of: table.of,
  };
}
