import type { Settings } from "./settings.js";
import { SIZE_MAX, SIZE_MIN } from "./settings.js";
import type { SettingsAction } from "./settingsActions.js";

function sortedUnique(starts: Iterable<number>): number[] {
  return [...new Set(starts)].sort((a, b) => a - b);
}

function clampSize(size: number): number {
  return Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(size)));
}

function reduceBlocks(state: Settings, action: SettingsAction): readonly number[] {
  if (action.type === "blocks/set") return sortedUnique(action.starts);
  if (action.type === "blocks/toggle") {
    const set = new Set(state.blocks);
    if (set.has(action.start)) set.delete(action.start); else set.add(action.start);
    return sortedUnique(set);
  }
  if (action.type === "blocks/setMany") {
    const set = new Set(state.blocks);
    for (const s of action.starts) if (action.selected) set.add(s); else set.delete(s);
    return sortedUnique(set);
  }
  return state.blocks;
}

/** Pure reducer. Any change to blocks, mode, or filter resets the table sort, as the v1 renderer did. */
export function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case "blocks/set": case "blocks/toggle": case "blocks/setMany":
      return { ...state, blocks: reduceBlocks(state, action), tableSort: null };
    case "mode/set": return { ...state, mode: action.mode, tableSort: null };
    case "font/set": return { ...state, font: action.font };
    case "size/set": return { ...state, size: clampSize(action.size) };
    case "nonVisible/set": return { ...state, nonVisible: action.nonVisible, tableSort: null };
    case "nameFilter/set": return { ...state, nameFilter: action.nameFilter, tableSort: null };
    case "placeholders/set": return { ...state, placeholders: action.placeholders };
    case "lang/set": return { ...state, lang: action.lang };
    case "presentation/set": return { ...state, presentation: action.presentation };
    case "tableSort/toggle": {
      const dir = state.tableSort?.col === action.col ? (state.tableSort.dir === 1 ? -1 : 1) : 1;
      return { ...state, tableSort: { col: action.col, dir } };
    }
    case "settings/hydrate":
      return { ...state, ...action.settings, size: clampSize(action.settings.size ?? state.size), tableSort: null };
  }
}
