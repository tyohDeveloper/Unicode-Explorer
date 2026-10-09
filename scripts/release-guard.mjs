/**
 * CP4-05: the data track covers data/ and fonts/manifest.json (data/CHANGELOG.md).
 * Given the paths changed since the last data tag, return those that need a
 * data release before an app release may be tagged. The data changelog and
 * version file are the release itself, so they don't count.
 */
const EXEMPT = new Set(["data/CHANGELOG.md", "data/version.json"]);

export function unreleasedDataChanges(paths) {
  return paths.filter((p) => (p.startsWith("data/") || p === "fonts/manifest.json") && !EXEMPT.has(p));
}
