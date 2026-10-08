import type { TableSortColumn } from "../selection/sortTableItems.js";
import type { DisplayMode, Presentation, Settings } from "./settings.js";

export type SettingsAction =
  | { type: "blocks/set"; starts: readonly number[] }
  | { type: "blocks/toggle"; start: number }
  | { type: "blocks/setMany"; starts: readonly number[]; selected: boolean }
  | { type: "mode/set"; mode: DisplayMode }
  | { type: "font/set"; font: string }
  | { type: "size/set"; size: number }
  | { type: "nonVisible/set"; nonVisible: boolean }
  | { type: "nameFilter/set"; nameFilter: string }
  | { type: "tableSort/toggle"; col: TableSortColumn }
  | { type: "placeholders/set"; placeholders: boolean }
  | { type: "lang/set"; lang: string }
  | { type: "presentation/set"; presentation: Presentation }
  | { type: "style/set"; bold?: boolean; italic?: boolean; noSynthesis?: boolean }
  | { type: "settings/hydrate"; settings: Partial<Settings> };

export const setBlocks = (starts: readonly number[]): SettingsAction => ({ type: "blocks/set", starts });
export const toggleBlock = (start: number): SettingsAction => ({ type: "blocks/toggle", start });
export const setManyBlocks = (starts: readonly number[], selected: boolean): SettingsAction => ({ type: "blocks/setMany", starts, selected });
export const setMode = (mode: DisplayMode): SettingsAction => ({ type: "mode/set", mode });
export const setFont = (font: string): SettingsAction => ({ type: "font/set", font });
export const setSize = (size: number): SettingsAction => ({ type: "size/set", size });
export const setNonVisible = (nonVisible: boolean): SettingsAction => ({ type: "nonVisible/set", nonVisible });
export const setNameFilter = (nameFilter: string): SettingsAction => ({ type: "nameFilter/set", nameFilter });
export const toggleTableSort = (col: TableSortColumn): SettingsAction => ({ type: "tableSort/toggle", col });
export const setPlaceholders = (placeholders: boolean): SettingsAction => ({ type: "placeholders/set", placeholders });
export const setLang = (lang: string): SettingsAction => ({ type: "lang/set", lang });
export const setPresentation = (presentation: Presentation): SettingsAction => ({ type: "presentation/set", presentation });
export const setTextStyle = (style: { bold?: boolean; italic?: boolean; noSynthesis?: boolean }): SettingsAction => ({ type: "style/set", ...style });
export const hydrateSettings = (settings: Partial<Settings>): SettingsAction => ({ type: "settings/hydrate", settings });
