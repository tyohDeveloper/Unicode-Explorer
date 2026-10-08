/**
 * VIEW: the block-name filter box, the All / None buttons. "All" selects only
 * blocks visible under the current filter, as in v1; "None" clears everything.
 */
import type { SettingsStore } from "./settings/settingsStore.js";
import { setBlocks, setManyBlocks } from "./state/settingsActions.js";
import type { SidebarHandles } from "./sidebar.js";
import { expandCategory, isCollapsed } from "./sidebar.js";

function applyFilter(handles: SidebarHandles, query: string): void {
  const q = query.toLowerCase();
  for (const [category, blocks] of handles.categories) {
    let anyVisible = false;
    for (const b of blocks) {
      const match = q === "" || b.name.toLowerCase().includes(q);
      handles.items.get(b.start)?.classList.toggle("search-hidden", !match);
      anyVisible = anyVisible || match;
    }
    handles.headers.get(category)?.classList.toggle("search-hidden", !anyVisible);
    if (anyVisible && q !== "" && isCollapsed(handles, category)) expandCategory(handles, category);
  }
}

function visibleStarts(handles: SidebarHandles): number[] {
  const starts: number[] = [];
  for (const [start, item] of handles.items) if (!item.classList.contains("search-hidden")) starts.push(start);
  return starts;
}

export function wireSidebarSearch(handles: SidebarHandles, store: SettingsStore, search: HTMLInputElement, all: HTMLButtonElement, none: HTMLButtonElement): void {
  search.addEventListener("input", () => applyFilter(handles, search.value));
  all.addEventListener("click", () => store.dispatch(setManyBlocks(visibleStarts(handles), true)));
  none.addEventListener("click", () => store.dispatch(setBlocks([])));
}
