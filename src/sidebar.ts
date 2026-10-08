/**
 * VIEW: block list grouped by collapsible category, with tri-state category
 * checkboxes. All selection changes go through the store; this file never
 * decides what is selected, it only reflects Settings.blocks.
 */
import { formatHex } from "./codepoint/formatHex.js";
import { makeElement } from "./makeElement.js";
import { slugify } from "./markup/slugify.js";
import type { SettingsStore } from "./settings/settingsStore.js";
import type { Settings } from "./state/settings.js";
import { setManyBlocks, toggleBlock } from "./state/settingsActions.js";
import type { Block } from "./ucd/listBlocks.js";
import { listBlocks } from "./ucd/listBlocks.js";
import { syncCategoryCheckbox } from "./categoryCheckbox.js";

export interface SidebarHandles {
  list: HTMLUListElement;
  headers: Map<string, HTMLLIElement>;
  items: Map<number, HTMLLIElement>;
  categoryChecks: Map<string, HTMLInputElement>;
  categories: Map<string, Block[]>;
}

function groupByCategory(blocks: readonly Block[]): Map<string, Block[]> {
  const categories = new Map<string, Block[]>();
  for (const b of blocks) {
    const list = categories.get(b.category);
    if (list) list.push(b); else categories.set(b.category, [b]);
  }
  return categories;
}

function makeCategoryHeader(category: string, blocks: Block[], store: SettingsStore): { header: HTMLLIElement; check: HTMLInputElement } {
  const slug = slugify(category);
  const check = makeElement("input", { type: "checkbox", class: "cat-check", title: `Select / deselect all blocks in ${category}`, "data-testid": `checkbox-sidebar-category-${slug}` });
  check.addEventListener("click", (ev) => {
    ev.stopPropagation();
    check.indeterminate = false;
    store.dispatch(setManyBlocks(blocks.map((b) => b.start), check.checked));
  });
  const toggle = makeElement("span", { class: "cat-toggle", text: "\u25BC" });
  const header = makeElement("li", { class: "cat-header", "data-cat": category, "data-testid": `button-sidebar-category-${slug}`, role: "button", "aria-expanded": "true" }, [check, toggle, category]);
  return { header, check };
}

function makeBlockItem(block: Block, store: SettingsStore): HTMLLIElement {
  const hex = formatHex(block.start);
  const check = makeElement("input", { type: "checkbox", class: "blk-check", id: `blk-${hex}`, "data-testid": `checkbox-sidebar-block-${hex}`, "aria-label": block.name });
  const name = makeElement("span", { class: "block-name", text: block.name });
  const range = makeElement("span", { class: "block-range", text: `${hex}\u2013${formatHex(block.end)}` });
  const li = makeElement("li", { class: "block-item", "data-cat": block.category, "data-start": String(block.start) }, [check, name, range]);
  li.addEventListener("click", (ev) => {
    if (ev.target === check) ev.preventDefault();
    store.dispatch(toggleBlock(block.start));
  });
  return li;
}

function setCollapsed(handles: SidebarHandles, category: string, collapsed: boolean): void {
  const header = handles.headers.get(category);
  if (!header) return;
  header.classList.toggle("collapsed", collapsed);
  header.setAttribute("aria-expanded", String(!collapsed));
  for (const b of handles.categories.get(category) ?? []) handles.items.get(b.start)?.classList.toggle("cat-hidden", collapsed);
}

export function isCollapsed(handles: SidebarHandles, category: string): boolean {
  return handles.headers.get(category)?.classList.contains("collapsed") ?? false;
}

export function expandCategory(handles: SidebarHandles, category: string): void {
  setCollapsed(handles, category, false);
}

function appendCategory(handles: SidebarHandles, category: string, blocks: Block[], store: SettingsStore): void {
  const { header, check } = makeCategoryHeader(category, blocks, store);
  header.addEventListener("click", (ev) => {
    if (ev.target === check) return;
    setCollapsed(handles, category, !isCollapsed(handles, category));
  });
  handles.headers.set(category, header);
  handles.categoryChecks.set(category, check);
  handles.list.append(header);
  for (const block of blocks) {
    const item = makeBlockItem(block, store);
    handles.items.set(block.start, item);
    handles.list.append(item);
  }
}

/** Reflect Settings.blocks into the checkboxes and the tri-state category boxes. */
export function reflectSelection(handles: SidebarHandles, settings: Settings): void {
  const selected = new Set(settings.blocks);
  for (const [start, item] of handles.items) {
    const check = item.querySelector<HTMLInputElement>("input.blk-check");
    if (check) check.checked = selected.has(start);
  }
  for (const [category, blocks] of handles.categories) {
    const check = handles.categoryChecks.get(category);
    if (check) syncCategoryCheckbox(check, blocks.filter((b) => selected.has(b.start)).length, blocks.length);
  }
}

/** Build the sidebar into #block-list. Every category except the first starts collapsed, as in v1. */
export function buildSidebar(list: HTMLUListElement, store: SettingsStore): SidebarHandles {
  const categories = groupByCategory(listBlocks());
  const handles: SidebarHandles = { list, headers: new Map(), items: new Map(), categoryChecks: new Map(), categories };
  for (const [category, blocks] of categories) appendCategory(handles, category, blocks, store);
  let first = true;
  for (const category of categories.keys()) {
    if (!first) setCollapsed(handles, category, true);
    first = false;
  }
  reflectSelection(handles, store.get());
  return handles;
}
