import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle everything - no external dependencies needed at runtime
  noExternal: [/.*/],
  // Only keep Node.js built-ins as external
  external: [
    "node:*",
  ],
});
