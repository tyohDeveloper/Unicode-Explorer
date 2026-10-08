/** VIEW: "Copy output" — every assigned character of the current output, space-separated, independent of what is materialised. */
import { copyText } from "./clipboard/copyText.js";
import { flashLabel } from "./flashLabel.js";

export function wireCopyOutput(button: HTMLButtonElement, status: HTMLElement, getText: () => string): void {
  button.addEventListener("click", async () => {
    const text = getText();
    if (!text) { status.textContent = "Nothing to copy \u2014 select some blocks first."; return; }
    if (await copyText(text)) flashLabel(button, "Copied!");
  });
}
