import type { TableSort } from "../selection/sortTableItems.js";

export type DisplayMode = "grid" | "grid-cp" | "grid-name" | "table" | "plain";
export const DISPLAY_MODES: readonly DisplayMode[] = ["grid", "grid-cp", "grid-name", "table", "plain"];

/** Durable domain state (CODING-STANDARDS §2). Blocks are identified by start code point. */
export interface Settings {
  blocks: readonly number[];
  mode: DisplayMode;
  font: string;
  size: number;
  nonVisible: boolean;
  nameFilter: string;
  tableSort: TableSort | null;
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
};
