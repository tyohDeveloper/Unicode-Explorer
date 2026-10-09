import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM script without types
import { unreleasedDataChanges } from "../scripts/release-guard.mjs";

describe("release guard (CP4-05)", () => {
  it("flags data files and the font manifest, not the data release files or app code", () => {
    expect(unreleasedDataChanges(["fonts/manifest.json", "data/device-fonts.json", "data/CHANGELOG.md", "data/version.json", "src/main.ts", "fonts/standard/x.woff2"]))
      .toEqual(["fonts/manifest.json", "data/device-fonts.json"]);
  });
  it("passes when nothing on the data track changed", () => {
    expect(unreleasedDataChanges(["src/main.ts", "CHANGELOG.md"])).toEqual([]);
  });
});
