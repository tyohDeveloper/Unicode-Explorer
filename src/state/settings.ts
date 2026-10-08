import type { TableSort } from "../selection/sortTableItems.js";

export type DisplayMode = "grid" | "grid-cp" | "grid-name" | "table" | "plain";
export const DISPLAY_MODES: readonly DisplayMode[] = ["grid", "grid-cp", "grid-name", "table", "plain"];

/** Emoji presentation for the output (GLY-06): browser default, force text, or force colour emoji. */
export type Presentation = "" | "text" | "emoji";
export const PRESENTATIONS: readonly Presentation[] = ["", "text", "emoji"];

/** Durable domain state (CODING-STANDARDS §2). Blocks are identified by start code point. */
export interface Settings {
  blocks: readonly number[];
  mode: DisplayMode;
  font: string;
  size: number;
  nonVisible: boolean;
  nameFilter: string;
  tableSort: TableSort | null;
  /** Draw Last Resort placeholders for glyphs no listed font renders (Phase 4). */
  placeholders: boolean;
  /** BCP 47 tag applied to the output for CJK locale-sensitive glyph forms; "" = inherit. */
  lang: string;
  presentation: Presentation;
}

export const SIZE_MIN = 10;
export const SIZE_MAX = 48;

export const initialSettings: Settings = {
  blocks: [],
  mode: "grid",
  font: "system-ui",
  size: 18,
  nonVisible: false,
  nameFilter: "",
  tableSort: null,
  placeholders: false,
  lang: "",
  presentation: "",
};
