/** VIEW: tri-state rendering of a category checkbox from its selected/total counts. */
export function syncCategoryCheckbox(check: HTMLInputElement, selected: number, total: number): void {
  check.indeterminate = false;
  if (total === 0 || selected === 0) check.checked = false;
  else if (selected === total) check.checked = true;
  else { check.checked = false; check.indeterminate = true; }
}
