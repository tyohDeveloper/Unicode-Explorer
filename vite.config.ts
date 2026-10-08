import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/** Stamp versions and the block count into index.html (ARCHITECTURE §5, §11). */
function versionStamp(): Plugin {
  const root = import.meta.dirname;
  const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8")) as { version: string };
  const data = JSON.parse(readFileSync(resolve(root, "data/version.json"), "utf-8")) as { data: string; unicode: string };
  const blocks = JSON.parse(readFileSync(resolve(root, "src/data/blocks.json"), "utf-8")) as { blocks: unknown[] };
  const values: Record<string, string> = { APP_VERSION: pkg.version, DATA_VERSION: data.data, UNICODE_VERSION: data.unicode, BLOCK_COUNT: String(blocks.blocks.length) };
  return {
    name: "version-stamp",
    transformIndexHtml: (html) => html.replace(/%([A-Z_]+)%/g, (m, key: string) => values[key] ?? m),
  };
}

export default defineConfig({
  plugins: [versionStamp(), viteSingleFile()],
  server: { host: "0.0.0.0", port: 5000 },
  preview: { host: "0.0.0.0", port: 5000 },
  build: {
    target: "es2022",
    modulePreload: false, // the preload polyfill injects fetch(); a single file has nothing to preload
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    minify: "esbuild",
    reportCompressedSize: false,
  },
  esbuild: { legalComments: "none" },
});
