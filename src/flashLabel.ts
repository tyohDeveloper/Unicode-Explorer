/** VIEW: swap a button's label briefly (transient UI state, < 2 s, no domain meaning). */
export function flashLabel(button: HTMLButtonElement, label: string, ms = 1500): void {
  const original = button.textContent;
  button.textContent = label;
  setTimeout(() => { button.textContent = original; }, ms);
}
