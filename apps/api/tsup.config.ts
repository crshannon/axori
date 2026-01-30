import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Bundle workspace dependencies to avoid import issues
  noExternal: ["@axori/db", "@axori/shared", "@axori/permissions"],
});
