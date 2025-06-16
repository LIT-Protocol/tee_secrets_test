import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["index.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  loader: { ".wasm": "base64" },
  outfile: "dist/bundle.js",
  banner: {
    js: `(async () => {
      const { Buffer } = await import("node:buffer");
      globalThis.Buffer = Buffer;
    `,
  },
  footer: {
    js: "})().catch(err => console.error(err));",
  },
});
